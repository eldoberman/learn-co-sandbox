const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  contacts: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/contacts${qs ? `?${qs}` : ''}`);
    },
    get: (id) => request(`/contacts/${id}`),
    create: (data) => request('/contacts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/contacts/${id}`, { method: 'DELETE' }),
    toggleFavorite: (id) => request(`/contacts/${id}/favorite`, { method: 'PATCH' }),
  },
  interactions: {
    list: (contactId) => request(`/interactions/contact/${contactId}`),
    create: (data) => request('/interactions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/interactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/interactions/${id}`, { method: 'DELETE' }),
  },
  tags: {
    list: () => request('/tags'),
  },
};
