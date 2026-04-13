import { useEffect } from 'react';
import { redirectToStorefrontLogin } from '../utils/storefrontUrl';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('admin_access_token');
  useEffect(() => {
    if (!token) {
      redirectToStorefrontLogin();
    }
  }, [token]);
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center text-sm text-slate-600">
        Redirection vers la connexion…
      </div>
    );
  }
  return children;
}
