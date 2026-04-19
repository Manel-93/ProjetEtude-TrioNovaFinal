export function groupOrdersByYear(orders = []) {
  const years = new Map();

  for (const order of orders) {
    const year = new Date(order.createdAt).getFullYear();
    if (!years.has(year)) years.set(year, []);
    years.get(year).push(order);
  }

  return [...years.entries()].sort((a, b) => b[0] - a[0]);
}

export function getOrderStateLabel(state) {
  if (state === 'active') return 'Active';
  if (state === 'resiliee') return 'Annulee';
  if (state === 'terminee') return 'Terminee';
  return 'Toutes';
}

export function getOrderStatusMeta(status) {
  switch (status) {
    case 'completed':
      return {
        label: 'Terminee',
        className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
      };
    case 'processing':
      return {
        label: 'Active',
        className: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
      };
    case 'pending':
      return {
        label: 'En attente',
        className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
      };
    case 'canceled':
      return {
        label: 'Annulee',
        className: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
      };
    default:
      return {
        label: status || 'Inconnue',
        className: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
      };
  }
}

export function formatOrderCard(paymentSummary) {
  const brand = paymentSummary?.brand || 'Carte';
  const last4 = paymentSummary?.last4 ? `•••• ${paymentSummary.last4}` : '••••';
  return `${brand} ${last4}`;
}

export function formatOrderAddress(address) {
  if (!address) return [];

  return [
    [address.firstName, address.lastName].filter(Boolean).join(' ').trim(),
    address.company,
    address.addressLine1,
    address.addressLine2,
    [address.postalCode, address.city].filter(Boolean).join(' ').trim(),
    address.country,
    address.phone
  ].filter(Boolean);
}
