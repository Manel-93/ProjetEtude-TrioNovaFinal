import { useEffect } from 'react';
import { redirectToStorefrontLogin } from '../../utils/storefrontUrl';

export default function RedirectToStorefrontLogin() {
  useEffect(() => {
    redirectToStorefrontLogin();
  }, []);
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center text-sm text-slate-600">
      Redirection vers la page de connexion de la boutique…
    </div>
  );
}
