import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { getUsers, updateUserStatus, deleteUser, resetUserPassword } from '../../services/adminUserService';

function extractApiError(err, fallback) {
  const data = err?.response?.data;
  return data?.error?.message || data?.message || fallback;
}

export default function UsersListPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalKind, setModalKind] = useState(null); // 'delete' | 'reset'
  const [targetUserId, setTargetUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [resetError, setResetError] = useState('');

  const [rowBusyId, setRowBusyId] = useState(null);

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['users', page, role, isActiveFilter, search],
    queryFn: async () => {
      const params = {
        page,
        limit: 10
      };
      if (role) params.role = role;
      if (isActiveFilter !== 'all') params.is_active = isActiveFilter;
      if (search) params.search = search;

      const res = await getUsers(params);
      return res.data;
    },
    keepPreviousData: true
  });

  const users = data?.data || [];
  const pagination = data?.pagination || {};
  const totalPages = pagination.totalPages || 1;
  const totalItems = pagination.total || users.length;

  const openModal = (kind, userId) => {
    setModalKind(kind);
    setTargetUserId(userId);
    setModalOpen(true);
    setNewPassword('');
    setSendEmail(true);
    setResetError('');
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalKind(null);
    setTargetUserId(null);
    setResetError('');
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
    }
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, payload }) => resetUserPassword(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
    },
    onError: (err) => {
      setResetError(extractApiError(err, 'Impossible de réinitialiser le mot de passe.'));
    }
  });

  // On laisse l'API valider le format complet du mot de passe.
  // Côté front, on ne bloque que si c'est trop court (>= 8 caractères).
  const trimmedPassword = String(newPassword || '').trim();
  const isPasswordValid = trimmedPassword.length >= 8;

  const toggleStatus = async (u) => {
    setRowBusyId(u.id);
    try {
      await updateUserStatus(u.id, !u.is_active);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } finally {
      setRowBusyId(null);
    }
  };

  const columns = useMemo(
    () => [
      { header: 'ID', accessor: 'id' },
      { header: 'Email', accessor: 'email' },
      { header: 'Prénom', accessor: 'first_name' },
      { header: 'Nom', accessor: 'last_name' },
      { header: 'Rôle', accessor: 'role' },
      { header: 'Actif', accessor: 'is_active' },
      { header: 'Actions', accessor: 'actions' }
    ],
    []
  );

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">Utilisateurs</h2>
          <p className="text-sm text-slate-500">Gestion des comptes (activation, suppression, réinitialisation du mot de passe).</p>
        </div>
      </header>

      <div className="card p-4">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          <div>
            <Input
              label="Recherche"
              id="user-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom ou email..."
              autoComplete="off"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="user-role">
              Rôle
            </label>
            <select
              id="user-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input"
              aria-label="Filtrer par rôle"
            >
              <option value="">Tous</option>
              <option value="ADMIN">ADMIN</option>
              <option value="USER">USER</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="user-active">
              Statut
            </label>
            <select
              id="user-active"
              value={isActiveFilter}
              onChange={(e) => setIsActiveFilter(e.target.value)}
              className="input"
              aria-label="Filtrer par statut d'activation"
            >
              <option value="all">Tous</option>
              <option value="true">Actifs</option>
              <option value="false">Désactivés</option>
            </select>
          </div>
        </form>
      </div>

      {isLoading || isFetching ? <div className="card p-6">Chargement des utilisateurs...</div> : null}
      {isError ? (
        <div className="card border-red-200 p-6 text-red-600">
          {error?.response?.data?.error?.message || 'Impossible de charger les utilisateurs.'}
        </div>
      ) : null}

      {!isLoading && !isError && users.length === 0 ? (
        <div className="card p-6 text-sm text-slate-500">Aucun utilisateur trouvé.</div>
      ) : null}

      {!isLoading && !isError && users.length > 0 ? (
        <>
          <Table columns={columns} caption="Liste des utilisateurs">
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-sm text-slate-700">{u.id}</td>
                <td className="px-4 py-3 text-sm text-slate-800">{u.email}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{u.first_name}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{u.last_name}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{u.role}</td>
                <td className="px-4 py-3 text-sm">
                  {u.is_active ? (
                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-700">
                      Actif
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
                      Désactivé
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <a
                      href={`mailto:${encodeURIComponent(u.email)}`}
                      className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Envoyer un mail
                    </a>
                    <Button
                      variant="secondary"
                      disabled={rowBusyId === u.id}
                      onClick={() => toggleStatus(u)}
                      type="button"
                      className="px-3 py-2"
                    >
                      {rowBusyId === u.id ? '...' : u.is_active ? 'Désactiver' : 'Activer'}
                    </Button>
                    <Button variant="ghost" type="button" className="px-2 py-2" onClick={() => openModal('reset', u.id)}>
                      Réinitialiser
                    </Button>
                    <Button variant="ghost" type="button" className="px-2 py-2 text-red-700" onClick={() => openModal('delete', u.id)}>
                      Supprimer
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>

          <div className="card flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-slate-600">Total utilisateurs : {totalItems}</p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Précédent
              </Button>
              <span className="text-slate-700">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Suivant
              </Button>
            </div>
          </div>
        </>
      ) : null}

      <Modal
        open={modalOpen}
        title={
          modalKind === 'delete' ? 'Supprimer l’utilisateur' : modalKind === 'reset' ? 'Réinitialiser le mot de passe' : ''
        }
        onClose={closeModal}
      >
        {modalKind === 'delete' ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Cette action supprimera définitivement l’utilisateur <span className="font-semibold">{targetUserId}</span>.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={closeModal} type="button">
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={() => deleteMutation.mutate(targetUserId)}
                disabled={deleteMutation.isPending}
                type="button"
              >
                {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        ) : null}

        {modalKind === 'reset' ? (
          <div className="space-y-3">
            <Input
              label="Nouveau mot de passe"
              id="reset-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mot de passe : 8+ caractères (maj, min, chiffre + spécial)"
              error={
                newPassword
                  ? trimmedPassword.length < 8
                    ? 'Trop court (min. 8 caractères).'
                    : undefined
                  : undefined
              }
            />
            {resetError ? <p className="text-sm text-red-600">{resetError}</p> : null}
            <p className="text-xs text-slate-500">
              Règles à respecter : 8+ caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial.
            </p>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="h-4 w-4"
              />
              Envoyer un email de confirmation
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={closeModal} type="button">
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  resetMutation.mutate({
                    id: targetUserId,
                    payload: { newPassword: trimmedPassword, sendEmail }
                  })
                }
                disabled={!isPasswordValid || resetMutation.isPending}
                type="button"
              >
                {resetMutation.isPending ? 'Réinitialisation...' : 'Réinitialiser'}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}

