import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import {
  createAddress,
  deleteAddress,
  getMe,
  createPaymentMethod,
  deletePaymentMethod,
  setDefaultAddress,
  setDefaultPaymentMethod,
  updateAddress,
  updateMe
} from '../../services/userSettingsService';
import { changePassword } from '../../services/authService';

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });

  const {
    data: meRes,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await getMe();
      return res.data.data || res.data;
    },
    staleTime: 1000 * 60
  });

  const me = meRes || {};
  const profileEmail = me?.email || '';
  const addresses = Array.isArray(me?.addresses) ? me.addresses : [];
  const paymentMethods = Array.isArray(me?.paymentMethods) ? me.paymentMethods : [];

  useEffect(() => {
    if (!me) return;
    setProfileForm({
      firstName: me.first_name || me.firstName || '',
      lastName: me.last_name || me.lastName || '',
      phone: me.phone || ''
    });
  }, [me]);

  const updateProfileMutation = useMutation({
    mutationFn: (payload) => updateMe(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    }
  });

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const changePasswordMutation = useMutation({
    mutationFn: (payload) => changePassword(payload),
    onSuccess: async () => {
      setCurrentPassword('');
      setNewPassword('');
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    }
  });

  // Addresses modal
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressMode, setAddressMode] = useState('create'); // create | edit
  const [addressTargetId, setAddressTargetId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    type: 'billing',
    firstName: '',
    lastName: '',
    company: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    country: '',
    phone: ''
  });

  const openCreateAddress = () => {
    setAddressMode('create');
    setAddressTargetId(null);
    setAddressForm({
      type: 'billing',
      firstName: profileForm.firstName || '',
      lastName: profileForm.lastName || '',
      company: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      postalCode: '',
      country: '',
      phone: profileForm.phone || ''
    });
    setAddressModalOpen(true);
  };

  const openEditAddress = (addr) => {
    setAddressMode('edit');
    setAddressTargetId(addr.id);
    setAddressForm({
      type: addr.type || 'billing',
      firstName: addr.firstName || '',
      lastName: addr.lastName || '',
      company: addr.company || '',
      addressLine1: addr.addressLine1 || '',
      addressLine2: addr.addressLine2 || '',
      city: addr.city || '',
      postalCode: addr.postalCode || '',
      country: addr.country || '',
      phone: addr.phone || ''
    });
    setAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    setAddressModalOpen(false);
    setAddressTargetId(null);
    setAddressMode('create');
  };

  const createAddressMutation = useMutation({
    mutationFn: (payload) => createAddress(payload),
    onSuccess: async () => {
      closeAddressModal();
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    }
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAddress(id, payload),
    onSuccess: async () => {
      closeAddressModal();
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    }
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id) => deleteAddress(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    }
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: (id) => setDefaultAddress(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    }
  });

  const [confirmDeleteAddressOpen, setConfirmDeleteAddressOpen] = useState(false);
  const [confirmDeleteAddressId, setConfirmDeleteAddressId] = useState(null);

  // Payment methods modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    stripeCustomerId: '',
    stripePaymentMethodId: '',
    type: 'card',
    last4: '',
    brand: '',
    expiryMonth: '',
    expiryYear: '',
    isDefault: false
  });

  const openCreatePayment = () => {
    setPaymentForm({
      stripeCustomerId: '',
      stripePaymentMethodId: '',
      type: 'card',
      last4: '',
      brand: '',
      expiryMonth: '',
      expiryYear: '',
      isDefault: false
    });
    setPaymentModalOpen(true);
  };

  const closePaymentModal = () => setPaymentModalOpen(false);

  const createPaymentMutation = useMutation({
    mutationFn: (payload) => createPaymentMethod(payload),
    onSuccess: async () => {
      closePaymentModal();
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    }
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (id) => deletePaymentMethod(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    }
  });

  const setDefaultPaymentMutation = useMutation({
    mutationFn: (id) => setDefaultPaymentMethod(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    }
  });

  const billingAddresses = addresses.filter((a) => a.type === 'billing');
  const shippingAddresses = addresses.filter((a) => a.type === 'shipping');

  const paymentColumns = [
    { header: 'Carte', accessor: 'card' },
    { header: 'Type', accessor: 'type' },
    { header: 'Par défaut', accessor: 'isDefault' },
    { header: 'Actions', accessor: 'actions' }
  ];

  const addressColumns = [
    { header: 'Prénom', accessor: 'firstName' },
    { header: 'Nom', accessor: 'lastName' },
    { header: 'Adresse', accessor: 'address' },
    { header: 'Par défaut', accessor: 'isDefault' },
    { header: 'Actions', accessor: 'actions' }
  ];

  const submitProfile = () => {
    const payload = {
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      phone: profileForm.phone
    };
    updateProfileMutation.mutate(payload);
  };

  const submitPassword = () => {
    changePasswordMutation.mutate({
      currentPassword,
      newPassword
    });
  };

  const submitAddress = async () => {
    const payload = {
      type: addressForm.type,
      firstName: addressForm.firstName,
      lastName: addressForm.lastName,
      company: addressForm.company || null,
      addressLine1: addressForm.addressLine1,
      addressLine2: addressForm.addressLine2 || null,
      city: addressForm.city,
      postalCode: addressForm.postalCode,
      country: addressForm.country,
      phone: addressForm.phone || null
    };

    if (addressMode === 'create') {
      await createAddressMutation.mutateAsync(payload);
    } else {
      await updateAddressMutation.mutateAsync({ id: addressTargetId, payload });
    }
  };

  const submitPayment = async () => {
    const expiryMonth = paymentForm.expiryMonth === '' ? null : Number(paymentForm.expiryMonth);
    const expiryYear = paymentForm.expiryYear === '' ? null : Number(paymentForm.expiryYear);
    const payload = {
      stripeCustomerId: paymentForm.stripeCustomerId,
      stripePaymentMethodId: paymentForm.stripePaymentMethodId,
      type: paymentForm.type || 'card',
      last4: paymentForm.last4 || null,
      brand: paymentForm.brand || null,
      expiryMonth,
      expiryYear,
      isDefault: !!paymentForm.isDefault
    };
    await createPaymentMutation.mutateAsync(payload);
  };

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Paramètres</h2>
          <p className="text-sm text-slate-500">Gestion du compte : profil et mot de passe.</p>
        </div>
      </header>

      {isLoading ? <div className="card p-6">Chargement...</div> : null}
      {isError ? (
        <div className="card border-red-200 p-6 text-red-600">
          {error?.response?.data?.error?.message || 'Impossible de charger vos paramètres.'}
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <>
          <div className="card p-4 sm:p-6 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Identité</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {profileForm.firstName} {profileForm.lastName}
                </p>
                <p className="text-sm text-slate-600">Email : {profileEmail || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="md:col-span-1">
                <Input
                  label="Nom"
                  id="firstName"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                />
              </div>
              <div className="md:col-span-1">
                <Input
                  label="Prénom"
                  id="lastName"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="card p-4 sm:p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Sécurité</h3>
            <p className="text-sm text-slate-600">
              Changer le mot de passe (mot de passe actuel requis).
            </p>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Input
                  label="Mot de passe actuel"
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <Input
                  label="Nouveau mot de passe"
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={submitPassword}
                type="button"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? 'Changement...' : 'Changer'}
              </Button>
            </div>
          </div>
        </>
      ) : null}

      {/* Address confirm delete */}
      <ConfirmModal
        open={confirmDeleteAddressOpen}
        title="Supprimer l'adresse"
        message="Confirmer la suppression de cette adresse ?"
        confirmLabel="Supprimer"
        loading={deleteAddressMutation.isPending}
        onConfirm={() => {
          deleteAddressMutation.mutate(confirmDeleteAddressId);
          setConfirmDeleteAddressOpen(false);
          setConfirmDeleteAddressId(null);
        }}
        onCancel={() => {
          setConfirmDeleteAddressOpen(false);
          setConfirmDeleteAddressId(null);
        }}
      />

      {/* Address create/edit */}
      <Modal
        open={addressModalOpen}
        title={addressMode === 'create' ? 'Ajouter une adresse' : "Modifier l'adresse"}
        onClose={closeAddressModal}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="addr-type">
              Type
            </label>
            <select
              id="addr-type"
              className="input"
              value={addressForm.type}
              onChange={(e) => setAddressForm((p) => ({ ...p, type: e.target.value }))}
            >
              <option value="billing">billing</option>
              <option value="shipping">shipping</option>
            </select>
          </div>

          <Input label="Prénom" id="addr-firstName" value={addressForm.firstName} onChange={(e) => setAddressForm((p) => ({ ...p, firstName: e.target.value }))} />
          <Input label="Nom" id="addr-lastName" value={addressForm.lastName} onChange={(e) => setAddressForm((p) => ({ ...p, lastName: e.target.value }))} />
          <Input label="Société (optionnel)" id="addr-company" value={addressForm.company} onChange={(e) => setAddressForm((p) => ({ ...p, company: e.target.value }))} />
          <Input label="Adresse 1" id="addr-line1" value={addressForm.addressLine1} onChange={(e) => setAddressForm((p) => ({ ...p, addressLine1: e.target.value }))} />
          <Input label="Adresse 2 (optionnel)" id="addr-line2" value={addressForm.addressLine2} onChange={(e) => setAddressForm((p) => ({ ...p, addressLine2: e.target.value }))} />
          <Input label="Ville" id="addr-city" value={addressForm.city} onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))} />
          <Input label="Code postal" id="addr-postalCode" value={addressForm.postalCode} onChange={(e) => setAddressForm((p) => ({ ...p, postalCode: e.target.value }))} />
          <Input label="Pays" id="addr-country" value={addressForm.country} onChange={(e) => setAddressForm((p) => ({ ...p, country: e.target.value }))} />
          <Input label="Téléphone (optionnel)" id="addr-phone" value={addressForm.phone} onChange={(e) => setAddressForm((p) => ({ ...p, phone: e.target.value }))} />

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={closeAddressModal} type="button">
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={submitAddress}
              type="button"
              disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
            >
              {createAddressMutation.isPending || updateAddressMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payment create */}
      <Modal
        open={paymentModalOpen}
        title="Ajouter une carte"
        onClose={closePaymentModal}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Cette API exige les IDs Stripe : `stripeCustomerId` et `stripePaymentMethodId`.
          </p>

          <Input
            label="stripeCustomerId"
            id="pm-stripeCustomerId"
            value={paymentForm.stripeCustomerId}
            onChange={(e) => setPaymentForm((p) => ({ ...p, stripeCustomerId: e.target.value }))}
          />
          <Input
            label="stripePaymentMethodId"
            id="pm-stripePaymentMethodId"
            value={paymentForm.stripePaymentMethodId}
            onChange={(e) => setPaymentForm((p) => ({ ...p, stripePaymentMethodId: e.target.value }))}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="pm-type">
                Type
              </label>
              <select
                id="pm-type"
                className="input"
                value={paymentForm.type}
                onChange={(e) => setPaymentForm((p) => ({ ...p, type: e.target.value }))}
              >
                <option value="card">card</option>
                <option value="bank_account">bank_account</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={paymentForm.isDefault}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, isDefault: e.target.checked }))}
                  className="h-4 w-4"
                />
                Par défaut
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="last4 (optionnel)"
              id="pm-last4"
              value={paymentForm.last4}
              onChange={(e) => setPaymentForm((p) => ({ ...p, last4: e.target.value }))}
            />
            <Input
              label="brand (optionnel)"
              id="pm-brand"
              value={paymentForm.brand}
              onChange={(e) => setPaymentForm((p) => ({ ...p, brand: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="expiryMonth (optionnel)"
              id="pm-expiryMonth"
              type="number"
              value={paymentForm.expiryMonth}
              onChange={(e) => setPaymentForm((p) => ({ ...p, expiryMonth: e.target.value }))}
            />
            <Input
              label="expiryYear (optionnel)"
              id="pm-expiryYear"
              type="number"
              value={paymentForm.expiryYear}
              onChange={(e) => setPaymentForm((p) => ({ ...p, expiryYear: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={closePaymentModal} type="button">
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={submitPayment}
              type="button"
              disabled={createPaymentMutation.isPending}
            >
              {createPaymentMutation.isPending ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

