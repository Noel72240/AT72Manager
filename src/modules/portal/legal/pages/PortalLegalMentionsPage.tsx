import { LEGAL } from '@/config/legal.constants'
import { PORTAL_ROUTES } from '@/config/portal.routes'
import { LegalProse, LegalSection } from '@/modules/portal/legal/components/LegalProse'
import { PortalLegalPublicLayout } from '@/modules/portal/legal/components/PortalLegalPublicLayout'
import { usePortalPageMeta } from '@/modules/portal/legal/hooks/usePortalPageMeta'

export function PortalLegalMentionsPage() {
  usePortalPageMeta({
    title: 'Mentions légales',
    description: `Mentions légales du portail client ${LEGAL.companyName} — éditeur, hébergement, propriété intellectuelle.`,
    robots: 'index, follow',
    canonical: `${LEGAL.portalUrl}${PORTAL_ROUTES.MENTIONS_LEGALES}`,
  })

  return (
    <PortalLegalPublicLayout
      title="Mentions légales"
      subtitle={`Dernière mise à jour : ${LEGAL.lastUpdated}`}
    >
      <LegalProse>
        <LegalSection title="1. Éditeur du site">
          <p>
            Le portail client accessible à l’adresse{' '}
            <a href={LEGAL.portalUrl}>{LEGAL.portalUrl}</a> est édité par :
          </p>
          <ul>
            <li>
              <strong>{LEGAL.companyName}</strong> — {LEGAL.legalForm}
            </li>
            <li>Dirigeant : {LEGAL.director}</li>
            <li>
              Siège : {LEGAL.addressLine1}, {LEGAL.addressLine2}, {LEGAL.country}
            </li>
            <li>SIREN : {LEGAL.siren} — SIRET : {LEGAL.siret}</li>
            <li>N° TVA intracommunautaire : {LEGAL.vat}</li>
            <li>Activité : {LEGAL.activity}</li>
            <li>
              Contact :{' '}
              <a href={LEGAL.emailHref}>{LEGAL.email}</a>
            </li>
            <li>
              Site vitrine :{' '}
              <a href={LEGAL.siteUrl} target="_blank" rel="noopener noreferrer">
                {LEGAL.siteUrl}
              </a>
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="2. Objet du portail">
          <p>
            {LEGAL.productName} permet aux clients de {LEGAL.companyName} de suivre leurs
            réparations, consulter devis et factures, échanger des messages avec l’atelier et
            recevoir des notifications liées au service après-vente. L’accès est réservé aux
            clients disposant d’un code d’activation fourni par l’atelier.
          </p>
        </LegalSection>

        <LegalSection title="3. Directeur de la publication">
          <p>
            Le directeur de la publication est <strong>{LEGAL.director}</strong>, en qualité de
            dirigeant de {LEGAL.companyName}.
          </p>
        </LegalSection>

        <LegalSection title="4. Hébergement">
          <p>L’interface web du portail est hébergée par :</p>
          <ul>
            <li>
              <strong>{LEGAL.hostingProvider}</strong>
            </li>
            <li>{LEGAL.hostingAddress}</li>
          </ul>
          <p>
            Les données applicatives (comptes, messages, historiques) sont stockées via la
            plateforme <strong>{LEGAL.databaseProvider}</strong>, dans une infrastructure cloud
            ({LEGAL.databaseRegion}).
          </p>
        </LegalSection>

        <LegalSection title="5. Propriété intellectuelle">
          <p>
            L’ensemble des éléments du portail (textes, charte graphique, logos, structure,
            logiciels) est protégé par le droit de la propriété intellectuelle. Toute
            reproduction ou exploitation non autorisée est interdite.
          </p>
          <p>
            Les marques et logos mentionnés restent la propriété de leurs titulaires respectifs.
          </p>
        </LegalSection>

        <LegalSection title="6. Sécurité et accès">
          <p>
            Les échanges entre votre navigateur et le portail sont chiffrés par le protocole{' '}
            <strong>HTTPS</strong>. L’authentification est assurée par un prestataire tiers
            sécurisé (Supabase Auth). Chaque client n’accède qu’à ses propres données, conformément
            aux règles d’accès définies par l’atelier.
          </p>
        </LegalSection>

        <LegalSection title="7. Limitation de responsabilité">
          <p>
            {LEGAL.companyName} s’efforce d’assurer l’exactitude des informations affichées
            (statuts de réparation, montants, documents). Toutefois, en cas de divergence, les
            informations validées par l’atelier (devis signé, facture émise) font foi.
          </p>
          <p>
            L’éditeur ne saurait être tenu responsable des interruptions liées à la maintenance,
            aux opérations de ses prestataires techniques ou à un usage non conforme du service par
            l’utilisateur.
          </p>
        </LegalSection>

        <LegalSection title="8. Liens utiles">
          <p>
            Pour le traitement de vos données personnelles, consultez la{' '}
            <a href={PORTAL_ROUTES.PRIVACY}>politique de confidentialité</a>. Les conditions
            d’utilisation du portail figurent dans les{' '}
            <a href={PORTAL_ROUTES.CGU}>conditions générales d’utilisation (CGU)</a>.
          </p>
        </LegalSection>

        <LegalSection title="9. Médiation et droit applicable">
          <p>
            En cas de litige, vous pouvez contacter {LEGAL.email} en priorité. À défaut de
            résolution amiable, les tribunaux français seront compétents, sous réserve des règles
            d’ordre public applicables aux consommateurs.
          </p>
          <p>Le droit français s’applique au présent site.</p>
        </LegalSection>
      </LegalProse>
    </PortalLegalPublicLayout>
  )
}
