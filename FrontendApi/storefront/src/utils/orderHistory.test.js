import { describe, expect, it } from 'vitest';

import { formatOrderAddress, formatOrderCard, getOrderStatusMeta, groupOrdersByYear } from './orderHistory';

describe('orderHistory utils', () => {
  it('groupe les commandes par annee en ordre antichronologique', () => {
    const grouped = groupOrdersByYear([
      { id: 1, createdAt: '2024-05-11T10:00:00.000Z' },
      { id: 2, createdAt: '2025-02-03T10:00:00.000Z' },
      { id: 3, createdAt: '2025-01-01T10:00:00.000Z' }
    ]);

    expect(grouped.map(([year]) => year)).toEqual([2025, 2024]);
    expect(grouped[0][1]).toHaveLength(2);
  });

  it('retourne un badge lisible selon le statut', () => {
    expect(getOrderStatusMeta('completed').label).toBe('Terminee');
    expect(getOrderStatusMeta('processing').label).toBe('Active');
    expect(getOrderStatusMeta('canceled').label).toBe('Annulee');
  });

  it('formate le moyen de paiement et l adresse de facturation', () => {
    expect(formatOrderCard({ brand: 'Visa', last4: '4242' })).toBe('Visa •••• 4242');
    expect(
      formatOrderAddress({
        firstName: 'Jean',
        lastName: 'Dupont',
        addressLine1: '1 rue de Paris',
        postalCode: '75000',
        city: 'Paris',
        country: 'France'
      })
    ).toEqual(['Jean Dupont', '1 rue de Paris', '75000 Paris', 'France']);
  });
});
