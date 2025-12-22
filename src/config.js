// API Configuration
const isDev = import.meta.env.DEV;

export const API_BASE_URL = isDev
  ? '' // Development: use proxy
  : 'https://energy-management-panel.onrender.com'; // Production: Render backend

export const api = {
  get: async (endpoint) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`);
    return res.json();
  },
  post: async (endpoint, data) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};
