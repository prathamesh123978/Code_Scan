import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'https://code-scan-backend-0zmj.onrender.com';

const api = axios.create({ baseURL: BASE });

export const reviewCode = (code, language = 'auto', filename = '') =>
  api.post('/review', { code, language, filename }).then(r => r.data);

export const reviewGithub = (pr_url) =>
  api.post('/review/github', { pr_url }).then(r => r.data);

export const getHistory = (limit = 20) =>
  api.get(`/history?limit=${limit}`).then(r => r.data);

export const getReview = (id) =>
  api.get(`/history/${id}`).then(r => r.data);

// ✅ new
export const deleteReview = (id) =>
  api.delete(`/history/${id}`).then(r => r.data);
