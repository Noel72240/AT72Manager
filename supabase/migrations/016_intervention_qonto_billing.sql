-- Facturation externe (Qonto) — champs sur interventions
-- Les tables quotes/invoices restent en base pour compatibilité historique.

alter table public.interventions
  add column if not exists deposit_amount numeric(12, 2),
  add column if not exists payment_status text not null default 'none',
  add column if not exists billed_via_qonto boolean not null default false,
  add column if not exists external_invoice_ref text,
  add column if not exists qonto_document_url text;

comment on column public.interventions.deposit_amount is 'Acompte versé (€)';
comment on column public.interventions.payment_status is 'none | deposit_paid | paid | waived';
comment on column public.interventions.billed_via_qonto is 'Facturé via Qonto';
comment on column public.interventions.external_invoice_ref is 'Référence facture Qonto / externe';
comment on column public.interventions.qonto_document_url is 'Lien direct document Qonto';
