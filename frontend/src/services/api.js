import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Auto-inject JWT token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Let Axios auto-set Content-Type for FormData (multipart/form-data with boundary)
  // Only set JSON for non-FormData requests
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

// Response interceptor to handle errors gracefully
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// Specialized endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  updatePassword: (data) => api.put('/auth/password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password })
};

export const categoryAPI = {
  getAll: (params) => api.get('/categories', { params }),
  getTree: (params) => api.get('/categories/tree', { params }),
  getBySlug: (slug, params) => api.get(`/categories/${slug}`, { params }),
  getById: (id) => api.get(`/categories/id/${id}`),
  create: (formData) =>
    api.post('/categories', formData),
  update: (id, formData) =>
    api.put(`/categories/${id}`, formData),
  delete: (id) => api.delete(`/categories/${id}`)
};

export const videoAPI = {
  getAll: (params) => api.get('/videos', { params }),
  getBySlug: (slug) => api.get(`/videos/${slug}`),
  create: (formData) =>
    api.post('/videos', formData),
  update: (id, formData) =>
    api.put(`/videos/${id}`, formData),
  restore: (id) => api.put(`/videos/${id}/restore`),
  delete: (id, force = false) => api.delete(`/videos/${id}${force ? '?force=true' : ''}`),
  duplicate: (id) => api.post(`/videos/${id}/duplicate`),
  bulkDelete: (ids, force = false) => api.post('/videos/bulk-delete', { ids, force })
};

export const galleryAPI = {
  getAll: (params) => api.get('/galleries', { params }),
  getBySlug: (slug) => api.get(`/galleries/${slug}`),
  create: (formData) =>
    api.post('/galleries', formData),
  update: (id, formData) =>
    api.put(`/galleries/${id}`, formData),
  restore: (id) => api.put(`/galleries/${id}/restore`),
  delete: (id, force = false) => api.delete(`/galleries/${id}${force ? '?force=true' : ''}`),
  duplicate: (id) => api.post(`/galleries/${id}/duplicate`),
  bulkDelete: (ids, force = false) => api.post('/galleries/bulk-delete', { ids, force })
};

export const postAPI = {
  getAll: (params) => api.get('/posts', { params }),
  getBySlug: (slug) => api.get(`/posts/${slug}`),
  create: (formData) =>
    api.post('/posts', formData),
  update: (id, formData) =>
    api.put(`/posts/${id}`, formData),
  restore: (id) => api.put(`/posts/${id}/restore`),
  delete: (id, force = false) => api.delete(`/posts/${id}${force ? '?force=true' : ''}`),
  duplicate: (id) => api.post(`/posts/${id}/duplicate`),
  bulkDelete: (ids, force = false) => api.post('/posts/bulk-delete', { ids, force }),
  importDocument: (formData) => api.post('/posts/import-doc', formData),
  exportDocument: (id, format = 'docx') =>
    api.get(`/posts/${id}/export?format=${format}`, { responseType: 'blob' }),
  exportRaw: (data) =>
    api.post('/posts/export-raw', data, { responseType: 'blob' })
};

export const pageAPI = {
  getAll: (params) => api.get('/pages', { params }),
  getBySlug: (slug) => api.get(`/pages/${slug}`),
  getHomeTemplate: () => api.get('/pages/template/home'),
  getVideosTemplate: () => api.get('/pages/template/videos'),
  getStoriesTemplate: () => api.get('/pages/template/stories'),
  getGalleriesTemplate: () => api.get('/pages/template/galleries'),
  create: (formData) =>
    api.post('/pages', formData),
  update: (id, formData) =>
    api.put(`/pages/${id}`, formData),
  delete: (id, force = false) => api.delete(`/pages/${id}${force ? '?force=true' : ''}`),
  duplicate: (id) => api.post(`/pages/${id}/duplicate`),
  bulkDelete: (ids, force = false) => api.post('/pages/bulk-delete', { ids, force })
};

export const menuAPI = {
  getAll: (params) => api.get('/menus', { params }),
  getByLocation: (location) => api.get(`/menus/location/${location}`),
  create: (data) => api.post('/menus', data),
  update: (id, data) => api.put(`/menus/${id}`, data),
  delete: (id) => api.delete(`/menus/${id}`)
};

export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getAuthors: () => api.get('/users/authors'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  approve: (id) => api.put(`/users/${id}/approve`),
  reject: (id, data) => api.put(`/users/${id}/reject`, data),
  toggleSuspend: (id, data) => api.put(`/users/${id}/suspend`, data),
  delete: (id) => api.delete(`/users/${id}`)
};

export const mediaAPI = {
  getAll: (params) => api.get('/media', { params }),
  upload: (formData, onUploadProgress) =>
    api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress
    }),
  uploadUrls: (urls) => api.post('/media/upload-urls', { urls }),
  sync: () => api.post('/media/sync'),
  getById: (id) => api.get(`/media/${id}`),
  update: (id, data) => api.put(`/media/${id}`, data),
  delete: (id) => api.delete(`/media/${id}`),
  bulkDelete: (ids, force = false) => api.post("/media/bulk-delete", { ids, force })
};

export const themeAPI = {
  getSettings: () => api.get('/theme'),
  updateSettings: (data) => api.put('/theme', data)
};

export const statsAPI = {
  getStats: () => api.get('/stats')
};

export const searchAPI = {
  advancedSearch: (params) => api.get('/search', { params })
};

export const videoFieldAPI = {
  getAll: (params) => api.get('/video-fields', { params }),
  create: (data) => api.post('/video-fields', data),
  update: (id, data) => api.put(`/video-fields/${id}`, data),
  delete: (id) => api.delete(`/video-fields/${id}`),
  reorder: (orderList) => api.put('/video-fields/reorder', { orderList })
};

export default api;

