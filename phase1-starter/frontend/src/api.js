const BASE_URL = '';
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`${options.method || 'GET'} ${path} failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email, password) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  catalog: () => request('/api/catalog'),
  book: (userId, eventId) =>
    request('/api/bookings', { method: 'POST', body: JSON.stringify({ userId, eventId }) }),
  analyze: (text) =>
    request('/api/analyze', { method: 'POST', body: JSON.stringify({ text }) }),
  review: (bookingId, text) =>
    request(`/api/bookings/${bookingId}/review`, { method: 'POST', body: JSON.stringify({ text }) }),
  analyticsSummary: () => request('/api/analytics/summary'),
};
