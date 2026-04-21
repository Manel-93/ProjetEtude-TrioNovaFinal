import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Facebook, Linkedin } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto hidden border-t border-slate-200/90 bg-gradient-to-b from-white via-slate-50/60 to-slate-100/60 py-12 text-sm text-slate-600 md:block">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-3 lg:px-8">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-900">{t('footer.legal')}</p>
          <p className="max-w-sm leading-relaxed text-slate-600">
            {t('footer.compliance')}
          </p>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link to="/mentions-legales" className="inline-flex rounded-full border border-ocean/20 bg-white px-3 py-1.5 text-ocean transition hover:-translate-y-0.5 hover:border-ocean/40 hover:bg-ocean/5">
              {t('footer.legalNotice')}
            </Link>
            <Link to="/politique-confidentialite" className="inline-flex rounded-full border border-ocean/20 bg-white px-3 py-1.5 text-ocean transition hover:-translate-y-0.5 hover:border-ocean/40 hover:bg-ocean/5">
              {t('footer.privacyPolicy')}
            </Link>
            <Link to="/cgv" className="inline-flex rounded-full border border-ocean/20 bg-white px-3 py-1.5 text-ocean transition hover:-translate-y-0.5 hover:border-ocean/40 hover:bg-ocean/5">
              {t('footer.cgv')}
            </Link>
          </div>
          <Link to="/tests-unitaires" className="inline-block text-ocean transition hover:underline">
            {t('testsUnit.title')}
          </Link>
        </div>
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-ink">{t('footer.contact')}</p>
          <a href="mailto:altheasystems@outlook.fr" className="inline-flex items-center gap-2 text-ocean transition hover:underline">
            <Mail className="h-4 w-4" aria-hidden />
            altheasystems@outlook.fr
          </a>
        </div>
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-ink">{t('footer.social')}</p>
          <div className="flex gap-3">
            <a href="#" className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-ink" aria-label="Facebook">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-ink" aria-label="LinkedIn">
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
      <p className="mt-10 text-center text-xs text-slate-500">{t('footer.rights', { year })}</p>
    </footer>
  );
}
