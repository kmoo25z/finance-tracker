import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // Get CSRF token from cookie
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_URL}/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        originalRequest.headers['Authorization'] = `Bearer ${access}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to get CSRF token
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Authentication API
export const authAPI = {
  login: (credentials) => api.post('/token/', credentials),
  refreshToken: (refresh) => api.post('/token/refresh/', { refresh }),
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    return Promise.resolve();
  },
};

// Dashboard API
export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard/'),
};

// Income API
export const incomeAPI = {
  getIncomes: (params) => api.get('/incomes/', { params }),
  getIncome: (id) => api.get(`/incomes/${id}/`),
  createIncome: (data) => api.post('/incomes/', data),
  updateIncome: (id, data) => api.put(`/incomes/${id}/`, data),
  deleteIncome: (id) => api.delete(`/incomes/${id}/`),
};

// Expense API
export const expenseAPI = {
  getExpenses: (params) => api.get('/expenses/', { params }),
  getExpense: (id) => api.get(`/expenses/${id}/`),
  createExpense: (data) => {
    console.log('Creating expense with data:', data);
    return api.post('/expenses/', data);
  },
  updateExpense: (id, data) => api.put(`/expenses/${id}/`, data),
  deleteExpense: (id) => api.delete(`/expenses/${id}/`),
  exportExpenses: (params) => api.get('/expenses/export/', { 
    params, 
    responseType: 'blob' 
  }),
};
// Categories API
export const categoriesAPI = {
  getCategories: (params) => api.get('/categories/', { params }),
  getCategory: (id) => api.get(`/categories/${id}/`),
  createCategory: (data) => api.post('/categories/', data),
  updateCategory: (id, data) => api.put(`/categories/${id}/`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}/`),
  getCategoryTree: () => api.get('/categories/tree/'),
  getExpenseCategories: () => api.get('/categories/expense_categories/'),
  getIncomeCategories: () => api.get('/categories/income_categories/'),
  createDefaults: () => api.post('/categories/create_defaults/'),
};

// Budgets API
export const budgetsAPI = {
  getBudgets: (params) => api.get('/budgets/', { params }),
  getBudget: (id) => api.get(`/budgets/${id}/`),
  createBudget: (data) => api.post('/budgets/', data),
  updateBudget: (id, data) => api.put(`/budgets/${id}/`, data),
  deleteBudget: (id) => api.delete(`/budgets/${id}/`),
  getBudgetSummary: () => api.get('/budgets/summary/'),
  checkAlerts: () => api.post('/budgets/check_alerts/'),
  getBudgetExpenses: (id) => api.get(`/budgets/${id}/expenses/`),
};

// Budget Alerts API
export const budgetAlertsAPI = {
  getAlerts: (params) => api.get('/budget-alerts/', { params }),
  markRead: (id) => api.post(`/budget-alerts/${id}/mark_read/`),
  markAllRead: () => api.post('/budget-alerts/mark_all_read/'),
};

// Goals API
export const goalsAPI = {
  getGoals: (params) => api.get('/goals/', { params }),
  getGoal: (id) => api.get(`/goals/${id}/`),
  createGoal: (data) => api.post('/goals/', data),
  updateGoal: (id, data) => api.put(`/goals/${id}/`, data),
  deleteGoal: (id) => api.delete(`/goals/${id}/`),
};

// Transactions API
export const transactionsAPI = {
  getTransactions: (params) => api.get('/transactions/', { params }),
  getTransaction: (id) => api.get(`/transactions/${id}/`),
  createTransaction: (data) => api.post('/transactions/', data),
  updateTransaction: (id, data) => api.put(`/transactions/${id}/`, data),
  deleteTransaction: (id) => api.delete(`/transactions/${id}/`),
  getTransactionSummary: () => api.get('/transactions/summary/'),
};

// Debt API
export const debtAPI = {
  getDebts: (params) => api.get('/debts/', { params }),
  getDebt: (id) => api.get(`/debts/${id}/`),
  createDebt: (data) => api.post('/debts/', data),
  updateDebt: (id, data) => api.put(`/debts/${id}/`, data),
  deleteDebt: (id) => api.delete(`/debts/${id}/`),
  getPayments: (debtId) => api.get(`/debt-payments/?debt=${debtId}`),
  createPayment: (data) => api.post('/debt-payments/', data),
  deletePayment: (id) => api.delete(`/debt-payments/${id}/`),
};

// Accounts API
export const accountsAPI = {
  // US Accounts
  getUSAccounts: (params) => api.get('/us-accounts/', { params }),
  getUSAccount: (id) => api.get(`/us-accounts/${id}/`),
  createUSAccount: (data) => api.post('/us-accounts/', data),
  updateUSAccount: (id, data) => api.put(`/us-accounts/${id}/`, data),
  deleteUSAccount: (id) => api.delete(`/us-accounts/${id}/`),
  
  // Kenya Accounts
  getKenyaAccounts: (params) => api.get('/kenya-accounts/', { params }),
  getKenyaAccount: (id) => api.get(`/kenya-accounts/${id}/`),
  createKenyaAccount: (data) => api.post('/kenya-accounts/', data),
  updateKenyaAccount: (id, data) => api.put(`/kenya-accounts/${id}/`, data),
  deleteKenyaAccount: (id) => api.delete(`/kenya-accounts/${id}/`),
  
  // Combined methods for convenience
  getAllAccounts: async () => {
    const [usAccounts, kenyaAccounts] = await Promise.all([
      api.get('/us-accounts/'),
      api.get('/kenya-accounts/')
    ]);
    return {
      data: {
        us_accounts: usAccounts.data,
        kenya_accounts: kenyaAccounts.data
      }
    };
  }
};

// Money Transfer API
export const moneyTransferAPI = {
  getTransfers: (params) => api.get('/money-transfers/', { params }),
  getTransfer: (id) => api.get(`/money-transfers/${id}/`),
  createTransfer: (data) => api.post('/money-transfers/', data),
  updateTransfer: (id, data) => api.put(`/money-transfers/${id}/`, data),
  deleteTransfer: (id) => api.delete(`/money-transfers/${id}/`),
  executeTransfer: (id) => api.post(`/money-transfers/${id}/execute/`),
  cancelTransfer: (id) => api.post(`/money-transfers/${id}/cancel/`),
};

// Projects API
export const projectsAPI = {
  getProjects: () => api.get('/projects/'),
  getProject: (id) => api.get(`/projects/${id}/`),
  createProject: (data) => api.post('/projects/', data),
  updateProject: (id, data) => api.put(`/projects/${id}/`, data),
  deleteProject: (id) => api.delete(`/projects/${id}/`),
  uploadDocument: (projectId, formData) => api.post(`/projects/${projectId}/upload_document/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  deleteDocument: (projectId, documentId) => api.delete(`/projects/${projectId}/delete_document/`, {
    data: { document_id: documentId }
  }),
};

// Calendar API
export const calendarAPI = {
  getEvents: (params) => api.get('/calendar-events/', { params }),
  getEvent: (id) => api.get(`/calendar-events/${id}/`),
  createEvent: (data) => api.post('/calendar-events/', data),
  updateEvent: (id, data) => api.put(`/calendar-events/${id}/`, data),
  deleteEvent: (id) => api.delete(`/calendar-events/${id}/`),
};

// Utility functions
export const utils = {
  handleError: (error) => {
    if (error.response) {
      return error.response.data.detail || error.response.data.message || 'An error occurred';
    } else if (error.request) {
      return 'No response from server';
    } else {
      return error.message || 'An error occurred';
    }
  },
  
  formatCurrency: (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  },
  
  formatDate: (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },
};

export default api;