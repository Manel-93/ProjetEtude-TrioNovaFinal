import { useTranslation } from 'react-i18next';
import { Mail, Facebook, Linkedin } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto hidden border-t border-slate-200/90 bg-surface/60 py-10 text-sm text-slate-600 md:block">
      <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-8 px-4 lg:px-8">
        <div>
          <p className="font-semibold text-slate-900">{t('footer.legal')}</p>
          <p className="mt-1 max-w-xs">
            AltheaSystems — commerce électronique. Données traitées conformément à la réglementation applicable.
          </p>
        </div>
        <div>
          <p className="font-semibold text-ink">{t('footer.contact')}</p>
          <a href="mailto:altheasystems@outlook.fr" className="mt-1 inline-flex items-center gap-2 text-ocean hover:underline">
            <Mail className="h-4 w-4" aria-hidden />
            altheasystems@outlook.fr
          </a>
        </div>
        <div>
          <p className="font-semibold text-ink">{t('footer.social')}</p>
          <div className="mt-2 flex gap-3">
            <a href="#" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-ink" aria-label="Facebook">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-ink" aria-label="LinkedIn">
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
      <p className="mt-8 text-center text-xs text-slate-500">{t('footer.rights', { year })}</p>
    </footer>
  );
}
