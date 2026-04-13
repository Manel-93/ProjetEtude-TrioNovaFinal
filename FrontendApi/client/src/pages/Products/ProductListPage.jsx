import Table from '../../components/ui/Table';

export default function ProductListPage() {
  const columns = [
    { header: 'Nom du produit', accessor: 'name' },
    { header: 'Prix', accessor: 'price' },
    { header: 'Catégorie', accessor: 'category' },
    { header: 'Stock', accessor: 'stock' },
    { header: 'Date de création', accessor: 'createdAt' },
    { header: 'Actions', accessor: 'actions' }
  ];

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Produits</h2>
          <p className="text-sm text-slate-500">
            Gestion des produits du catalogue. (Les fonctionnalités seront branchées sur l’API.)
          </p>
        </div>
      </header>

      <Table columns={columns} caption="Liste des produits">
        <tr>
          <td className="px-4 py-3 text-sm text-slate-500" colSpan={columns.length}>
            La liste des produits sera affichée ici.
          </td>
        </tr>
      </Table>
    </section>
  );
}

