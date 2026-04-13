export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const t = url.trim();
  if (!t) return '';

  if (/^https?:\/\//i.test(t)) return t;

  if (t.startsWith('//')) {
    if (typeof window === 'undefined') return `https:${t}`;
    return `${window.location.protocol}${t}`;
  }

  if (t.startsWith('/')) {
    const explicit = import.meta.env.VITE_PUBLIC_API_ORIGIN;
    if (explicit) {
      return `${String(explicit).replace(/\/$/, '')}${t}`;
    }
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      const { hostname, protocol } = window.location;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${protocol}//${hostname}:5000${t}`;
      }
    }
    return t;
  }

  return t;
}
