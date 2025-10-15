const ADMIN_API_BASE_URL = process.env.REACT_APP_ADMIN_API_URL || 'http://localhost:5000/api/admin';

// Helper function to get admin auth headers
const getAdminAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Generic admin API request function
const adminApiRequest = async (endpoint, options = {}) => {
  const url = `${ADMIN_API_BASE_URL}${endpoint}`;
  const config = {
    headers: getAdminAuthHeaders(),
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      // Handle admin auth errors
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login';
      }
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('Admin API request failed:', error);
    throw error;
  }
};

// ===============================================
// ADMIN AUTHENTICATION APIs
// ===============================================

export const adminLogin = async (credentials) => {
  return adminApiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
};

export const validateAdminToken = async () => {
  return adminApiRequest('/auth/validate-token');
};

// ===============================================
// ADMIN DASHBOARD APIs
// ===============================================

export const getAdminDashboardStats = async () => {
  return adminApiRequest('/dashboard');
};

export const getAdminOverviewStats = async () => {
  return adminApiRequest('/dashboard/overview');
};

export const getRecruiterPerformance = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `/dashboard/recruiters-performance?${queryString}` : '/dashboard/recruiters-performance';
  return adminApiRequest(endpoint);
};

export const getReviewTrends = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `/dashboard/review-trends?${queryString}` : '/dashboard/review-trends';
  return adminApiRequest(endpoint);
};

export const getSystemStatistics = async () => {
  return adminApiRequest('/system/stats');
};

// ===============================================
// ADMIN USER MANAGEMENT APIs
// ===============================================

export const getAllUsersAdmin = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `/users?${queryString}` : '/users';
  return adminApiRequest(endpoint);
};

export const getUserDetailsAdmin = async (userId) => {
  return adminApiRequest(`/users/${userId}`);
};

export const getUserActivityAdmin = async (userId, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `/users/${userId}/activity?${queryString}` : `/users/${userId}/activity`;
  return adminApiRequest(endpoint);
};

export const getUserPerformanceAdmin = async (userId, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `/users/${userId}/performance?${queryString}` : `/users/${userId}/performance`;
  return adminApiRequest(endpoint);
};

export const updateUserAdmin = async (userId, userData) => {
  return adminApiRequest(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData)
  });
};

export const deactivateUserAdmin = async (userId, reason) => {
  return adminApiRequest(`/users/${userId}/deactivate`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
};

export const resetUserPasswordAdmin = async (userId, tempPassword) => {
  const payload = tempPassword ? { temporary_password: tempPassword } : {};
  return adminApiRequest(`/users/${userId}/reset-password`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const promoteUserToAdminApi = async (userId, reason) => {
  return adminApiRequest(`/users/${userId}/promote`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
};

// ===============================================
// ADMIN TICKET MANAGEMENT APIs
// ===============================================

export const getAllTicketsAdmin = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `/tickets?${queryString}` : '/tickets';
  return adminApiRequest(endpoint);
};

export const getTicketDetailsAdmin = async (ticketId) => {
  return adminApiRequest(`/tickets/${ticketId}`);
};

export const getTicketHistoryAdmin = async (ticketId) => {
  return adminApiRequest(`/tickets/${ticketId}/history`);
};

export const getOverdueTicketsAdmin = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `/tickets/overdue?${queryString}` : '/tickets/overdue';
  return adminApiRequest(endpoint);
};

export const getTicketStatisticsAdmin = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `/tickets/stats?${queryString}` : '/tickets/stats';
  return adminApiRequest(endpoint);
};

export const adminUpdateTicketStatus = async (ticketId, statusData) => {
  return adminApiRequest(`/tickets/${ticketId}/update-status`, {
    method: 'POST',
    body: JSON.stringify(statusData)
  });
};

export const bulkUpdateTicketStatus = async (ticketIds, statusData) => {
  return adminApiRequest('/bulk/update-status', {
    method: 'POST',
    body: JSON.stringify({
      ticket_ids: ticketIds,
      ...statusData
    })
  });
};

export const bulkSendReminders = async (ticketIds) => {
  return adminApiRequest('/bulk/send-reminders', {
    method: 'POST',
    body: JSON.stringify({ ticket_ids: ticketIds })
  });
};

export const bulkExpireTickets = async (daysOverdue = 30) => {
  return adminApiRequest('/bulk/expire-tickets', {
    method: 'POST',
    body: JSON.stringify({ days_overdue: daysOverdue })
  });
};

// ===============================================
// ADMIN REVIEW MANAGEMENT APIs
// ===============================================

export const getAllReviewsAdmin = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `/reviews?${queryString}` : '/reviews';
  return adminApiRequest(endpoint);
};

export const getReviewDetailsAdmin = async (reviewId) => {
  return adminApiRequest(`/reviews/${reviewId}`);
};

export const getReviewStatisticsAdmin = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `/reviews/stats?${queryString}` : '/reviews/stats';
  return adminApiRequest(endpoint);
};

export const getReviewsByRecruiterAdmin = async (recruiterId, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `/reviews/by-recruiter/${recruiterId}?${queryString}` : `/reviews/by-recruiter/${recruiterId}`;
  return adminApiRequest(endpoint);
};

export const getReviewTrendsAdmin = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `/reviews/trends?${queryString}` : '/reviews/trends';
  return adminApiRequest(endpoint);
};

// ===============================================
// ADMIN EXPORT APIs
// ===============================================

export const exportAllRecruitersData = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `/export/all-recruiters?${queryString}` : '/export/all-recruiters';
  return adminApiRequest(endpoint);
};

export const exportSingleRecruiterData = async (recruiterId, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `/export/recruiter/${recruiterId}?${queryString}` : `/export/recruiter/${recruiterId}`;
  return adminApiRequest(endpoint);
};

export const exportReviewsData = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `/export/reviews?${queryString}` : '/export/reviews';
  return adminApiRequest(endpoint);
};

export const exportTicketsData = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `/export/tickets?${queryString}` : '/export/tickets';
  return adminApiRequest(endpoint);
};

export const exportUserActivity = async (userId, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `/export/user-activity/${userId}?${queryString}` : `/export/user-activity/${userId}`;
  return adminApiRequest(endpoint);
};

// ===============================================
// ADMIN COMMENTS MANAGEMENT APIs
// ===============================================

export const getAllCandidateCommentsAdmin = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `/comments?${queryString}` : '/comments';
  return adminApiRequest(endpoint);
};

export const deleteCandidateCommentAdmin = async (commentId, reason) => {
  return adminApiRequest(`/comments/${commentId}`, {
    method: 'DELETE',
    body: JSON.stringify({ reason })
  });
};

// ===============================================
// ADMIN LOOKUP DATA APIs
// ===============================================

export const getAdminDropdownData = async () => {
  return adminApiRequest('/lookups/dropdown-data');
};

// ===============================================
// ADMIN SYSTEM MANAGEMENT APIs
// ===============================================

export const runSystemCleanup = async () => {
  return adminApiRequest('/system/cleanup', {
    method: 'POST'
  });
};

export const getMaintenanceStatus = async () => {
  return adminApiRequest('/system/maintenance');
};

// ===============================================
// ADMIN REPORTING APIs
// ===============================================

export const getPerformanceSummaryReport = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `/reports/performance-summary?${queryString}` : '/reports/performance-summary';
  return adminApiRequest(endpoint);
};

export const getMonthlySummaryReport = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `/reports/monthly-summary?${queryString}` : '/reports/monthly-summary';
  return adminApiRequest(endpoint);
};

export const generateCustomReport = async (reportData) => {
  return adminApiRequest('/reports/custom', {
    method: 'POST',
    body: JSON.stringify(reportData)
  });
};

// ===============================================
// ADMIN UTILITY FUNCTIONS
// ===============================================

export const adminLogout = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  window.location.href = '/admin/login';
};

export const isAdminAuthenticated = () => {
  const token = localStorage.getItem('adminToken');
  if (!token) return false;
  
  try {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    return tokenPayload.exp * 1000 > Date.now() && tokenPayload.is_admin === true;
  } catch (error) {
    return false;
  }
};

export const getCurrentAdmin = () => {
  try {
    return JSON.parse(localStorage.getItem('adminUser') || '{}');
  } catch (error) {
    return {};
  }
};

// Enhanced admin error handling
export const handleAdminApiError = (error) => {
  if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Unauthorized')) {
    // Admin token expired or invalid
    adminLogout();
    return;
  }
  
  // Log error for debugging
  console.error('Admin API Error:', error);
  
  // Return user-friendly message
  return error.message || 'An unexpected error occurred';
};

// Admin health check
export const adminHealthCheck = async () => {
  try {
    const response = await fetch(`${ADMIN_API_BASE_URL.replace('/api/admin', '')}/health`);
    return await response.json();
  } catch (error) {
    console.error('Admin health check failed:', error);
    throw error;
  }
};

// Download file helper for exports
export const downloadFile = (content, filename, contentType = 'text/csv') => {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};