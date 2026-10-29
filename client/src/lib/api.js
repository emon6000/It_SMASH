export const BASE = import.meta.env.VITE_API_URL || '';

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) throw new Error((data && data.error) || 'Something went wrong. Please try again.');
  return data;
}

// Uploaded images come back as /uploads/xxx - prefix with API host if needed
export const imgUrl = (u) => (!u ? '' : u.startsWith('/uploads') ? BASE + u : u);

export const money = (n) => `৳${Number(n || 0).toLocaleString('en-US')}`;
