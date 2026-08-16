export const getApiBaseUrl = () => {
  // If explicitly set in environment variable, prioritize that
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // If running in browser on localhost or 127.0.0.1, always use local backend
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return 'http://127.0.0.1:8000';
    }
  }
  // Fallback for hosted production (Vercel / Cloud)
  return 'https://careimpact.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();

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

  // Proof Documents Upload & Management
  uploadProofDocument: async (memberId, formData) => {
    const url = `${API_BASE_URL}/members/${encodeURIComponent(memberId)}/proof-documents`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.detail || 'Failed to upload proof document');
    }
    return await response.json();
  },

  deleteProofDocument: (memberId, docId) =>
    request(`/members/${encodeURIComponent(memberId)}/proof-documents/${encodeURIComponent(docId)}`, {
      method: 'DELETE',
    }),

  // Analytics
  getAnalyticsSummary: () => request('/analytics/summary'),
  getTrend: () => request('/analytics/trend'),
  getGeoData: () => request('/analytics/geo'),
  getPriority: () => request('/analytics/priority'),

  // AI Clinical Assistant
  sendChatMessage: (message, history = []) =>
    request('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),
  getSuggestedPrompts: () => request('/assistant/suggestions'),

  // Admin & Sync
  resyncData: () => request('/admin/resync', { method: 'POST' }),
  getSyncStatus: () => request('/admin/sync-status'),
  getHealth: () => request('/health'),
};
