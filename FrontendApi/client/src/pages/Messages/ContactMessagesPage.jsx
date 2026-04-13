import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Table from '../../components/ui/Table';
import { getContactMessages } from '../../services/contactMessageService';

export default function ContactMessagesPage() {
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  const columns = [
    { header: 'Email', accessor: 'email' },
    { header: 'Sujet', accessor: 'subject' },
    { header: 'Message', accessor: 'message' },
    { header: 'Date', accessor: 'date' }
  ];

  const {
    data,
    isLoading,
    isFetching
  } = useQuery({
    queryKey: ['contact-messages', page],
    queryFn: async () => {
      setError('');
      const res = await getContactMessages({ page, limit: 20 });
      return res.data;
    },
    keepPreviousData: true,
    onError: (err) => {
      setError(err?.response?.data?.error?.message || 'Impossible de charger les messages de contact.');
    }
  });

  const messages = data?.data || [];
  const pagination = data?.pagination || {};
  const totalPages = pagination.totalPages || 1;
  const totalItems = pagination.total || 0;
  const loading = isLoading || isFetching;

  const handleChangePage = (next) => {
    setPage(next);
  };

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Messages de contact</h2>
          <p className="text-sm text-slate-500">
            Messages envoyés par les utilisateurs via le formulaire de contact.
          </p>
        </div>
      </header>

      {loading && <div className="card p-6">Chargement des messages...</div>}
      {error && <div className="card border-red-200 p-6 text-red-600">{error}</div>}

      {!loading && !error && messages.length === 0 && (
        <div className="card p-6 text-sm text-slate-500">Aucun message trouvé.</div>
      )}

      {!loading && !error && messages.length > 0 && (
        <>
          <Table columns={columns} caption="Messages de contact">
            {messages.map((msg) => (
              <tr key={msg.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-sm text-slate-800">{msg.email}</td>
                <td className="px-4 py-3 text-sm text-slate-800">{msg.subject}</td>
                <td className="px-4 py-3 text-sm text-slate-700 line-clamp-2">{msg.message}</td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : '-'}
                </td>
              </tr>
            ))}
          </Table>

          <div className="card mt-3 flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-slate-600">Total messages : {totalItems}</p>
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary"
                disabled={page <= 1}
                onClick={() => handleChangePage(page - 1)}
              >
                Précédent
              </button>
              <span className="text-slate-700">
                Page {page} / {totalPages}
              </span>
              <button
                className="btn-secondary"
                disabled={page >= totalPages}
                onClick={() => handleChangePage(page + 1)}
              >
                Suivant
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

