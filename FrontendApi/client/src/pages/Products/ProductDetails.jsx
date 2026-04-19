import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProductById } from '../../services/productService';

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getProductById(id)
      .then((res) => setProduct(res.data.data || null))
      .catch((err) => setError(err?.response?.data?.error?.message || 'Impossible de charger le produit.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="card p-6">Chargement du produit...</div>;
  if (error) return <div className="card border-red-200 p-6 text-red-600">{error}</div>;
  if (!product) return <div className="card p-6">Produit introuvable.</div>;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <Link className="btn-secondary" to="/admin/products">Retour</Link>
        <Link className="btn-primary" to={`/admin/products/${id}/edit`}>Modifier</Link>
      </div>

      <article className="card p-5 sm:p-6">
        <h2 className="text-xl font-bold">{product.name}</h2>
        <p className="mt-2 text-sm text-slate-500">{product.description}</p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <p><span className="font-semibold">ID:</span> {product.id}</p>
          <p><span className="font-semibold">Slug:</span> {product.slug}</p>
          <p><span className="font-semibold">Prix HT :</span> EUR {Number(product.priceHt || 0).toFixed(2)}</p>
          <p><span className="font-semibold">Prix TTC :</span> EUR {Number(product.priceTtc || 0).toFixed(2)}</p>
          <p><span className="font-semibold">TVA :</span> {product.tva}%</p>
          <p><span className="font-semibold">Stock :</span> {product.stock}</p>
          <p><span className="font-semibold">Priorité :</span> {product.priority}</p>
          <p><span className="font-semibold">Statut :</span> {product.status}</p>
          <p><span className="font-semibold">ID catégorie :</span> {product.categoryId ?? '-'}</p>
        </div>
      </article>
    </section>
  );
}