import { LEGAL } from '@/config/legal.constants'
import { PORTAL_ROUTES } from '@/config/portal.routes'
import { LegalProse, LegalSection } from '@/modules/portal/legal/components/LegalProse'
import { PortalLegalPublicLayout } from '@/modules/portal/legal/components/PortalLegalPublicLayout'
import { usePortalPageMeta } from '@/modules/portal/legal/hooks/usePortalPageMeta'

export function PortalPrivacyPolicyPage() {
  usePortalPageMeta({
    title: 'Politique de confidentialité',
    description: `Politique de confidentialité et RGPD du portail client ${LEGAL.companyName}.`,
    robots: 'index, follow',
    canonical: `${LEGAL.portalUrl}${PORTAL_ROUTES.PRIVACY}`,
  })

  return (
    <PortalLegalPublicLayout
      title="Politique de confidentialité"
      subtitle={`Conformité RGPD — mise à jour ${LEGAL.lastUpdated}`}
    >
      <LegalProse>
        <p>
          {LEGAL.companyName}, responsable du traitement pour le portail client, attache une
          importance particulière à la protection de vos données personnelles. La présente politique
          décrit les traitements réalisés via {LEGAL.portalUrl}, dans le respect du Règlement (UE)
          2016/679 (RGPD) et de la loi « Informatique et Libertés ».
        </p>

        <LegalSection id="responsable" title="1. Responsable du traitement">
          <ul>
            <li>{LEGAL.companyName} — {LEGAL.legalForm}</li>
            <li>{LEGAL.director}, dirigeant</li>
            <li>
              {LEGAL.addressLine1}, {LEGAL.addressLine2}, {LEGAL.country}
            </li>
            <li>
              Contact données personnelles :{' '}
              <a href={LEGAL.emailHref}>{LEGAL.dpoContact}</a>
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="2. Données collectées">
          <p>Selon votre utilisation du portail, nous traitons notamment :</p>
          <ul>
            <li>
              <strong>Identité & contact</strong> : nom, prénom, adresse e-mail, téléphone (selon
              fiche client atelier)
            </li>
            <li>
              <strong>Compte portail</strong> : identifiant d’authentification, date de dernière
              connexion, code d’activation atelier
            </li>
            <li>
              <strong>Suivi SAV</strong> : interventions, appareils, statuts, historique de
              réparation, rendez-vous
            </li>
            <li>
              <strong>Documents commerciaux</strong> : devis, factures, validations éventuelles
            </li>
            <li>
              <strong>Messagerie</strong> : contenu des échanges avec l’atelier
            </li>
            <li>
              <strong>Notifications</strong> : alertes liées à votre dossier
            </li>
            <li>
              <strong>Données techniques</strong> : cache local navigateur (lecture hors-ligne
              limitée), journaux de connexion côté hébergeur
            </li>
          </ul>
          <p>
            Nous ne vendons pas vos données. Aucune publicité ciblée n’est diffusée via ce portail.
          </p>
        </LegalSection>

        <LegalSection title="3. Finalités et bases légales">
          <ul>
            <li>
              <strong>Gestion du compte client</strong> — exécution du contrat / mesures
              précontractuelles (accès sécurisé au portail)
            </li>
            <li>
              <strong>Suivi des réparations et communication</strong> — exécution du contrat de
              prestation SAV
            </li>
            <li>
              <strong>Devis, factures, notifications</strong> — exécution du contrat et obligations
              légales comptables
            </li>
            <li>
              <strong>Sécurité du service</strong> — intérêt légitime (prévention des accès non
              autorisés, intégrité des données)
            </li>
            <li>
              <strong>Support & exercice des droits RGPD</strong> — obligation légale et intérêt
              légitime
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="4. Destinataires des données">
          <p>Vos données sont accessibles :</p>
          <ul>
            <li>
              Au personnel habilité de {LEGAL.companyName} (atelier, gestion SAV)
            </li>
            <li>
              À nos sous-traitants techniques strictement nécessaires :
              <strong> {LEGAL.hostingProvider}</strong> (hébergement web),{' '}
              <strong>{LEGAL.databaseProvider}</strong> (authentification et base de données)
            </li>
          </ul>
          <p>
            Ces prestataires interviennent sur instruction documentée et dans le cadre de clauses
            contractuelles adaptées (dont clauses types de la Commission européenne lorsque des
            transferts hors UE sont possibles).
          </p>
        </LegalSection>

        <LegalSection title="5. Sécurité">
          <p>Nous mettons en œuvre des mesures appropriées, notamment :</p>
          <ul>
            <li>Chiffrement des communications (<strong>HTTPS/TLS</strong>)</li>
            <li>Authentification individuelle (e-mail + mot de passe)</li>
            <li>Contrôles d’accès par profil (isolation des dossiers clients côté base de données)</li>
            <li>Hébergement chez des prestataires reconnus pour leur sécurité</li>
          </ul>
          <p>
            Aucun système n’étant infaillible, nous vous invitons à choisir un mot de passe robuste
            et à ne pas le partager.
          </p>
        </LegalSection>

        <LegalSection title="6. Durées de conservation">
          <ul>
            <li>
              <strong>Compte portail actif</strong> : pendant la relation commerciale, puis
              archivage ou suppression selon demande
            </li>
            <li>
              <strong>Messages SAV</strong> : durée utile au suivi, puis archivage aligné sur la
              durée légale de conservation des pièces SAV (généralement 5 ans pour les obligations
              commerciales)
            </li>
            <li>
              <strong>Devis & factures</strong> : 10 ans (obligations comptables et fiscales
              françaises)
            </li>
            <li>
              <strong>Cache local navigateur</strong> : effacé lors de la déconnexion ou
              suppression des données du site dans le navigateur
            </li>
            <li>
              <strong>Journaux techniques</strong> : durée limitée selon les paramètres des
              prestataires (souvent 30 à 90 jours)
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="7. Vos droits (RGPD)">
          <p>Vous disposez des droits suivants :</p>
          <ul>
            <li>Droit d’accès, de rectification et d’effacement</li>
            <li>Droit à la limitation et d’opposition (dans les cas prévus par la loi)</li>
            <li>Droit à la portabilité des données fournies</li>
            <li>Droit de retirer votre consentement lorsque le traitement en dépend</li>
            <li>Droit de définir des directives relatives au sort de vos données après décès</li>
          </ul>
          <p>
            Pour exercer vos droits : <a href={LEGAL.emailHref}>{LEGAL.dpoContact}</a>, en joignant
            une copie d’identité si nécessaire. Réponse sous un mois en principe.
          </p>
          <p>
            Vous pouvez introduire une réclamation auprès de la{' '}
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noopener noreferrer"
            >
              CNIL
            </a>
            .
          </p>
        </LegalSection>

        <LegalSection title="8. Suppression des données">
          <p>
            Vous pouvez demander la fermeture de votre accès portail et la suppression de vos
            données non soumises à une obligation légale de conservation, par e-mail à{' '}
            <a href={LEGAL.emailHref}>{LEGAL.email}</a>. Certaines données (factures, pièces
            comptables) pourront être conservées pour la durée imposée par la loi.
          </p>
        </LegalSection>

        <LegalSection title="9. Cookies et traceurs">
          <p>
            Le portail utilise principalement des <strong>cookies et stockages techniques
            strictement nécessaires</strong> au fonctionnement :
          </p>
          <ul>
            <li>Session d’authentification (Supabase Auth)</li>
            <li>Mémorisation locale limitée pour la consultation hors-ligne (cache technique)</li>
          </ul>
          <p>
            Nous n’utilisons pas de cookies publicitaires sur ce portail. Tout traceur non
            essentiel ferait l’objet d’un consentement préalable.
          </p>
        </LegalSection>

        <LegalSection title="10. Modifications">
          <p>
            Cette politique peut être mise à jour. La date en tête de page sera modifiée en cas de
            changement substantiel. Nous vous encourageons à la consulter régulièrement.
          </p>
        </LegalSection>
      </LegalProse>
    </PortalLegalPublicLayout>
  )
}
