import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPaymentMethods, deletePaymentMethod, setDefaultPaymentMethod } from '../services/users';

export default function AccountPaymentsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const res = await getPaymentMethods();
      return res.data.data;
    }
  });

  const delMut = useMutation({
    mutationFn: (id) => deletePaymentMethod(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-methods'] })
  });

  const defMut = useMutation({
    mutationFn: (id) => setDefaultPaymentMethod(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-methods'] })
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{t('account.payments')}</h1>
      <p className="mt-2 text-sm text-slate-600">
        Cartes enregistrées via Stripe (identifiants fournis par l’API lors d’un paiement enregistré).
      </p>
      {isLoading ? <p className="mt-4">{t('common.loading')}</p> : null}
      <ul className="mt-4 space-y-3">
        {(data || []).map((pm) => (
          <li key={pm.id} className="card flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">
                {pm.brand || 'Carte'} ·••• {pm.last4}
              </p>
              <p className="text-xs text-slate-500">{pm.type}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary text-xs" onClick={() => defMut.mutate(pm.id)}>
                Défaut
              </button>
              <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => delMut.mutate(pm.id)}>
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
      {data?.length === 0 ? <p className="mt-4 text-slate-500">Aucun moyen de paiement enregistré.</p> : null}
    </div>
  );
}
