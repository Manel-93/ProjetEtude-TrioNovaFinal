import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getChatbotConversationDetail, getChatbotConversations } from '../../services/chatbotService';

export default function ChatbotLogsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [detailSessionId, setDetailSessionId] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-chatbot-conversations', page, status],
    queryFn: async () => {
      const res = await getChatbotConversations({ page, limit: 20, status: status || undefined });
      return res.data;
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000
  });

  const {
    data: detailDoc,
    isLoading: detailLoading,
    error: detailError
  } = useQuery({
    queryKey: ['admin-chatbot-detail', detailSessionId],
    queryFn: async () => {
      const res = await getChatbotConversationDetail(detailSessionId);
      return res.data?.data;
    },
    enabled: Boolean(detailSessionId),
    retry: false,
    refetchOnWindowFocus: false
  });

  const rows = data?.data || [];
  const pagination = data?.pagination || {};

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Conversations chatbot</h2>
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
      {error ? (
        <div className="card p-6 text-sm text-red-600">
          {error?.response?.status === 429
            ? 'Trop de requêtes vers le chatbot. Patientez quelques secondes puis rechargez la page.'
            : 'Impossible de charger les conversations chatbot.'}
        </div>
      ) : null}

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
                  <th className="px-4 py-3 font-medium"> </th>
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
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-xs font-medium text-ocean hover:underline"
                        onClick={() => setDetailSessionId(row.sessionId)}
                      >
                        Transcript
                      </button>
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

      {detailSessionId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Fermer"
            onClick={() => setDetailSessionId(null)}
          />
          <div className="relative max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Conversation</h3>
              <button type="button" className="btn-secondary text-xs" onClick={() => setDetailSessionId(null)}>
                Fermer
              </button>
            </div>
            <div className="max-h-[calc(85vh-3.5rem)] overflow-y-auto p-4 text-sm">
              {detailLoading ? <p className="text-slate-600">Chargement…</p> : null}
              {detailError ? <p className="text-red-600">Impossible de charger le détail.</p> : null}
              {!detailLoading && !detailError && detailDoc ? (
                <div className="space-y-3">
                  <p className="font-mono text-xs text-slate-500">sessionId : {detailDoc.sessionId}</p>
                  <p className="text-xs text-slate-600">
                    Statut : {detailDoc.status} — escaladé : {detailDoc.isEscalated ? 'oui' : 'non'}
                  </p>
                  {(detailDoc.messages || []).map((m, i) => (
                    <div
                      key={`${m.sender}-${i}`}
                      className={`rounded-xl border px-3 py-2 ${
                        m.sender === 'user' ? 'ml-8 border-ocean/30 bg-ocean/5' : 'mr-8 border-slate-100 bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-semibold uppercase text-slate-500">{m.sender}</div>
                      <p className="mt-1 whitespace-pre-wrap text-slate-800">{m.message}</p>
                      {m.faqMatchedQuestion ? (
                        <p className="mt-1 text-xs text-teal-700">FAQ : {m.faqMatchedQuestion}</p>
                      ) : null}
                      {m.createdAt ? (
                        <p className="mt-1 text-[10px] text-slate-400">{new Date(m.createdAt).toLocaleString()}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
