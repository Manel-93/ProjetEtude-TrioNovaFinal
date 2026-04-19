import { useTranslation } from 'react-i18next';

const testEntries = [
  {
    key: 'testsUnit.smokePages',
    file: 'src/pages/pages.smoke.test.jsx'
  },
  {
    key: 'testsUnit.orderHistory',
    file: 'src/utils/orderHistory.test.js'
  }
];

export default function UnitTestsPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">{t('testsUnit.title')}</h1>
        <p className="text-slate-600">{t('testsUnit.subtitle')}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {testEntries.map((entry) => (
          <article key={entry.key} className="card space-y-3 p-5">
            <h2 className="text-lg font-semibold text-slate-900">{t(`${entry.key}.title`)}</h2>
            <p className="text-sm text-slate-600">{t(`${entry.key}.description`)}</p>
            <p className="text-xs text-slate-500">
              {t('testsUnit.fileLabel')}: <code>{entry.file}</code>
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
