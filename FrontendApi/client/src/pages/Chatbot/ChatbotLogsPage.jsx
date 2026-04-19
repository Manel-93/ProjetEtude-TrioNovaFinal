import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getChatbotConversations } from '../../services/chatbotService';

export default function ChatbotLogsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-chatbot-conversations', page, status],
    queryFn: async () => {
      const res = await getChatbotConversations({ page, limit: 20, status: status || undefined });
      return res.data;
    }
  });

  const rows = data?.data || [];
  const pagination = data?.pagination || {};

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Conversations chatbot</h2>
          <p className="text-sm text-slate-500">Historique centralisé des échanges automatiques et des escalades support.</p>
        </div>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Statut</span>
          <select className="input min-w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tous</option>
            <option value="open">Ouvert</option>
            <option value="pending_human">En attente humaine</option>
            <option value="closed">Clos</option>
          </select>
        </label>
      </header>

      {isLoading ? <div className="card p-6 text-sm text-slate-700">Chargement des conversations...</div> : null}
      {error ? <div className="card p-6 text-sm text-red-600">Impossible de charger les conversations chatbot.</div> : null}

      {!isLoading && !error && rows.length === 0 ? (
        <div className="card p-6 text-sm text-slate-700">Aucune conversation trouvée.</div>
      ) : null}

      {!isLoading && !error && rows.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Session</th>
                  <th className="px-4 py-3 font-medium">Profil</th>
                  <th className="px-4 py-3 font-medium">Dernier message</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">MAJ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.sessionId}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <div>{row.contactProfile?.name || 'Non renseigné'}</div>
                      <div className="text-xs text-slate-500">{row.contactProfile?.email || 'Sans email'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="line-clamp-2">{row.lastMessage?.message || '-'}</div>
                      <div className="text-xs text-slate-500">{row.messageCount} message(s)</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.status}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.updatedAt ? new Date(row.updatedAt).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card flex items-center justify-between p-4 text-sm text-slate-700">
            <span>Total : {pagination.total || rows.length}</span>
            <div className="flex items-center gap-2">
              <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Précédent
              </button>
              <span>
                Page {pagination.page || page} / {pagination.totalPages || 1}
              </span>
              <button
                className="btn-secondary"
                disabled={page >= (pagination.totalPages || 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </button>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

