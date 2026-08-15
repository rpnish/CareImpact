const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMsg = errorBody.detail || errorBody.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }
    return await response.json();
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Members
  getMembers: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.measure) query.append('measure', params.measure);
    if (params.search) query.append('search', params.search);
    const qs = query.toString();
    return request(`/members${qs ? `?${qs}` : ''}`);
  },

  getMember: (memberId) => request(`/members/${encodeURIComponent(memberId)}`),

  createMember: (memberData) =>
    request('/members', {
      method: 'POST',
      body: JSON.stringify(memberData),
    }),

  updateMember: (memberId, memberData) =>
    request(`/members/${encodeURIComponent(memberId)}`, {
      method: 'PUT',
      body: JSON.stringify(memberData),
    }),

  deleteMember: (memberId) =>
    request(`/members/${encodeURIComponent(memberId)}`, {
      method: 'DELETE',
    }),

  // Analytics
  getAnalyticsSummary: () => request('/analytics/summary'),
  getTrend: () => request('/analytics/trend'),
  getGeoData: () => request('/analytics/geo'),
  getPriority: () => request('/analytics/priority'),

  // Admin & Sync
  resyncData: () => request('/admin/resync', { method: 'POST' }),
  getSyncStatus: () => request('/admin/sync-status'),
  getHealth: () => request('/health'),
};
