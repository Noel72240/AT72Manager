use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

#[derive(serde::Serialize)]
pub struct GoogleOAuthLoopbackResult {
    pub code: String,
    pub redirect_uri: String,
}

const OAUTH_TIMEOUT_SECS: u64 = 120;

#[tauri::command]
pub async fn google_oauth_loopback(
    app: AppHandle,
    client_id: String,
    scope: String,
    code_challenge: String,
) -> Result<GoogleOAuthLoopbackResult, String> {
    let server = tiny_http::Server::http("127.0.0.1:0").map_err(|e| format!("Serveur OAuth local: {e}"))?;
    let port = server
        .server_addr()
        .to_ip()
        .ok_or("Adresse loopback OAuth invalide")?
        .port();
    let redirect_uri = format!("http://127.0.0.1:{port}");

    let auth_url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id={}&redirect_uri={}&response_type=code&scope={}&code_challenge={}&code_challenge_method=S256&access_type=offline&prompt=consent",
        urlencoding::encode(&client_id),
        urlencoding::encode(&redirect_uri),
        urlencoding::encode(&scope),
        urlencoding::encode(&code_challenge),
    );

    app.opener()
        .open_url(auth_url, None::<&str>)
        .map_err(|e| format!("Impossible d'ouvrir le navigateur: {e}"))?;

    let redirect_for_response = redirect_uri.clone();
    let code = tauri::async_runtime::spawn_blocking(move || wait_for_oauth_code(server))
        .await
        .map_err(|e| format!("OAuth interrompu: {e}"))??;

    Ok(GoogleOAuthLoopbackResult {
        code,
        redirect_uri: redirect_for_response,
    })
}

fn wait_for_oauth_code(server: tiny_http::Server) -> Result<String, String> {
    let request = server
        .recv_timeout(std::time::Duration::from_secs(OAUTH_TIMEOUT_SECS))
        .map_err(|e| format!("Délai OAuth dépassé ({OAUTH_TIMEOUT_SECS}s): {e}"))?
        .ok_or_else(|| "Connexion Google fermée sans réponse".to_string())?;

    let url = request.url().to_string();

    let result = if let Some(error) = parse_query_param(&url, "error") {
        let description = parse_query_param(&url, "error_description").unwrap_or(error);
        Err(description)
    } else if let Some(code) = parse_query_param(&url, "code") {
        Ok(code)
    } else {
        Err("Code OAuth absent dans la réponse Google".to_string())
    };

    respond_html(request, result.is_ok());
    result
}

fn parse_query_param(url: &str, key: &str) -> Option<String> {
    let query = url.split('?').nth(1)?;
    for pair in query.split('&') {
        let mut parts = pair.splitn(2, '=');
        if parts.next()? == key {
            let value = parts.next()?;
            return Some(urlencoding::decode(value).ok()?.into_owned());
        }
    }
    None
}

fn respond_html(request: tiny_http::Request, success: bool) {
    let title = if success { "Connexion réussie" } else { "Connexion échouée" };
    let message = if success {
        "Vous pouvez fermer cette fenêtre et revenir à AT72Manager."
    } else {
        "Revenez à AT72Manager et réessayez."
    };
    let html = format!(
        r#"<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>{title}</title></head><body style="font-family:Segoe UI,sans-serif;text-align:center;padding:48px;background:#0b1220;color:#e2e8f0"><h1 style="color:#22d3ee">AT72Manager</h1><p>{message}</p></body></html>"#
    );
    let header = tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"text/html; charset=utf-8"[..])
        .expect("header Content-Type valide");
    let response = tiny_http::Response::from_string(html).with_header(header);
    let _ = request.respond(response);
}
