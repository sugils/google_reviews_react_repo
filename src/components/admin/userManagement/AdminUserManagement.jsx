import React, { useState, useEffect } from 'react';
import { 
  getAllUsersAdmin,
  getUserDetailsAdmin,
  updateUserAdmin,
  deactivateUserAdmin,
  resetUserPasswordAdmin,
  promoteUserToAdmin,
  getAdminDropdownData,
  getReviewsByRecruiterAdmin,
  handleAdminApiError 
} from '../../../services/api';
import toast from 'react-hot-toast';
import './AdminUserManagement.css';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    status: 'active',
    bu_id: '',
    bf_id: '',
    geo_id: ''
  });
  const [dropdownData, setDropdownData] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total_count: 0,
    total_pages: 0
  });

  useEffect(() => {
    loadUsers();
    loadDropdownData();
  }, [filters, pagination.page, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        search: searchTerm,
        page: pagination.page,
        limit: pagination.limit
      };

      const response = await getAllUsersAdmin(params);
      if (response.success) {
        setUsers(response.data.users || []);
        setPagination(prev => ({
          ...prev,
          total_count: response.data.pagination?.total_count || 0,
          total_pages: response.data.pagination?.total_pages || 0
        }));
      }
    } catch (error) {
      const errorMessage = handleAdminApiError(error);
      toast.error(errorMessage || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadDropdownData = async () => {
    try {
      const response = await getAdminDropdownData();
      if (response.success) {
        setDropdownData(response.data);
      }
    } catch (error) {
      console.error('Failed to load dropdown data:', error);
    }
  };

  const handleViewDetails = async (userId) => {
    try {
      const response = await getUserDetailsAdmin(userId);
      if (response.success) {
        setSelectedUser(response.data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      const errorMessage = handleAdminApiError(error);
      toast.error(errorMessage || 'Failed to load user details');
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (userData) => {
    try {
      const response = await updateUserAdmin(selectedUser.user_id, userData);
      if (response.success) {
        toast.success('User updated successfully');
        setShowEditModal(false);
        loadUsers();
      }
    } catch (error) {
      const errorMessage = handleAdminApiError(error);
      toast.error(errorMessage || 'Failed to update user');
    }
  };

  const openDeactivateModal = (userId) => {
    setSelectedUserId(userId);
    setShowDeactivateModal(true);
  };

  const handleDeactivateConfirm = async (reason) => {
    try {
      const response = await deactivateUserAdmin(selectedUserId, reason);
      if (response.success) {
        toast.success('User deactivated successfully');
        setShowDeactivateModal(false);
        loadUsers();
      }
    } catch (error) {
      const errorMessage = handleAdminApiError(error);
      toast.error(errorMessage || 'Failed to deactivate user');
    }
  };

  const openResetPasswordModal = (userId) => {
    setSelectedUserId(userId);
    setShowResetPasswordModal(true);
  };

  const handleResetPasswordConfirm = async (passwordData) => {
    try {
      const response = await resetUserPasswordAdmin(selectedUserId, passwordData);
      if (response.success) {
        toast.success(`Password reset successfully. ${passwordData.temporary_password ? 'Custom password set.' : `Temporary password: ${response.data.temporary_password}`}`);
        setShowResetPasswordModal(false);
      }
    } catch (error) {
      const errorMessage = handleAdminApiError(error);
      toast.error(errorMessage || 'Failed to reset password');
    }
  };

  const handlePromoteToAdmin = async (userId) => {
    if (window.confirm('Are you sure you want to promote this user to admin?')) {
      try {
        const response = await promoteUserToAdmin(userId, 'Promoted by admin');
        if (response.success) {
          toast.success('User promoted to admin successfully');
          loadUsers();
        }
      } catch (error) {
        const errorMessage = handleAdminApiError(error);
        toast.error(errorMessage || 'Failed to promote user');
      }
    }
  };

  const handleResetFilters = () => {
    setFilters({
      role: '',
      status: 'active',
      bu_id: '',
      bf_id: '',
      geo_id: ''
    });
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'aum-role-admin';
      case 'recruiter': return 'aum-role-recruiter';
      default: return 'aum-role-user';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#ef4444';
      case 'recruiter': return '#6366f1';
      default: return '#6b7280';
    }
  };

  const stats = {
    total: pagination.total_count,
    active: users.filter(u => u.is_active).length,
    admins: users.filter(u => u.role === 'admin').length,
    recruiters: users.filter(u => u.role === 'recruiter').length
  };

  if (loading && users.length === 0) {
    return (
      <div className="aum-user-loading">
        <div className="aum-loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="aum-user-management-container">
      {/* Module Header */}
      <div className="aum-module-header">

        <div className="aum-header-stats">
          <div className="aum-stat-card">
            <div className="aum-stat-icon" style={{ background: '#6366f1' }}>
              <i className="fas fa-users"></i>
            </div>
            <div className="aum-stat-info">
              <span className="aum-stat-value">{stats.total}</span>
              <span className="aum-stat-label">Total Users</span>
            </div>
          </div>
          <div className="aum-stat-card">
            <div className="aum-stat-icon" style={{ background: '#10b981' }}>
              <i className="fas fa-user-check"></i>
            </div>
            <div className="aum-stat-info">
              <span className="aum-stat-value">{stats.active}</span>
              <span className="aum-stat-label">Active</span>
            </div>
          </div>
          <div className="aum-stat-card">
            <div className="aum-stat-icon" style={{ background: '#ef4444' }}>
              <i className="fas fa-user-shield"></i>
            </div>
            <div className="aum-stat-info">
              <span className="aum-stat-value">{stats.admins}</span>
              <span className="aum-stat-label">Admins</span>
            </div>
          </div>
          <div className="aum-stat-card">
            <div className="aum-stat-icon" style={{ background: '#8b5cf6' }}>
              <i className="fas fa-user-tie"></i>
            </div>
            <div className="aum-stat-info">
              <span className="aum-stat-value">{stats.recruiters}</span>
              <span className="aum-stat-label">Recruiters</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="aum-filters-bar">
        <div className="aum-filters-left">
          <div className="aum-search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="aum-filters-right">
          <select
            className="aum-filter-select"
            value={filters.role}
            onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="recruiter">Recruiter</option>
          </select>

          <select
            className="aum-filter-select"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            className="aum-filter-select"
            value={filters.bu_id}
            onChange={(e) => setFilters(prev => ({ ...prev, bu_id: e.target.value }))}
          >
            <option value="">All Business Units</option>
            {dropdownData.business_units?.map(bu => (
              <option key={bu.bu_id} value={bu.bu_id}>{bu.bu_name}</option>
            ))}
          </select>

          <select
            className="aum-filter-select"
            value={filters.geo_id}
            onChange={(e) => setFilters(prev => ({ ...prev, geo_id: e.target.value }))}
          >
            <option value="">All Locations</option>
            {dropdownData.geo_locations?.map(geo => (
              <option key={geo.geo_id} value={geo.geo_id}>{geo.geo_name}</option>
            ))}
          </select>

          <button 
            className="aum-filter-reset-btn"
            onClick={handleResetFilters}
            title="Reset Filters"
          >
            <i className="fas fa-redo"></i>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="aum-users-table-container">
        <div className="aum-table-header">
          <h2>Users ({pagination.total_count})</h2>
          <span className="aum-showing-text">
            Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total_count)} - {Math.min(pagination.page * pagination.limit, pagination.total_count)} of {pagination.total_count}
          </span>
        </div>

        <div className="aum-table-wrapper">
          <table className="aum-users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Business Unit</th>
                <th>Location</th>
                <th>Performance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map(user => (
                  <tr key={user.user_id}>
                    <td>
                      <div className="aum-user-info">
                        <div className="aum-user-avatar" style={{ background: getRoleColor(user.role) }}>
                          {user.user_name ? user.user_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="aum-user-details">
                          <span className="aum-user-name">{user.user_name}</span>
                          <span className="aum-user-email">{user.user_email}</span>
                          <span className="aum-user-id">ID: {user.employee_id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span 
                        className="aum-role-badge"
                        style={{ 
                          backgroundColor: `${getRoleColor(user.role)}20`,
                          color: getRoleColor(user.role)
                        }}
                      >
                        <i className={`fas ${user.role === 'admin' ? 'fa-crown' : 'fa-user-tie'}`}></i>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <div className="aum-business-info">
                        <span className="aum-bu-name">{user.bu_name || 'N/A'}</span>
                        <span className="aum-bf-name">{user.bf_name || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="aum-location-info">
                        <i className="fas fa-map-marker-alt"></i>
                        {user.geo_name || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div className="aum-performance-stats">
                        <div className="aum-stat-item">
                          <i className="fas fa-star"></i>
                          <strong>{user.total_reviews || 0}</strong> reviews
                        </div>
                        <div className="aum-stat-item">
                          <i className="fas fa-chart-line"></i>
                          <strong>{user.avg_rating ? user.avg_rating.toFixed(1) : '0.0'}</strong> rating
                        </div>
                        <div className="aum-stat-item">
                          <i className="fas fa-ticket-alt"></i>
                          <strong>{user.total_tickets || 0}</strong> tickets
                        </div>
                      </div>
                    </td>
                    <td>
                      <span 
                        className="aum-status-badge"
                        style={{ 
                          backgroundColor: user.is_active ? '#10b98120' : '#ef444420',
                          color: user.is_active ? '#10b981' : '#ef4444'
                        }}
                      >
                        <span className={`aum-status-dot ${user.is_active ? 'aum-active' : 'aum-inactive'}`}></span>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="aum-table-actions">
                        <button
                          className="aum-action-btn aum-view"
                          onClick={() => handleViewDetails(user.user_id)}
                          title="View Details"
                        >
                          <i className="fas fa-eye"></i>
                          <span className="aum-tooltip">View Details</span>
                        </button>
                        <button
                          className="aum-action-btn aum-edit"
                          onClick={() => handleEditUser(user)}
                          title="Edit User"
                        >
                          <i className="fas fa-edit"></i>
                          <span className="aum-tooltip">Edit User</span>
                        </button>
                        <button
                          className="aum-action-btn aum-password"
                          onClick={() => openResetPasswordModal(user.user_id)}
                          title="Reset Password"
                        >
                          <i className="fas fa-key"></i>
                          <span className="aum-tooltip">Reset Password</span>
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            className="aum-action-btn aum-promote"
                            onClick={() => handlePromoteToAdmin(user.user_id)}
                            title="Promote to Admin"
                          >
                            <i className="fas fa-crown"></i>
                            <span className="aum-tooltip">Promote to Admin</span>
                          </button>
                        )}
                        {user.is_active && (
                          <button
                            className="aum-action-btn aum-deactivate"
                            onClick={() => openDeactivateModal(user.user_id)}
                            title="Deactivate User"
                          >
                            <i className="fas fa-ban"></i>
                            <span className="aum-tooltip">Deactivate</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="aum-empty-state">
                    <i className="fas fa-users"></i>
                    <h3>No users found</h3>
                    <p>Try adjusting your filters or search criteria</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="aum-pagination-bar">
            <div className="aum-pagination-info">
              Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total_count)} - {Math.min(pagination.page * pagination.limit, pagination.total_count)} of {pagination.total_count} users
            </div>
            <div className="aum-pagination-controls">
              <button
                className="aum-page-btn"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              
              <span className="aum-page-info">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              
              <button
                className="aum-page-btn"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.total_pages}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          dropdownData={dropdownData}
          onSave={handleUpdateUser}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Deactivate User Modal */}
      {showDeactivateModal && (
        <DeactivateUserModal
          onConfirm={handleDeactivateConfirm}
          onClose={() => setShowDeactivateModal(false)}
        />
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <ResetPasswordModal
          onConfirm={handleResetPasswordConfirm}
          onClose={() => setShowResetPasswordModal(false)}
        />
      )}
    </div>
  );
};

// Deactivate User Modal Component
const DeactivateUserModal = ({ onConfirm, onClose }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason for deactivation');
      return;
    }
    setLoading(true);
    try {
      await onConfirm(reason);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="aum-modal-overlay" onClick={onClose}>
      <div className="aum-modal-content aum-action-modal" onClick={e => e.stopPropagation()}>
        <div className="aum-modal-header">
          <div className="aum-modal-title">
            <i className="fas fa-ban" style={{ color: '#ef4444' }}></i>
            <h2>Deactivate User</h2>
          </div>
          <button className="aum-modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="aum-modal-body">
            <div className="aum-warning-banner">
              <i className="fas fa-exclamation-triangle"></i>
              <p>You are about to deactivate this user account. They will lose access to the system immediately.</p>
            </div>

            <div className="aum-form-field">
              <label>
                <i className="fas fa-comment-alt"></i>
                Reason for Deactivation *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a detailed reason for deactivating this user account..."
                rows="4"
                required
                className="aum-textarea"
              />
              <span className="aum-field-hint">This reason will be logged and may be visible to system administrators</span>
            </div>
          </div>
          
          <div className="aum-modal-footer">
            <button type="button" className="aum-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="aum-btn-danger" disabled={loading}>
              <i className="fas fa-ban"></i>
              {loading ? 'Deactivating...' : 'Deactivate User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Reset Password Modal Component
const ResetPasswordModal = ({ onConfirm, onClose }) => {
  const [passwordOption, setPasswordOption] = useState('random');
  const [customPassword, setCustomPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({ level: 0, message: '' });

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength({ level: 0, message: '' });
      return;
    }

    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    // Calculate strength level
    if (checks.length) strength++;
    if (checks.lowercase) strength++;
    if (checks.uppercase) strength++;
    if (checks.numbers) strength++;
    if (checks.special) strength++;

    // Set strength message and level
    const strengthLevels = {
      0: { message: '', color: '' },
      1: { message: 'Very Weak', color: '#ef4444' },
      2: { message: 'Weak', color: '#f59e0b' },
      3: { message: 'Fair', color: '#eab308' },
      4: { message: 'Good', color: '#22c55e' },
      5: { message: 'Strong', color: '#10b981' }
    };

    setPasswordStrength({ 
      level: strength, 
      message: strengthLevels[strength].message,
      color: strengthLevels[strength].color,
      checks 
    });
  };

  // Handle password change with strength calculation
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setCustomPassword(newPassword);
    calculatePasswordStrength(newPassword);
    
    // Clear confirm password error if passwords now match
    if (confirmPassword && newPassword === confirmPassword) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.confirmPassword;
        return newErrors;
      });
    }
  };

  // Handle confirm password change
  const handleConfirmPasswordChange = (e) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    
    // Clear error if passwords now match
    if (customPassword && customPassword === newConfirmPassword) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.confirmPassword;
        return newErrors;
      });
    }
  };

  // Validate passwords
  const validatePassword = () => {
    const newErrors = {};
    
    if (passwordOption === 'custom') {
      if (!customPassword) {
        newErrors.customPassword = 'Password is required';
      } else if (customPassword.length < 8) {
        newErrors.customPassword = 'Password must be at least 8 characters';
      } else if (!/[a-z]/.test(customPassword)) {
        newErrors.customPassword = 'Password must contain at least one lowercase letter';
      } else if (!/[A-Z]/.test(customPassword)) {
        newErrors.customPassword = 'Password must contain at least one uppercase letter';
      } else if (!/\d/.test(customPassword)) {
        newErrors.customPassword = 'Password must contain at least one number';
      }
      
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Please confirm the password';
      } else if (customPassword !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    setLoading(true);
    try {
      const passwordData = passwordOption === 'custom' 
        ? { temporary_password: customPassword }
        : {};
      await onConfirm(passwordData);
      onClose();
    } catch (error) {
      setLoading(false);
    }
  };

  // Reset form when switching password options
  const handleOptionChange = (option) => {
    setPasswordOption(option);
    setCustomPassword('');
    setConfirmPassword('');
    setErrors({});
    setPasswordStrength({ level: 0, message: '' });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className="aum-modal-overlay" onClick={onClose}>
      <div className="aum-modal-content aum-action-modal" onClick={e => e.stopPropagation()}>
        <div className="aum-modal-header">
          <div className="aum-modal-title">
            <i className="fas fa-key" style={{ color: '#f59e0b' }}></i>
            <h2>Reset User Password</h2>
          </div>
          <button className="aum-modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} noValidate>
          <div className="aum-modal-body">
            <div className="aum-info-banner">
              <i className="fas fa-info-circle"></i>
              <p>The user will receive an email with their new password. They should change it upon next login.</p>
            </div>

            <div className="aum-password-options">
              <label className="aum-radio-option">
                <input
                  type="radio"
                  name="passwordOption"
                  value="random"
                  checked={passwordOption === 'random'}
                  onChange={() => handleOptionChange('random')}
                />
                <span className="aum-radio-mark"></span>
                <div className="aum-radio-content">
                  <span className="aum-radio-label">Generate Random Password</span>
                  <span className="aum-radio-description">System will generate a secure 12-character temporary password</span>
                </div>
              </label>

              <label className="aum-radio-option">
                <input
                  type="radio"
                  name="passwordOption"
                  value="custom"
                  checked={passwordOption === 'custom'}
                  onChange={() => handleOptionChange('custom')}
                />
                <span className="aum-radio-mark"></span>
                <div className="aum-radio-content">
                  <span className="aum-radio-label">Set Custom Password</span>
                  <span className="aum-radio-description">Manually set a specific password for the user</span>
                </div>
              </label>
            </div>

            {passwordOption === 'custom' && (
              <div className="aum-password-fields">
                <div className="aum-form-field">
                  <label>
                    <i className="fas fa-lock"></i>
                    New Password *
                  </label>
                  <div className="aum-password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={customPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      className={errors.customPassword ? 'aum-error' : ''}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="aum-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                    </button>
                  </div>
                  
                  {errors.customPassword && (
                    <span className="aum-field-error">
                      <i className="fas fa-exclamation-circle"></i>
                      {errors.customPassword}
                    </span>
                  )}
                  
                  {customPassword && !errors.customPassword && (
                    <div className="aum-password-strength-indicator">
                      <div className="aum-strength-bar">
                        <div 
                          className="aum-strength-fill" 
                          style={{ 
                            width: `${(passwordStrength.level / 5) * 100}%`,
                            backgroundColor: passwordStrength.color
                          }}
                        ></div>
                      </div>
                      <span className="aum-strength-text" style={{ color: passwordStrength.color }}>
                        {passwordStrength.message}
                      </span>
                    </div>
                  )}
                  
                  <div className="aum-password-requirements">
                    <span className="aum-req-title">Password must contain:</span>
                    <div className="aum-req-list">
                      <span className={`aum-req-item ${customPassword.length >= 8 ? 'aum-req-met' : ''}`}>
                        <i className={`fas fa-${customPassword.length >= 8 ? 'check' : 'times'}`}></i>
                        At least 8 characters
                      </span>
                      <span className={`aum-req-item ${/[a-z]/.test(customPassword) ? 'aum-req-met' : ''}`}>
                        <i className={`fas fa-${/[a-z]/.test(customPassword) ? 'check' : 'times'}`}></i>
                        One lowercase letter
                      </span>
                      <span className={`aum-req-item ${/[A-Z]/.test(customPassword) ? 'aum-req-met' : ''}`}>
                        <i className={`fas fa-${/[A-Z]/.test(customPassword) ? 'check' : 'times'}`}></i>
                        One uppercase letter
                      </span>
                      <span className={`aum-req-item ${/\d/.test(customPassword) ? 'aum-req-met' : ''}`}>
                        <i className={`fas fa-${/\d/.test(customPassword) ? 'check' : 'times'}`}></i>
                        One number
                      </span>
                    </div>
                  </div>
                </div>

                <div className="aum-form-field">
                  <label>
                    <i className="fas fa-lock"></i>
                    Confirm Password *
                  </label>
                  <div className="aum-password-input">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      placeholder="Confirm new password"
                      className={errors.confirmPassword ? 'aum-error' : ''}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="aum-password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex="-1"
                    >
                      <i className={`fas fa-eye${showConfirmPassword ? '-slash' : ''}`}></i>
                    </button>
                  </div>
                  
                  {errors.confirmPassword && (
                    <span className="aum-field-error">
                      <i className="fas fa-exclamation-circle"></i>
                      {errors.confirmPassword}
                    </span>
                  )}
                  
                  {customPassword && confirmPassword && !errors.confirmPassword && customPassword === confirmPassword && (
                    <div className="aum-password-match">
                      <i className="fas fa-check-circle"></i>
                      Passwords match
                    </div>
                  )}
                </div>
              </div>
            )}

            {passwordOption === 'random' && (
              <div className="aum-random-password-info">
                <div className="aum-info-card">
                  <i className="fas fa-dice"></i>
                  <div>
                    <h4>Random Password Generation</h4>
                    <p>A secure 12-character password will be automatically generated containing uppercase letters, lowercase letters, numbers, and special characters.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="aum-modal-footer">
            <button type="button" className="aum-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="aum-btn-primary" 
              disabled={loading || (passwordOption === 'custom' && (!customPassword || !confirmPassword))}
            >
              <i className="fas fa-key"></i>
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// User Details Modal Component
const UserDetailsModal = ({ user, onClose }) => {
  const [userReviews, setUserReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (user && user.user_id) {
      loadUserReviews();
    }
  }, [user]);

  const loadUserReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await getReviewsByRecruiterAdmin(user.user_id, { limit: 10 });
      if (response.success) {
        setUserReviews(response.data.reviews || []);
      }
    } catch (error) {
      console.error('Failed to load user reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const getStarRating = (stars) => {
    return '★'.repeat(stars || 0) + '☆'.repeat(5 - (stars || 0));
  };

  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
  };

  return (
    <div className="aum-modal-overlay" onClick={onClose}>
      <div className="aum-modal-content aum-user-modal" onClick={e => e.stopPropagation()}>
        <div className="aum-modal-header">
          <div className="aum-modal-title">
            <i className="fas fa-user"></i>
            <h2>User Details</h2>
          </div>
          <button className="aum-modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="aum-modal-body">
          <div className="aum-user-profile-header">
            <div className="aum-profile-avatar-large">
              {user.user_name ? user.user_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="aum-profile-info">
              <h3>{user.user_name}</h3>
              <p>{user.user_email}</p>
              <span className={`aum-role-badge ${user.role === 'admin' ? 'aum-admin' : 'aum-recruiter'}`}>
                <i className={`fas ${user.role === 'admin' ? 'fa-crown' : 'fa-user-tie'}`}></i>
                {user.role}
              </span>
            </div>
          </div>

          <div className="aum-detail-sections">
            <div className="aum-detail-card">
              <div className="aum-detail-card-header">
                <i className="fas fa-info-circle"></i>
                <h3>Basic Information</h3>
              </div>
              <div className="aum-detail-items">
                <div className="aum-detail-item">
                  <label>Employee ID</label>
                  <span>{user.employee_id}</span>
                </div>
                <div className="aum-detail-item">
                  <label>Business Unit</label>
                  <span>{user.bu_name || 'Not assigned'}</span>
                </div>
                <div className="aum-detail-item">
                  <label>Business Function</label>
                  <span>{user.bf_name || 'Not assigned'}</span>
                </div>
                <div className="aum-detail-item">
                  <label>Location</label>
                  <span>{user.geo_name || 'Not assigned'}</span>
                </div>
              </div>
            </div>

            <div className="aum-detail-card">
              <div className="aum-detail-card-header">
                <i className="fas fa-chart-line"></i>
                <h3>Performance Metrics</h3>
              </div>
              <div className="aum-detail-items">
                <div className="aum-detail-item">
                  <label>Total Reviews</label>
                  <span>{user.review_stats?.total_reviews || user.total_reviews || 0}</span>
                </div>
                <div className="aum-detail-item">
                  <label>Average Rating</label>
                  <span className="aum-rating-value">
                    <i className="fas fa-star"></i>
                    {user.review_stats?.avg_rating?.toFixed(1) || user.avg_rating?.toFixed(1) || '0.0'}
                  </span>
                </div>
                <div className="aum-detail-item">
                  <label>5-Star Reviews</label>
                  <span>{user.review_stats?.five_star_count || 0}</span>
                </div>
                <div className="aum-detail-item">
                  <label>Total Stars</label>
                  <span>{user.review_stats?.total_stars || 0}</span>
                </div>
              </div>
            </div>

            <div className="aum-detail-card">
              <div className="aum-detail-card-header">
                <i className="fas fa-ticket-alt"></i>
                <h3>Ticket Statistics</h3>
              </div>
              <div className="aum-detail-items">
                <div className="aum-detail-item">
                  <label>Total Tickets</label>
                  <span>{user.ticket_stats?.total_tickets || user.total_tickets || 0}</span>
                </div>
                <div className="aum-detail-item">
                  <label>Completed</label>
                  <span className="aum-success-text">{user.ticket_stats?.completed_tickets || 0}</span>
                </div>
                <div className="aum-detail-item">
                  <label>Pending</label>
                  <span className="aum-warning-text">{user.ticket_stats?.pending_tickets || 0}</span>
                </div>
                <div className="aum-detail-item">
                  <label>Expired</label>
                  <span className="aum-danger-text">{user.ticket_stats?.expired_tickets || 0}</span>
                </div>
              </div>
            </div>

            <div className="aum-detail-card">
              <div className="aum-detail-card-header">
                <i className="fas fa-calendar-alt"></i>
                <h3>Account Information</h3>
              </div>
              <div className="aum-detail-items">
                <div className="aum-detail-item">
                  <label>Created</label>
                  <span>{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                <div className="aum-detail-item">
                  <label>Last Login</label>
                  <span>{user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}</span>
                </div>
                <div className="aum-detail-item">
                  <label>Status</label>
                  <span className={`aum-status-badge ${user.is_active ? 'aum-active' : 'aum-inactive'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Reviews Section */}
          {user.role === 'recruiter' && (
            <div className="aum-reviews-section">
              <h3>
                <i className="fas fa-star"></i>
                Recent Reviews
                <span className="aum-review-count">({userReviews.length} reviews)</span>
              </h3>
              {loadingReviews ? (
                <div className="aum-reviews-loading">
                  <div className="aum-loading-spinner-small"></div>
                  <p>Loading reviews...</p>
                </div>
              ) : userReviews.length > 0 ? (
                <div className="aum-reviews-list">
                  {userReviews.map((review, index) => (
                    <div key={index} className="aum-review-item">
                      <div className="aum-review-header">
                        <div className="aum-review-candidate">
                          <strong>{review.cfirstname} {review.clastname}</strong>
                          <span className="aum-review-date">{formatDate(review.review_received_date)}</span>
                        </div>
                        <div className="aum-review-rating">
                          <span className="aum-stars">{getStarRating(review.review_stars)}</span>
                          <span className="aum-rating-number">{review.review_stars}/5</span>
                        </div>
                      </div>
                      <div className="aum-review-details">
                        <div className="aum-review-meta">
                          <span className="aum-meta-item">
                            <i className="fas fa-briefcase"></i>
                            {review.job_title || 'N/A'}
                          </span>
                          <span className="aum-meta-item">
                            <i className="fas fa-building"></i>
                            {review.client_name || 'N/A'}
                          </span>
                        </div>
                        {review.review_message && (
                          <p className="aum-review-message">{review.review_message}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="aum-no-reviews">
                  <i className="fas fa-star-half-alt"></i>
                  <p>No reviews found for this user</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="aum-modal-footer">
          <button className="aum-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Edit User Modal Component
const EditUserModal = ({ user, dropdownData, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    user_name: user.user_name || '',
    user_email: user.user_email || '',
    role: user.role || 'recruiter',
    bu_id: user.bu_id || '',
    bf_id: user.bf_id || '',
    geo_id: user.geo_id || '',
    team_id: user.team_id || '',
    phone_number: user.phone_number || '',
    is_active: user.is_active !== undefined ? user.is_active : true
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="aum-modal-overlay" onClick={onClose}>
      <div className="aum-modal-content aum-edit-modal" onClick={e => e.stopPropagation()}>
        <div className="aum-modal-header">
          <div className="aum-modal-title">
            <i className="fas fa-edit"></i>
            <h2>Edit User</h2>
          </div>
          <button className="aum-modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="aum-modal-body">
            <div className="aum-form-grid">
              <div className="aum-form-field">
                <label>
                  <i className="fas fa-user"></i>
                  Full Name
                </label>
                <input
                  type="text"
                  name="user_name"
                  value={formData.user_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="aum-form-field">
                <label>
                  <i className="fas fa-envelope"></i>
                  Email Address
                </label>
                <input
                  type="email"
                  name="user_email"
                  value={formData.user_email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="aum-form-field">
                <label>
                  <i className="fas fa-user-tag"></i>
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="recruiter">Recruiter</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="aum-form-field">
                <label>
                  <i className="fas fa-phone"></i>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                />
              </div>

              <div className="aum-form-field">
                <label>
                  <i className="fas fa-building"></i>
                  Business Unit
                </label>
                <select
                  name="bu_id"
                  value={formData.bu_id}
                  onChange={handleChange}
                >
                  <option value="">Select Business Unit</option>
                  {dropdownData.business_units?.map(bu => (
                    <option key={bu.bu_id} value={bu.bu_id}>{bu.bu_name}</option>
                  ))}
                </select>
              </div>

              <div className="aum-form-field">
                <label>
                  <i className="fas fa-briefcase"></i>
                  Business Function
                </label>
                <select
                  name="bf_id"
                  value={formData.bf_id}
                  onChange={handleChange}
                >
                  <option value="">Select Business Function</option>
                  {dropdownData.business_functions?.map(bf => (
                    <option key={bf.bf_id} value={bf.bf_id}>{bf.bf_name}</option>
                  ))}
                </select>
              </div>

              <div className="aum-form-field">
                <label>
                  <i className="fas fa-map-marker-alt"></i>
                  Location
                </label>
                <select
                  name="geo_id"
                  value={formData.geo_id}
                  onChange={handleChange}
                >
                  <option value="">Select Location</option>
                  {dropdownData.geo_locations?.map(geo => (
                    <option key={geo.geo_id} value={geo.geo_id}>{geo.geo_name}</option>
                  ))}
                </select>
              </div>

              <div className="aum-form-field">
                <label>
                  <i className="fas fa-users"></i>
                  Team
                </label>
                <select
                  name="team_id"
                  value={formData.team_id}
                  onChange={handleChange}
                >
                  <option value="">Select Team</option>
                  {dropdownData.teams?.map(team => (
                    <option key={team.team_id} value={team.team_id}>{team.team_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="aum-form-field aum-checkbox-field">
              <label className="aum-checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                <span className="aum-checkbox-box"></span>
                <span>Active User</span>
              </label>
            </div>
          </div>
          
          <div className="aum-modal-footer">
            <button type="button" className="aum-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="aum-btn-primary" disabled={loading}>
              <i className="fas fa-save"></i>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUserManagement;