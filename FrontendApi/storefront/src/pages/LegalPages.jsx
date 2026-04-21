import { useTranslation } from 'react-i18next';

function LegalPageShell({ title, updatedAt, children }) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">{updatedAt}</p>
      </header>
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 shadow-sm">
        {children}
      </section>
    </div>
  );
}

export function LegalNoticePage() {
  const { t } = useTranslation();
  return (
    <LegalPageShell
      title={t('legal.noticeTitle', { defaultValue: 'Mentions légales' })}
      updatedAt={t('legal.updatedAt', { defaultValue: 'Dernière mise à jour : avril 2026' })}
    >
      <p>
        {t('legal.noticeIntro', {
          defaultValue:
            "Le site AltheaSystems est édité à des fins d'information et de commerce électronique de matériel médical."
        })}
      </p>
      <p>
        {t('legal.noticeHost', {
          defaultValue:
            "Pour toute question juridique, vous pouvez nous contacter à l'adresse altheasystems@outlook.fr."
        })}
      </p>
    </LegalPageShell>
  );
}

export function PrivacyPolicyPage() {
  const { t } = useTranslation();
  return (
    <LegalPageShell
      title={t('legal.privacyTitle', { defaultValue: 'Politique de confidentialité (RGPD)' })}
      updatedAt={t('legal.updatedAt', { defaultValue: 'Dernière mise à jour : avril 2026' })}
    >
      <p>
        {t('legal.privacyIntro', {
          defaultValue:
            'Nous collectons uniquement les données nécessaires au traitement des commandes, au support client et à la sécurité des comptes.'
        })}
      </p>
      <p>
        {t('legal.privacyRights', {
          defaultValue:
            "Vous disposez d'un droit d'accès, de rectification et de suppression de vos données, conformément au RGPD."
        })}
      </p>
      <p>
        {t('legal.privacyContact', {
          defaultValue:
            'Pour exercer ces droits, contactez-nous via le formulaire de contact ou par email à altheasystems@outlook.fr.'
        })}
      </p>
    </LegalPageShell>
  );
}

export function TermsSalesPage() {
  const { t } = useTranslation();
  return (
    <LegalPageShell
      title={t('legal.cgvTitle', { defaultValue: 'CGV - Conditions Générales de Vente' })}
      updatedAt={t('legal.updatedAt', { defaultValue: 'Dernière mise à jour : avril 2026' })}
    >
      <p>
        {t('legal.cgvIntro', {
          defaultValue:
            "Les présentes CGV définissent les modalités de commande, paiement, livraison et retour applicables aux achats effectués sur AltheaSystems."
        })}
      </p>
      <p>
        {t('legal.cgvPricing', {
          defaultValue:
            'Les prix affichés sont en euros et incluent les taxes applicables, sauf indication contraire.'
        })}
      </p>
      <p>
        {t('legal.cgvSupport', {
          defaultValue:
            'En cas de litige ou de question relative à une commande, notre support client reste joignable via la page Contact.'
        })}
      </p>
    </LegalPageShell>
  );
}
