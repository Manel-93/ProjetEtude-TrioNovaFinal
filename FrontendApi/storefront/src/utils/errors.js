export function getApiError(err) {
  const d = err?.response?.data;
  const msgs = d?.error?.messages;
  if (Array.isArray(msgs) && msgs.length > 0) {
    return msgs.map((m) => (typeof m === 'string' ? m : m?.message)).filter(Boolean).join(' ');
  }
  return d?.error?.message || d?.message || err?.message || 'Erreur';
}
