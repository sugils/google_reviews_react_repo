// Production-Ready API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/candidateReviews';
const ADMIN_API_BASE_URL = process.env.REACT_APP_ADMIN_API_URL || 'http://localhost:5000/api/admin';

// ===============================================
// PARAMETER CLEANING UTILITY
// ===============================================

/**
 * Clean parameters by removing empty strings, null, undefined values
 * This prevents sending empty parameters that cause database issues
 */
const cleanParams = (params) => {
  if (!params || typeof params !== 'object') return {};
  
  const cleaned = {};
  
  for (const [key, value] of Object.entries(params)) {
    // Skip empty strings, null, undefined, and whitespace-only strings
    if (value !== null && 
        value !== undefined && 
        value !== '' && 
        (typeof value !== 'string' || value.trim() !== '')) {
      
      // Handle boolean conversion for string booleans
      if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') {
          cleaned[key] = true;
        } else if (value.toLowerCase() === 'false') {
          cleaned[key] = false;
        } else {
          cleaned[key] = value;
        }
      } else {
        cleaned[key] = value;
      }
    }
  }
  
  return cleaned;
};

/**
 * Build query string from clean parameters
 * Only includes non-empty values
 */
const buildQueryString = (params) => {
  const cleanedParams = cleanParams(params);
  
  if (Object.keys(cleanedParams).length === 0) {
    return '';
  }
  
  const searchParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(cleanedParams)) {
    searchParams.append(key, String(value));
  }
  
  return searchParams.toString();
};

// ===============================================
// AUTH HEADER HELPERS
// ===============================================

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

const getAdminAuthHeaders = () => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

const getPublicHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

// ===============================================
// GENERIC API REQUEST FUNCTIONS
// ===============================================

/**
 * Generic API request with proper CORS handling
 */
const apiRequest = async (endpoint, options = {}, useAuth = true) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: useAuth ? getAuthHeaders() : getPublicHeaders(),
    credentials: 'include', // Important for CORS with credentials
    mode: 'cors', // Explicitly set CORS mode
    ...options
  };

  try {
    const response = await fetch(url, config);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } else {
      // Handle non-JSON responses (like file downloads)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    }
  } catch (error) {
    console.error('API request failed:', {
      url,
      error: error.message,
      endpoint
    });
    throw error;
  }
};

/**
 * Generic Admin API request with proper CORS handling
 */
const adminApiRequest = async (endpoint, options = {}) => {
  const url = `${ADMIN_API_BASE_URL}${endpoint}`;
  const config = {
    headers: getAdminAuthHeaders(),
    credentials: 'include', // Important for CORS with credentials
    mode: 'cors', // Explicitly set CORS mode
    ...options
  };

  try {
    const response = await fetch(url, config);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } else {
      // Handle non-JSON responses (like file downloads)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    }
  } catch (error) {
    console.error('Admin API request failed:', {
      url,
      error: error.message,
      endpoint
    });
    throw error;
  }
};

// ===============================================
// AUTHENTICATION APIs
// ===============================================

export const login = async (credentials) => {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }, false);
  
  // Store user data and token after successful login
  if (response.token && response.user) {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    console.log('Login successful - stored user:', response.user);
  }
  
  return response;
};

export const register = async (userData) => {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }, false);
};

// ===============================================
// USER MANAGEMENT UTILITIES
// ===============================================

export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return {};
    
    const user = JSON.parse(userStr);
    console.log('getCurrentUser - Retrieved user:', user);
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return {};
  }
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('No token found');
    return false;
  }
  
  try {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    const isNotExpired = tokenPayload.exp * 1000 > Date.now();
    console.log('Token check:', { tokenPayload, isNotExpired });
    return isNotExpired;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

export const checkAdminRole = () => {
  const user = getCurrentUser();
  
  if (!user || Object.keys(user).length === 0) {
    console.log('checkAdminRole - No user data found');
    return false;
  }
  
  // Check multiple possible ways the role might be stored
  const isAdmin = user.role === 'admin' || 
                  user.role === 'Admin' || 
                  user.user_role === 'admin' || 
                  user.user_role === 'Admin' ||
                  user.role?.toLowerCase() === 'admin';
  
  console.log('checkAdminRole - User:', user, 'isAdmin:', isAdmin);
  return isAdmin;
};

export const isAdminAuthenticated = () => {
  const isAuth = isAuthenticated();
  const isAdmin = checkAdminRole();
  
  console.log('isAdminAuthenticated - Auth:', isAuth, 'Admin:', isAdmin);
  return isAuth && isAdmin;
};

export const validateAdminToken = async () => {
  return adminApiRequest('/auth/validate-token');
};

export const logout = () => {
  console.log('Logging out user...');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  window.location.href = '/login';
};

export const adminLogout = () => {
  console.log('Logging out admin...');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const getCurrentAdminUser = () => {
  try {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      return JSON.parse(adminUser);
    }
    
    // Fallback to regular user if admin user not found
    return getCurrentUser();
  } catch (error) {
    console.error('Error getting admin user:', error);
    return {};
  }
};

// ===============================================
// USER PROFILE APIs
// ===============================================

export const getUserProfile = async () => {
  return apiRequest('/user/profile');
};

export const updateUserProfile = async (profileData) => {
  return apiRequest('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  });
};

// ===============================================
// DASHBOARD APIs
// ===============================================

export const getDashboardData = async () => {
  return apiRequest('/dashboard');
};

export const getAnalytics = async (params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/dashboard/analytics?${queryString}` : '/dashboard/analytics';
  return apiRequest(endpoint);
};

// ===============================================
// ADMIN DASHBOARD APIs
// ===============================================

export const getAdminOverviewAnalytics = async (params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/dashboard/overview?${queryString}` : '/dashboard/overview';
  return adminApiRequest(endpoint);
};

export const getAdminBUAnalysis = async (params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/dashboard/bu-analysis?${queryString}` : '/dashboard/bu-analysis';
  return adminApiRequest(endpoint);
};

export const getAdminBURecruiters = async (buId, params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/dashboard/bu/${buId}/recruiters?${queryString}` : `/dashboard/bu/${buId}/recruiters`;
  return adminApiRequest(endpoint);
};

export const getAdminRecruiterAnalysis = async (params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/dashboard/recruiter-analysis?${queryString}` : '/dashboard/recruiter-analysis';
  return adminApiRequest(endpoint);
};

export const getAdminTopPerformers = async (params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/dashboard/top-performers?${queryString}` : '/dashboard/top-performers';
  return adminApiRequest(endpoint);
};

export const getAdminCommentsAnalytics = async (params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/dashboard/comments-analytics?${queryString}` : '/dashboard/comments-analytics';
  return adminApiRequest(endpoint);
};

export const getAdminDetailedComments = async (params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/dashboard/comments/detailed?${queryString}` : '/dashboard/comments/detailed';
  return adminApiRequest(endpoint);
};

export const getAdminBusinessUnitsFilter = async () => {
  return adminApiRequest('/dashboard/filters/business-units');
};

export const getAdminRecruitersFilter = async (params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/dashboard/filters/recruiters?${queryString}` : '/dashboard/filters/recruiters';
  return adminApiRequest(endpoint);
};

export const getAdminCommentFilterOptions = async () => {
  return adminApiRequest('/dashboard/filters/comment-options');
};

export const exportAdminDashboardData = async (params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/dashboard/export?${queryString}` : '/dashboard/export';
  return adminApiRequest(endpoint);
};

export const getAdminDashboardStats = async (params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/dashboard?${queryString}` : '/dashboard';
  return adminApiRequest(endpoint);
};

export const getRecruitersPerformance = async (params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/dashboard/recruiters-performance?${queryString}` : '/dashboard/recruiters-performance';
  return adminApiRequest(endpoint);
};

export const getReviewTrends = async (params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/dashboard/review-trends?${queryString}` : '/dashboard/review-trends';
  return adminApiRequest(endpoint);
};

// ===============================================
// ADMIN USER MANAGEMENT APIs
// ===============================================

export const getAllUsersAdmin = async (params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/users?${queryString}` : '/users';
  
  console.log('getAllUsersAdmin - Original params:', params);
  console.log('getAllUsersAdmin - Cleaned params:', cleanParams(params));
  console.log('getAllUsersAdmin - Final endpoint:', endpoint);
  
  return adminApiRequest(endpoint);
};

export const getUserDetailsAdmin = async (userId) => {
  return adminApiRequest(`/users/${userId}`);
};

export const getUserActivityAdmin = async (userId, params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/users/${userId}/activity?${queryString}` : `/users/${userId}/activity`;
  return adminApiRequest(endpoint);
};

export const getUserPerformanceAdmin = async (userId, params = {}) => {
  const queryString = buildQueryString(params);
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

export const resetUserPasswordAdmin = async (userId, tempPassword = null) => {
  const body = tempPassword ? { temporary_password: tempPassword } : {};
  return adminApiRequest(`/users/${userId}/reset-password`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
};

export const promoteUserToAdmin = async (userId, reason) => {
  return adminApiRequest(`/users/${userId}/promote`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
};

// ===============================================
// ADMIN TICKET MANAGEMENT APIs
// ===============================================

export const getAllTicketsAdmin = async (params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/tickets?${queryString}` : '/tickets';
  
  console.log('getAllTicketsAdmin - Original params:', params);
  console.log('getAllTicketsAdmin - Cleaned params:', cleanParams(params));
  console.log('getAllTicketsAdmin - Final endpoint:', endpoint);
  
  return adminApiRequest(endpoint);
};

export const getTicketDetailsAdmin = async (ticketId) => {
  return adminApiRequest(`/tickets/${ticketId}`);
};

export const getTicketHistoryAdmin = async (ticketId) => {
  return adminApiRequest(`/tickets/${ticketId}/history`);
};

export const getOverdueTicketsAdmin = async (daysOverdue = 0) => {
  const endpoint = daysOverdue ? `/tickets/overdue?days_overdue=${daysOverdue}` : '/tickets/overdue';
  return adminApiRequest(endpoint);
};

export const getTicketStatisticsAdmin = async (months = 6) => {
  return adminApiRequest(`/tickets/stats?months=${months}`);
};

export const updateTicketStatusAdmin = async (ticketId, statusData) => {
  return adminApiRequest(`/tickets/${ticketId}/update-status`, {
    method: 'POST',
    body: JSON.stringify(statusData)
  });
};

export const bulkUpdateTicketStatusAdmin = async (ticketIds, status, notes) => {
  return adminApiRequest('/bulk/update-status', {
    method: 'POST',
    body: JSON.stringify({ 
      ticket_ids: ticketIds, 
      ticket_status: status, 
      admin_notes: notes 
    })
  });
};

export const bulkSendRemindersAdmin = async (ticketIds) => {
  return adminApiRequest('/bulk/send-reminders', {
    method: 'POST',
    body: JSON.stringify({ ticket_ids: ticketIds })
  });
};

export const bulkExpireTicketsAdmin = async (daysOverdue = 30) => {
  return adminApiRequest('/bulk/expire-tickets', {
    method: 'POST',
    body: JSON.stringify({ days_overdue: daysOverdue })
  });
};

// ===============================================
// ADMIN REVIEW MANAGEMENT APIs
// ===============================================

export const getAllReviewsAdmin = async (params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/reviews?${queryString}` : '/reviews';
  
  console.log('getAllReviewsAdmin - Original params:', params);
  console.log('getAllReviewsAdmin - Cleaned params:', cleanParams(params));
  console.log('getAllReviewsAdmin - Final endpoint:', endpoint);
  
  return adminApiRequest(endpoint);
};

export const getReviewDetailsAdmin = async (reviewId) => {
  return adminApiRequest(`/reviews/${reviewId}`);
};

export const getReviewStatisticsAdmin = async (months = 12) => {
  return adminApiRequest(`/reviews/stats?months=${months}`);
};

export const getReviewsByRecruiterAdmin = async (recruiterId, params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/reviews/by-recruiter/${recruiterId}?${queryString}` : `/reviews/by-recruiter/${recruiterId}`;
  return adminApiRequest(endpoint);
};

export const getReviewTrendsAdmin = async (params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/reviews/trends?${queryString}` : '/reviews/trends';
  return adminApiRequest(endpoint);
};

// ===============================================
// ADMIN EXPORT APIs
// ===============================================

export const exportAllRecruitersDataAdmin = async (params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/export/all-recruiters?${queryString}` : '/export/all-recruiters';
  return adminApiRequest(endpoint);
};

export const exportSingleRecruiterDataAdmin = async (recruiterId, params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/export/recruiter/${recruiterId}?${queryString}` : `/export/recruiter/${recruiterId}`;
  return adminApiRequest(endpoint);
};

export const exportReviewsDataAdmin = async (params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/export/reviews?${queryString}` : '/export/reviews';
  return adminApiRequest(endpoint);
};

export const exportTicketsDataAdmin = async (params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/export/tickets?${queryString}` : '/export/tickets';
  return adminApiRequest(endpoint);
};

export const exportUserActivityAdmin = async (userId, params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/export/user-activity/${userId}?${queryString}` : `/export/user-activity/${userId}`;
  return adminApiRequest(endpoint);
};

// ===============================================
// ADMIN SYSTEM MANAGEMENT APIs
// ===============================================

export const getSystemStatisticsAdmin = async () => {
  return adminApiRequest('/system/stats');
};

export const runSystemCleanupAdmin = async () => {
  return adminApiRequest('/system/cleanup', { method: 'POST' });
};

export const getMaintenanceStatusAdmin = async () => {
  return adminApiRequest('/system/maintenance');
};

// ===============================================
// ADMIN REPORTING APIs
// ===============================================

export const getPerformanceSummaryReportAdmin = async (months = 3) => {
  return adminApiRequest(`/reports/performance-summary?months=${months}`);
};

export const getMonthlySummaryReportAdmin = async (year, month) => {
  return adminApiRequest(`/reports/monthly-summary?year=${year}&month=${month}`);
};

export const generateCustomReportAdmin = async (reportType, filters) => {
  return adminApiRequest('/reports/custom', {
    method: 'POST',
    body: JSON.stringify({ report_type: reportType, filters })
  });
};

// ===============================================
// ADMIN COMMENT MANAGEMENT APIs
// ===============================================

export const getAllCandidateCommentsAdmin = async (params = {}) => {
  const queryString = buildQueryString(params);
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
// PUBLIC LOOKUP APIs (No Auth)
// ===============================================

export const getDropdownData = async () => {
  return apiRequest('/public/dropdown-data', {}, false);
};

export const getFilteredTeams = async (buId, bfId) => {
  const params = cleanParams({ bu_id: buId, bf_id: bfId });
  const queryString = Object.keys(params).length > 0 ? `?${buildQueryString(params)}` : '';
  const endpoint = `/public/teams${queryString}`;
  return apiRequest(endpoint, {}, false);
};

export const getFilteredClients = async (geoId) => {
  const params = cleanParams({ geo_id: geoId });
  const queryString = Object.keys(params).length > 0 ? `?${buildQueryString(params)}` : '';
  const endpoint = `/public/clients${queryString}`;
  return apiRequest(endpoint, {}, false);
};

// ===============================================
// PROTECTED LOOKUP APIs
// ===============================================

export const getDropdownDataProtected = async () => {
  return apiRequest('/lookups/dropdown-data');
};

export const getFilteredTeamsProtected = async (buId, bfId) => {
  const params = cleanParams({ bu_id: buId, bf_id: bfId });
  const queryString = Object.keys(params).length > 0 ? `?${buildQueryString(params)}` : '';
  const endpoint = `/lookups/teams${queryString}`;
  return apiRequest(endpoint);
};

export const getFilteredClientsProtected = async (geoId) => {
  const params = cleanParams({ geo_id: geoId });
  const queryString = Object.keys(params).length > 0 ? `?${buildQueryString(params)}` : '';
  const endpoint = `/lookups/clients${queryString}`;
  return apiRequest(endpoint);
};

// ===============================================
// CANDIDATE APIs
// ===============================================

export const getCandidates = async (page = 1, limit = 20) => {
  return apiRequest(`/candidates?page=${page}&limit=${limit}`);
};

export const getCandidateDetails = async (candidateId) => {
  return apiRequest(`/candidates/details?candidate_id=${candidateId}`);
};

export const getUpcomingCandidates = async (days = 7) => {
  return apiRequest(`/candidates/upcoming?days=${days}`);
};

export const searchCandidates = async (searchParams) => {
  const params = buildQueryString(searchParams);
  return apiRequest(`/candidates/search?${params}`);
};

// ===============================================
// CANDIDATE COMMENTS APIs
// ===============================================

export const addCandidateComment = async (commentData) => {
  return apiRequest('/candidates/comments', {
    method: 'POST',
    body: JSON.stringify(commentData)
  });
};

export const getCandidateComments = async (candidateId) => {
  return apiRequest(`/candidates/${candidateId}/comments`);
};

export const updateCandidateComment = async (commentId, updateData) => {
  return apiRequest(`/candidates/comments/${commentId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  });
};

export const deleteCandidateComment = async (commentId) => {
  return apiRequest(`/candidates/comments/${commentId}`, {
    method: 'DELETE'
  });
};

// ===============================================
// REVIEW APIs
// ===============================================

export const raiseReviewRequest = async (reviewData) => {
  return apiRequest('/reviews/create', {
    method: 'POST',
    body: JSON.stringify(reviewData)
  });
};

export const getReviewTickets = async (status = null, limit = 50) => {
  const params = cleanParams({ status, limit });
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/reviews/tickets?${queryString}` : '/reviews/tickets';
  return apiRequest(endpoint);
};

export const updateTicket = async (ticketData) => {
  return apiRequest('/reviews/update', {
    method: 'PUT',
    body: JSON.stringify(ticketData)
  });
};

export const updateReviewStatus = async (statusData) => {
  return apiRequest('/reviews/update-status', {
    method: 'POST',
    body: JSON.stringify(statusData)
  });
};

export const submitReview = async (reviewData) => {
  return apiRequest('/reviews/submit', {
    method: 'POST',
    body: JSON.stringify(reviewData)
  });
};

export const sendReminder = async (ticketId) => {
  return apiRequest('/reviews/reminder', {
    method: 'POST',
    body: JSON.stringify({ ticket_id: ticketId })
  });
};

// ===============================================
// TEMPLATE APIs
// ===============================================

export const getEmailTemplates = async (geoId, bfId, templateType) => {
  const params = cleanParams({ geo_id: geoId, bf_id: bfId, template_type: templateType });
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/templates?${queryString}` : '/templates';
  
  return apiRequest(endpoint);
};

export const createTemplate = async (templateData) => {
  return apiRequest('/templates', {
    method: 'POST',
    body: JSON.stringify(templateData)
  });
};

// ===============================================
// SIGNATURE APIs
// ===============================================

export const getUserSignatures = async () => {
  return apiRequest('/signatures');
};

export const getSignatureById = async (signatureId) => {
  return apiRequest(`/signatures/${signatureId}`);
};

export const createSignature = async (signatureData) => {
  return apiRequest('/signatures', {
    method: 'POST',
    body: JSON.stringify(signatureData)
  });
};

export const updateSignature = async (signatureId, signatureData) => {
  return apiRequest(`/signatures/${signatureId}`, {
    method: 'PUT',
    body: JSON.stringify(signatureData)
  });
};

export const deleteSignature = async (signatureId) => {
  return apiRequest(`/signatures/${signatureId}`, {
    method: 'DELETE'
  });
};

export const setDefaultSignature = async (signatureId) => {
  return apiRequest(`/signatures/${signatureId}/set-default`, {
    method: 'POST'
  });
};

export const getDefaultSignature = async () => {
  return apiRequest('/signatures/default');
};

export const previewSignature = async (signatureHtml) => {
  return apiRequest('/signatures/preview', {
    method: 'POST',
    body: JSON.stringify({ signature_html: signatureHtml })
  });
};

// ===============================================
// FILE UPLOAD API
// ===============================================

export const uploadFile = async (file) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      credentials: 'include', // Important for CORS
      mode: 'cors',
      body: formData
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
};

// ===============================================
// SYSTEM/UTILITY APIs
// ===============================================

export const validateToken = async () => {
  return apiRequest('/utils/validate-token');
};

export const getSystemInfo = async () => {
  return apiRequest('/utils/system-info');
};

export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api/candidateReviews', '')}/health`, {
      mode: 'cors',
      credentials: 'include'
    });
    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

export const adminHealthCheck = async () => {
  try {
    const response = await fetch(`${ADMIN_API_BASE_URL.replace('/api/admin', '')}/health`, {
      mode: 'cors',
      credentials: 'include'
    });
    return await response.json();
  } catch (error) {
    console.error('Admin health check failed:', error);
    throw error;
  }
};

// ===============================================
// ADMIN PERFORMANCE APIs
// ===============================================

export const getAdminCandidateCommentsDetails = async (params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/performance/candidate-comments?${queryString}` : '/performance/candidate-comments';
  return adminApiRequest(endpoint);
};

export const getAdminRecruiterFullDetails = async (params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/performance/recruiter-full-details?${queryString}` : '/performance/recruiter-full-details';
  return adminApiRequest(endpoint);
};

export const getAdminTopPerformingRecruiters = async (params = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/performance/top-performers?${queryString}` : '/performance/top-performers';
  return adminApiRequest(endpoint);
};

// ===============================================
// ADMIN INCENTIVE APIs
// ===============================================

export const adminIncentiveAPI = {
  calculateIncentives: async (params = {}) => {
    const queryString = buildQueryString(params);
    const endpoint = queryString ? `/incentives/calculate?${queryString}` : '/incentives/calculate';
    return adminApiRequest(endpoint);
  },
  
  getRecruiterSummary: async (params = {}) => {
    const queryString = buildQueryString(params);
    const endpoint = queryString ? `/incentives/summary/recruiter?${queryString}` : '/incentives/summary/recruiter';
    return adminApiRequest(endpoint);
  },
  
  getTeamSummary: async (params = {}) => {
    const queryString = buildQueryString(params);
    const endpoint = queryString ? `/incentives/summary/team?${queryString}` : '/incentives/summary/team';
    return adminApiRequest(endpoint);
  },
  
  exportReport: async (params = {}) => {
    const queryString = buildQueryString(params);
    const endpoint = queryString ? `/incentives/export?${queryString}` : '/incentives/export';
    
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    const response = await fetch(`${ADMIN_API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    return response.blob();
  },
  
  getRecruiterHistory: async (params = {}) => {
    const endpoint = `/incentives/recruiter/${params.recruiter_id}/history?months=${params.months || 6}`;
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    
    const response = await fetch(`${ADMIN_API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch recruiter history');
    }
    
    return response.json();
  },
  
  bulkApprove: async (data) => {
    return adminApiRequest('/incentives/bulk-approve', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  generatePaymentReport: async (params = {}) => {
    const queryString = buildQueryString(params);
    const endpoint = queryString ? `/incentives/payment-report?${queryString}` : '/incentives/payment-report';
    return adminApiRequest(endpoint);
  },
  
  // Payment Status Tracking
  updatePaymentStatus: async (data) => {
    return adminApiRequest('/incentives/update-payment-status', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  markReviewsAsPaid: async (reviewIds, paymentDetails = {}) => {
    return adminApiRequest('/incentives/mark-paid', {
      method: 'POST',
      body: JSON.stringify({
        review_ids: reviewIds,
        payment_date: paymentDetails.payment_date || new Date().toISOString(),
        payment_reference: paymentDetails.payment_reference || '',
        payment_notes: paymentDetails.payment_notes || 'Marked as paid by admin',
        payment_method: paymentDetails.payment_method || 'bank_transfer'
      })
    });
  },
  
  markReviewsAsUnpaid: async (reviewIds, reason = '') => {
    return adminApiRequest('/incentives/mark-unpaid', {
      method: 'POST',
      body: JSON.stringify({
        review_ids: reviewIds,
        reason: reason || 'Marked as unpaid by admin'
      })
    });
  },
  
  updateRecruiterPaymentStatus: async (recruiterId, paymentStatus, params = {}) => {
    return adminApiRequest(`/incentives/recruiter/${recruiterId}/payment-status`, {
      method: 'POST',
      body: JSON.stringify({
        payment_status: paymentStatus,
        ...params
      })
    });
  },
  
  getRecruiterPaymentHistory: async (recruiterId, params = {}) => {
    const queryString = buildQueryString(params);
    const endpoint = queryString 
      ? `/incentives/recruiter/${recruiterId}/payment-history?${queryString}` 
      : `/incentives/recruiter/${recruiterId}/payment-history`;
    return adminApiRequest(endpoint);
  },
  
  generatePaymentSummary: async (params = {}) => {
    const queryString = buildQueryString(params);
    const endpoint = queryString 
      ? `/incentives/payment-summary?${queryString}` 
      : '/incentives/payment-summary';
    return adminApiRequest(endpoint);
  },
  
  exportPaymentReport: async (params = {}) => {
    const queryString = buildQueryString({
      ...params,
      include_payment_status: true,
      include_payment_details: true
    });
    const endpoint = queryString 
      ? `/incentives/export-payment-report?${queryString}` 
      : '/incentives/export-payment-report';
    
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    const response = await fetch(`${ADMIN_API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    return response.blob();
  },
  
  getPaymentStatistics: async (params = {}) => {
    const queryString = buildQueryString(params);
    const endpoint = queryString 
      ? `/incentives/payment-statistics?${queryString}` 
      : '/incentives/payment-statistics';
    return adminApiRequest(endpoint);
  },
  
  processBatchPayment: async (data) => {
    return adminApiRequest('/incentives/process-batch-payment', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  getPendingPayments: async (params = {}) => {
    const queryString = buildQueryString(params);
    const endpoint = queryString 
      ? `/incentives/pending-payments?${queryString}` 
      : '/incentives/pending-payments';
    return adminApiRequest(endpoint);
  },
  
  verifyPaymentStatus: async (reviewIds) => {
    return adminApiRequest('/incentives/verify-payment-status', {
      method: 'POST',
      body: JSON.stringify({ review_ids: reviewIds })
    });
  },
  
  getPaymentAuditLog: async (params = {}) => {
    const queryString = buildQueryString(params);
    const endpoint = queryString 
      ? `/incentives/payment-audit-log?${queryString}` 
      : '/incentives/payment-audit-log';
    return adminApiRequest(endpoint);
  }
};

// ===============================================
// USER INCENTIVE APIs
// ===============================================

export const userIncentiveAPI = {
  getMyIncentives: async (params = {}) => {
    const queryString = buildQueryString(params);
    const endpoint = queryString ? `/incentives/my-incentives?${queryString}` : '/incentives/my-incentives';
    return apiRequest(endpoint);
  },
  
  getMyDashboard: async () => {
    return apiRequest('/incentives/my-dashboard');
  },
  
  getMyHistory: async (params = {}) => {
    const queryString = buildQueryString(params);
    const endpoint = queryString ? `/incentives/my-history?${queryString}` : '/incentives/my-history';
    return apiRequest(endpoint);
  },
  
  exportMyIncentives: async (params = {}) => {
    const queryString = buildQueryString(params);
    const endpoint = queryString ? `/incentives/my-incentives/export?${queryString}` : '/incentives/my-incentives/export';
    return apiRequest(endpoint);
  },
  
  getMyRanking: async (params = {}) => {
    const queryString = buildQueryString(params);
    const endpoint = queryString ? `/incentives/my-ranking?${queryString}` : '/incentives/my-ranking';
    return apiRequest(endpoint);
  },
  
  getTeamComparison: async (params = {}) => {
    const queryString = buildQueryString(params);
    const endpoint = queryString ? `/incentives/my-team-comparison?${queryString}` : '/incentives/my-team-comparison';
    return apiRequest(endpoint);
  }
};

// ===============================================
// ERROR HANDLING
// ===============================================

export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    console.log('Unauthorized - logging out');
    logout();
    return;
  }
  
  return error.message || 'An unexpected error occurred';
};

export const handleAdminApiError = (error) => {
  console.error('Admin API Error:', error);
  
  if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    console.log('Admin unauthorized - logging out');
    adminLogout();
    return;
  }
  
  return error.message || 'An unexpected error occurred';
};

// ===============================================
// DEBUG UTILITIES
// ===============================================

export const testParameterCleaning = () => {
  const testParams = {
    status: '',
    recruiter_id: '',
    date_from: '',
    date_to: '',
    overdue_only: false,
    page: 1,
    limit: 20,
    search: '  ',
    valid_param: 'test'
  };
  
  console.log('Original params:', testParams);
  console.log('Cleaned params:', cleanParams(testParams));
  console.log('Query string:', buildQueryString(testParams));
  
  return {
    original: testParams,
    cleaned: cleanParams(testParams),
    queryString: buildQueryString(testParams)
  };
};

export const testDatabaseConnection = async () => {
  try {
    return await adminApiRequest('/debug/test-connection');
  } catch (error) {
    console.error('Database test failed:', error);
    throw error;
  }
};

// Export parameter utilities for external use
export { cleanParams, buildQueryString };