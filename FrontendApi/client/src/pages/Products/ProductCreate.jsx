import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductForm from '../../components/ProductForm';
import { createProduct, getCategories } from '../../services/productService';

function extractApiError(err, fallback) {
  const data = err?.response?.data;
  return (
    data?.error?.message ||
    data?.message ||
    (Array.isArray(data?.details) && data.details[0]?.message) ||
    fallback
  );
}

export default function ProductCreate() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data.data || []))
      .catch((err) => setError(extractApiError(err, 'Impossible de charger les catégories.')))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (payload) => {
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await createProduct(payload);
      setSuccess('Produit créé avec succès. Redirection vers la liste...');
      setTimeout(() => navigate('/admin/products'), 900);
    } catch (err) {
      setError(extractApiError(err, 'Échec de la création du produit.'));
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="card p-6">Chargement du formulaire...</div>;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">Créer un produit</h2>
      <ProductForm
        categories={categories}
        submitLabel="Enregistrer"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/admin/products')}
        externalLoading={submitting}
        externalSuccess={success}
        externalError={error}
      />
    </section>
  );
}