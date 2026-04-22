import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { downloadMyCreditPdf, getMyCredits } from '../services/users';
import { getApiError } from '../utils/errors';

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR');
}

export default function AccountCreditsPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-credits'],
    queryFn: async () => {
      const res = await getMyCredits({ page: 1, limit: 50 });
      return res.data;
    }
  });

  const credits = data?.data || [];
  const downloadPdf = async (credit) => {
    const res = await downloadMyCreditPdf(credit.id);
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avoir-${credit.creditNoteNumber || credit.id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Mes avoirs</h1>
      <div className="card p-4">
        <p className="text-sm text-slate-600">Solde disponible</p>
        <p className="text-2xl font-bold text-ocean">{Number(user?.creditBalance || 0).toFixed(2)} EUR</p>
      </div>

      {isLoading ? <p className="text-slate-500">Chargement...</p> : null}
      {error ? <p className="text-red-600">{getApiError(error)}</p> : null}

      {!isLoading && !error ? (
        credits.length === 0 ? (
          <p className="text-slate-500">Aucun avoir pour le moment.</p>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Avoir</th>
                  <th className="px-4 py-3 font-medium">Montant</th>
                  <th className="px-4 py-3 font-medium">Motif</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {credits.map((credit) => (
                  <tr key={credit.id}>
                    <td className="px-4 py-3 text-slate-800">{credit.creditNoteNumber}</td>
                    <td className="px-4 py-3 text-slate-700">{Number(credit.amount || 0).toFixed(2)} EUR</td>
                    <td className="px-4 py-3 text-slate-700">{credit.reason || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(credit.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button type="button" className="btn-secondary" onClick={() => downloadPdf(credit)}>
                        Télécharger PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}
    </div>
  );
}
