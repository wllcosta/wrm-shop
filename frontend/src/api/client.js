const BASE_URL = '/api'; // em dev, o vite.config.js faz proxy pra localhost:3001

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch { /* resposta sem corpo */ }

  if (!res.ok) {
    const message = (data && data.error) || `Erro ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: (token) => request('/auth/me', { token }),

  getFilamentTypes: (token) => request('/filament-types', { token }),
  createFilamentType: (token, body) => request('/filament-types', { method: 'POST', body, token }),
  updateFilamentType: (token, id, body) => request(`/filament-types/${id}`, { method: 'PUT', body, token }),
  deleteFilamentType: (token, id) => request(`/filament-types/${id}`, { method: 'DELETE', token }),

  getSettings: (token) => request('/settings', { token }),
  updateSettings: (token, body) => request('/settings', { method: 'PUT', body, token }),

  getChannels: (token) => request('/channels', { token }),

  calcProduct: (token, body) => request('/products/calc', { method: 'POST', body, token }),
  getProducts: (token) => request('/products', { token }),
  createProduct: (token, body) => request('/products', { method: 'POST', body, token }),
  deleteProduct: (token, id) => request(`/products/${id}`, { method: 'DELETE', token }),

  getSales: (token) => request('/sales', { token }),
  createSale: (token, body) => request('/sales', { method: 'POST', body, token }),
  deleteSale: (token, id) => request(`/sales/${id}`, { method: 'DELETE', token }),

  getDashboard: (token) => request('/dashboard', { token }),
};
