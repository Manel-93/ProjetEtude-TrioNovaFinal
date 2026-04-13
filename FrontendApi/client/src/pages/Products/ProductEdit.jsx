import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ProductForm from '../../components/ProductForm';
import { getCategories, getProductById, updateProduct } from '../../services/productService';

export default function ProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([getProductById(id), getCategories()])
      .then(([productRes, categoriesRes]) => {
        setInitialValues(productRes.data.data || null);
        setCategories(categoriesRes.data.data || []);
      })
      .catch((err) => setError(err?.response?.data?.error?.message || 'Failed to load product.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (payload) => {
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await updateProduct(id, payload);
      setSuccess('Product updated successfully.');
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to update product.');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="card p-6">Loading product...</div>;
  if (error) return <div className="card border-red-200 p-6 text-red-600">{error}</div>;
  if (!initialValues) return <div className="card p-6">Product not found.</div>;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Edit Product</h2>
        <button
          type="button"
          onClick={() => navigate('/admin/products')}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
      </div>
      <ProductForm
        initialValues={initialValues}
        categories={categories}
        submitLabel="Save"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/admin/products')}
        externalLoading={submitting}
        externalSuccess={success}
        externalError={error}
      />
    </section>
  );
}