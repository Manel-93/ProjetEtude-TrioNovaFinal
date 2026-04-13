import { useState } from 'react';
import { resolveMediaUrl } from '../utils/mediaUrl';

const defaultBox =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-[10px] font-semibold text-slate-400';

/**
 * Vignette produit / catégorie : résout l’URL (API autre port, etc.) et affiche un fallback si l’image est cassée.
 * Utiliser alt="" quand le nom est déjà visible à côté (évite le texte par-dessus l’icône image cassée).
 */
export default function ProductThumb({
  url,
  alt = '',
  imgClassName = 'h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover',
  fallbackClassName = defaultBox
}) {
  const resolved = resolveMediaUrl(url);
  const [failed, setFailed] = useState(false);

  if (!resolved || failed) {
    return <div className={fallbackClassName}>N/A</div>;
  }

  return (
    <img
      src={resolved}
      alt={alt}
      className={imgClassName}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
