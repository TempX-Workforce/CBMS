import axios from 'axios';

// Create axios instance with base configuration
const baseURL = process.env.NODE_ENV === 'production'
  ? (process.env.VITE_API_URL || 'https://cbms-mjcv.onrender.com/api')
  : '/api';

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  register: (userData) => api.post('/auth/register', userData),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
};

// Users API
export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  createUser: (data) => api.post('/users', data),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUsersByRole: (role, params) => api.get(`/users/role/${role}`, { params }),
  getUsersByDepartment: (departmentId, params) => api.get(`/users/department/${departmentId}`, { params }),
  getUserStats: () => api.get('/users/stats'),
};

// Departments API
export const departmentsAPI = {
  getDepartments: (params) => api.get('/departments', { params }),
  getDepartmentById: (id) => api.get(`/departments/${id}`),
  getDepartmentDetail: (id, params) => api.get(`/departments/${id}/detail`, { params }),
  createDepartment: (data) => api.post('/departments', data),
  updateDepartment: (id, data) => api.put(`/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/departments/${id}`),
  getDepartmentStats: () => api.get('/departments/stats'),
};

// Budget Heads API
export const budgetHeadsAPI = {
  getBudgetHeads: (params) => api.get('/budget-heads', { params }),
  getBudgetHeadById: (id) => api.get(`/budget-heads/${id}`),
  createBudgetHead: (data) => api.post('/budget-heads', data),
  updateBudgetHead: (id, data) => api.put(`/budget-heads/${id}`, data),
  deleteBudgetHead: (id) => api.delete(`/budget-heads/${id}`),
  getBudgetHeadStats: () => api.get('/budget-heads/stats'),
};

// Allocations API
export const allocationAPI = {
  getAllocations: (params) => api.get('/allocations', { params }),
  getAllocationById: (id) => api.get(`/allocations/${id}`),
  createAllocation: (data) => api.post('/allocations', data),
  updateAllocation: (id, data) => api.put(`/allocations/${id}`, data),
  deleteAllocation: (id) => api.delete(`/allocations/${id}`),
  getAllocationStats: (params) => api.get('/allocations/stats', { params }),
  bulkCreateAllocations: (data) => api.post('/allocations/bulk', data),
  getYearComparison: (params) => api.get('/allocations/year-comparison', { params }),
  getCSVTemplate: () => api.get('/allocations/csv-template', { responseType: 'blob' }),
  bulkUploadCSV: (data) => api.post('/allocations/bulk-csv', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
};

// Expenditures API
export const expenditureAPI = {
  getExpenditures: (params) => api.get('/expenditures', { params }),
  getExpenditureById: (id) => api.get(`/expenditures/${id}`),
  submitExpenditure: (data) => api.post('/expenditures', data, {
    headers: {
      'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json'
    }
  }),
  approveExpenditure: (id, data) => api.put(`/expenditures/${id}/approve`, data),
  rejectExpenditure: (id, data) => api.put(`/expenditures/${id}/reject`, data),
  resubmitExpenditure: (id, data) => api.post(`/expenditures/${id}/resubmit`, data, {
    headers: {
      'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json'
    }
  }),
  verifyExpenditure: (id, data) => api.put(`/expenditures/${id}/verify`, data),
  getExpenditureStats: (params) => api.get('/expenditures/stats', { params }),
};

// Notifications API
export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  getNotificationStats: () => api.get('/notifications/stats'),
  createNotification: (data) => api.post('/notifications', data),
  sendSystemAnnouncement: (data) => api.post('/notifications/announcement', data),
};

// Settings API
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
  resetSettings: (data) => api.post('/settings/reset', data),
  getSystemInfo: () => api.get('/settings/system-info'),
};

// Reports API
export const reportAPI = {
  getExpenditureReport: (params) => api.get('/reports/expenditures', { params }),
  getAllocationReport: (params) => api.get('/reports/allocations', { params }),
  getDashboardReport: (params) => api.get('/reports/dashboard', { params }),
  getAuditReport: (params) => api.get('/reports/audit', { params }),
};

// Files API
export const fileAPI = {
  uploadFiles: (data) => api.post('/files/upload', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  getFileInfo: (fileId) => api.get(`/files/${fileId}`),
  deleteFile: (fileId) => api.delete(`/files/${fileId}`),
  getDownloadUrl: (fileId) => api.get(`/files/${fileId}/download`),
  cleanupFiles: (data) => api.post('/files/cleanup', data),
  getFileStats: () => api.get('/files/stats'),
};

// Audit Logs API
export const auditLogAPI = {
  getAuditLogs: (params) => api.get('/audit-logs', { params }),
  getAuditLogById: (id) => api.get(`/audit-logs/${id}`),
  getAuditLogStats: (params) => api.get('/audit-logs/stats', { params }),
  createAuditLog: (data) => api.post('/audit-logs', data),
  exportAuditLogs: (params) => api.get('/audit-logs/export', { params }),
};

export default api;
