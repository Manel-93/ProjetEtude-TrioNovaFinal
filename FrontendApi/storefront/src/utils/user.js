export function normalizeUser(raw) {
  if (!raw) return null;
  const role = raw.role != null ? String(raw.role).toUpperCase() : undefined;
  return {
    id: raw.id,
    email: raw.email,
    firstName: raw.first_name ?? raw.firstName,
    lastName: raw.last_name ?? raw.lastName,
    phone: raw.phone ?? null,
    role,
    isEmailConfirmed: raw.is_email_confirmed ?? raw.isEmailConfirmed,
    isActive: raw.is_active ?? raw.isActive
  };
}
