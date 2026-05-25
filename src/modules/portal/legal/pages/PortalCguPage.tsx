import { LEGAL } from '@/config/legal.constants'
import { PORTAL_ROUTES } from '@/config/portal.routes'
import { LegalProse, LegalSection } from '@/modules/portal/legal/components/LegalProse'
import { PortalLegalPublicLayout } from '@/modules/portal/legal/components/PortalLegalPublicLayout'
import { usePortalPageMeta } from '@/modules/portal/legal/hooks/usePortalPageMeta'

export function PortalCguPage() {
  usePortalPageMeta({
    title: 'Conditions générales d’utilisation',
    description: `CGU du portail client ${LEGAL.companyName} — droits, obligations et usage du service.`,
    robots: 'index, follow',
    canonical: `${LEGAL.portalUrl}${PORTAL_ROUTES.CGU}`,
  })

  return (
    <PortalLegalPublicLayout
      title="Conditions générales d’utilisation"
      subtitle={`Portail client — version ${LEGAL.lastUpdated}`}
    >
      <LegalProse>
        <p>
          Les présentes conditions générales d’utilisation (ci-après « CGU ») régissent l’accès et
          l’usage du portail {LEGAL.productName}, proposé par {LEGAL.companyName} à l’adresse{' '}
          <a href={LEGAL.portalUrl}>{LEGAL.portalUrl}</a>. En créant un compte ou en vous
          connectant, vous acceptez ces CGU sans réserve.
        </p>

        <LegalSection title="1. Définitions">
          <ul>
            <li>
              <strong>Portail</strong> : l’espace en ligne permettant le suivi SAV, la messagerie,
              la consultation de devis/factures et les notifications.
            </li>
            <li>
              <strong>Utilisateur</strong> : client de {LEGAL.companyName} disposant d’un accès
              activé par l’atelier.
            </li>
            <li>
              <strong>Atelier</strong> : {LEGAL.companyName}, prestataire de réparation.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="2. Accès au service">
          <p>L’accès est subordonné à :</p>
          <ul>
            <li>La fourniture d’un code d’activation valide par l’atelier</li>
            <li>La création d’un compte personnel (e-mail + mot de passe)</li>
            <li>La confirmation de l’adresse e-mail lorsque cette étape est activée</li>
          </ul>
          <p>
            L’atelier peut suspendre ou retirer un accès en cas de fin de relation commerciale,
            d’usage frauduleux ou de non-respect des présentes CGU.
          </p>
        </LegalSection>

        <LegalSection title="3. Description des fonctionnalités">
          <p>Le portail permet notamment :</p>
          <ul>
            <li>Le suivi en temps réel (ou différé) de vos réparations</li>
            <li>La consultation de devis et factures liés à votre dossier</li>
            <li>L’échange de messages avec l’atelier</li>
            <li>La réception de notifications relatives à votre SAV</li>
            <li>Un mode de consultation limité hors connexion via cache local technique</li>
          </ul>
          <p>
            Les fonctionnalités peuvent évoluer. Les informations affichées sont indicatives du
            traitement en cours ; seuls les documents validés par l’atelier engagent contractuellement
            les parties.
          </p>
        </LegalSection>

        <LegalSection title="4. Obligations de l’utilisateur">
          <p>Vous vous engagez à :</p>
          <ul>
            <li>Fournir des informations exactes lors de l’inscription</li>
            <li>Conserver la confidentialité de vos identifiants</li>
            <li>Ne pas tenter d’accéder aux données d’autres clients</li>
            <li>Utiliser la messagerie de manière courtoise et liée au SAV</li>
            <li>Ne pas perturber le fonctionnement du portail (intrusion, scraping, surcharge)</li>
          </ul>
          <p>
            Tout manquement peut entraîner la suspension immédiate du compte, sans préjudice des
            recours de l’atelier.
          </p>
        </LegalSection>

        <LegalSection title="5. Disponibilité du service">
          <p>
            {LEGAL.companyName} vise une disponibilité continue du portail, sous réserve des
            opérations de maintenance et des aléas liés aux réseaux ou prestataires (hébergement,
            synchronisation cloud).
          </p>
          <p>
            En cas d’indisponibilité, vous pouvez contacter l’atelier par les moyens habituels
            (téléphone, e-mail, accueil). Le cache local peut permettre une lecture partielle hors
            ligne, sans garantie d’actualisation.
          </p>
        </LegalSection>

        <LegalSection title="6. Responsabilité">
          <p>
            L’atelier est responsable de la prestation de réparation conformément au contrat
            commercial conclu avec vous. Le portail est un outil d’information et de communication
            : une erreur d’affichage temporaire ne saurait, à elle seule, engager une responsabilité
            supplémentaire dès lors que l’atelier corrige l’information dans des délais raisonnables.
          </p>
          <p>
            {LEGAL.companyName} décline toute responsabilité en cas de force majeure, de mauvaise
            utilisation du portail, ou de dommages indirects (perte de profit, perte de données due à
            un équipement utilisateur non sécurisé).
          </p>
        </LegalSection>

        <LegalSection title="7. Propriété intellectuelle">
          <p>
            Le portail, sa charte et ses composants restent la propriété de {LEGAL.companyName} ou
            de ses partenaires. Aucune licence n’est concédée au-delà d’un usage personnel dans le
            cadre du SAV.
          </p>
        </LegalSection>

        <LegalSection title="8. Données personnelles">
          <p>
            Le traitement de vos données est décrit dans la{' '}
            <a href={PORTAL_ROUTES.PRIVACY}>politique de confidentialité</a>. Vous disposez des
            droits prévus par le RGPD (accès, rectification, suppression, etc.) en écrivant à{' '}
            <a href={LEGAL.emailHref}>{LEGAL.email}</a>.
          </p>
        </LegalSection>

        <LegalSection title="9. Durée et résiliation">
          <p>
            Les CGU s’appliquent pendant toute la durée d’utilisation du portail. Vous pouvez
            cesser d’utiliser le service à tout moment. L’atelier peut fermer votre accès avec
            information préalable lorsque la situation le permet.
          </p>
        </LegalSection>

        <LegalSection title="10. Modifications des CGU">
          <p>
            Les CGU peuvent être modifiées pour refléter une évolution légale ou fonctionnelle. La
            date de mise à jour est indiquée en en-tête. En cas de changement majeur, une
            information pourra vous être adressée par e-mail ou notification portail.
          </p>
        </LegalSection>

        <LegalSection title="11. Droit applicable — litiges">
          <p>
            Les présentes CGU sont soumises au droit français. En cas de litige, une solution
            amiable sera recherchée via {LEGAL.email}. À défaut, et sous réserve des dispositions
            protectrices applicables aux consommateurs, compétence des tribunaux du ressort du
            siège de l’atelier.
          </p>
        </LegalSection>

        <LegalSection title="12. Contact">
          <p>
            {LEGAL.companyName} — {LEGAL.addressLine1}, {LEGAL.addressLine2}
            <br />
            <a href={LEGAL.emailHref}>{LEGAL.email}</a>
            <br />
            <a href={LEGAL.siteUrl} target="_blank" rel="noopener noreferrer">
              {LEGAL.siteUrl}
            </a>
          </p>
        </LegalSection>
      </LegalProse>
    </PortalLegalPublicLayout>
  )
}
