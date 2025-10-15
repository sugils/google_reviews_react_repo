import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Plus, Edit, Trash2, 
  Eye, MoreVertical, CheckCircle, XCircle, 
  UserPlus, Download, RefreshCw
} from 'lucide-react';
import './adminUsers.css';
import { 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  toggleUserStatus 
} from '../../services/api';
import { toast } from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [userForm, setUserForm] = useState({
    user_name: '',
    user_email: '',
    employee_id: '',
    business_unit: '',
    lead_recruiter: '',
    business_function: '',
    geo_location: '',
    team: '',
    user_role: 'user',
    password: '',
    confirm_password: ''
  });

  const businessUnits = ['Technology', 'Consulting', 'Healthcare', 'Finance', 'Retail'];
  const businessFunctions = ['IT', 'Finance', 'HR', 'Sales', 'Marketing', 'Operations'];
  const geoLocations = ['US', 'INDIA', 'CANADA', 'UK', 'AUSTRALIA'];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter, roleFilter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await getAllUsers();
      if (response.success) {
        setUsers(response.data);
      } else {
        toast.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.business_unit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.geo_location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(user => user.is_active === isActive);
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.user_role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setUserForm({
      user_name: '',
      user_email: '',
      employee_id: '',
      business_unit: '',
      lead_recruiter: '',
      business_function: '',
      geo_location: '',
      team: '',
      user_role: 'user',
      password: '',
      confirm_password: ''
    });
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserForm({
      user_name: user.user_name,
      user_email: user.user_email,
      employee_id: user.employee_id,
      business_unit: user.business_unit || '',
      lead_recruiter: user.lead_recruiter || '',
      business_function: user.business_function || '',
      geo_location: user.geo_location || '',
      team: user.team || '',
      user_role: user.user_role,
      password: '',
      confirm_password: ''
    });
    setShowUserModal(true);
  };

  const handleSubmitUser = async () => {
    // Validation
    const requiredFields = selectedUser 
      ? ['user_name', 'user_email', 'employee_id']
      : ['user_name', 'user_email', 'employee_id', 'password', 'confirm_password'];
    
    const missingFields = requiredFields.filter(field => !userForm[field]);
    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!selectedUser && userForm.password !== userForm.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      let response;
      if (selectedUser) {
        // Update user
        response = await updateUser(selectedUser.user_id, userForm);
      } else {
        // Create user
        response = await createUser(userForm);
      }

      if (response.success) {
        toast.success(selectedUser ? 'User updated successfully' : 'User created successfully');
        setShowUserModal(false);
        fetchUsers();
      } else {
        toast.error(response.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await toggleUserStatus(userId, !currentStatus);
      if (response.success) {
        toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchUsers();
      } else {
        toast.error(response.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      try {
        const response = await deleteUser(userId);
        if (response.success) {
          toast.success('User deleted successfully');
          fetchUsers();
        } else {
          toast.error(response.message || 'Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
      }
    }
  };

  const exportUsers = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Email,Employee ID,Role,Status,Business Unit,Location,Created Date\n"
      + filteredUsers.map(user => 
          `"${user.user_name}","${user.user_email}","${user.employee_id}","${user.user_role}","${user.is_active ? 'Active' : 'Inactive'}","${user.business_unit || ''}","${user.geo_location || ''}","${new Date(user.created_at).toLocaleDateString()}"`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "users_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Users exported successfully!');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="admin-users-loading">
        <div className="loading-spinner large"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="admin-users-container">
      <div className="admin-users-header">
        <div className="header-info">
          <h1>User Management</h1>
          <p>Manage user accounts, roles, and permissions</p>
        </div>
        <div className="header-actions">
          <button className="refresh-button" onClick={fetchUsers}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="export-button" onClick={exportUsers}>
            <Download size={16} />
            Export CSV
          </button>
          <button className="create-button" onClick={handleCreateUser}>
            <UserPlus size={16} />
            Add User
          </button>
        </div>
      </div>

      {/* Users Statistics */}
      <div className="users-stats">
        <div className="stat-item">
          <div className="stat-icon total">
            <Users size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{users.length}</span>
            <span className="stat-label">Total Users</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon active">
            <CheckCircle size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{users.filter(u => u.is_active).length}</span>
            <span className="stat-label">Active Users</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon inactive">
            <XCircle size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{users.filter(u => !u.is_active).length}</span>
            <span className="stat-label">Inactive Users</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon admins">
            <Users size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{users.filter(u => u.user_role === 'admin').length}</span>
            <span className="stat-label">Administrators</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="users-controls">
        <div className="search-section">
          <div className="search-input-wrapper">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search users by name, email, or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-group">
            <Filter size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="filter-group">
            <Users size={16} />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Administrators</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        {filteredUsers.length === 0 ? (
          <div className="no-users">
            <Users size={48} />
            <h3>No Users Found</h3>
            <p>
              {users.length === 0 
                ? "No users have been created yet."
                : "No users match your current filters."
              }
            </p>
          </div>
        ) : (
          <div className="users-table">
            <div className="table-header">
              <div className="table-cell">User</div>
              <div className="table-cell">Contact Info</div>
              <div className="table-cell">Role & Status</div>
              <div className="table-cell">Department</div>
              <div className="table-cell">Created</div>
              <div className="table-cell">Actions</div>
            </div>
            
            {filteredUsers.map((user) => (
              <div key={user.user_id} className="table-row">
                <div className="table-cell user-info">
                  <div className="user-avatar">
                    <Users size={16} />
                  </div>
                  <div className="user-details">
                    <h4>{user.user_name}</h4>
                    <span className="employee-id">{user.employee_id}</span>
                  </div>
                </div>

                <div className="table-cell contact-info">
                  <div className="contact-details">
                    <span className="email">{user.user_email}</span>
                    <span className="location">{user.geo_location || 'N/A'}</span>
                  </div>
                </div>

                <div className="table-cell role-status">
                  <div className="role-status-container">
                    <span className={`role-badge ${user.user_role}`}>
                      {user.user_role === 'admin' ? 'Admin' : 'User'}
                    </span>
                    <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                      {user.is_active ? (
                        <>
                          <CheckCircle size={12} />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle size={12} />
                          Inactive
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="table-cell department">
                  <div className="department-info">
                    <span className="business-unit">{user.business_unit || 'N/A'}</span>
                    <span className="business-function">{user.business_function || 'N/A'}</span>
                  </div>
                </div>

                <div className="table-cell created-date">
                  <span>{formatDate(user.created_at)}</span>
                </div>

                <div className="table-cell actions">
                  <div className="actions-menu">
                    <button 
                      className="action-btn view"
                      title="View Details"
                    >
                      <Eye size={14} />
                    </button>
                    <button 
                      className="action-btn edit"
                      onClick={() => handleEditUser(user)}
                      title="Edit User"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      className="action-btn toggle"
                      onClick={() => handleToggleUserStatus(user.user_id, user.is_active)}
                      title={user.is_active ? 'Deactivate User' : 'Activate User'}
                    >
                      {user.is_active ? <XCircle size={14} /> : <CheckCircle size={14} />}
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDeleteUser(user.user_id, user.user_name)}
                      title="Delete User"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="modal-overlay">
          <div className="user-modal">
            <div className="modal-header">
              <h2>{selectedUser ? 'Edit User' : 'Create New User'}</h2>
              <button 
                className="close-button"
                onClick={() => setShowUserModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={userForm.user_name}
                    onChange={(e) => setUserForm(prev => ({ ...prev, user_name: e.target.value }))}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={userForm.user_email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, user_email: e.target.value }))}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Employee ID *</label>
                  <input
                    type="text"
                    value={userForm.employee_id}
                    onChange={(e) => setUserForm(prev => ({ ...prev, employee_id: e.target.value }))}
                    placeholder="Enter employee ID"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>User Role</label>
                  <select
                    value={userForm.user_role}
                    onChange={(e) => setUserForm(prev => ({ ...prev, user_role: e.target.value }))}
                  >
                    <option value="user">User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Business Unit</label>
                  <select
                    value={userForm.business_unit}
                    onChange={(e) => setUserForm(prev => ({ ...prev, business_unit: e.target.value }))}
                  >
                    <option value="">Select Business Unit</option>
                    {businessUnits.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Business Function</label>
                  <select
                    value={userForm.business_function}
                    onChange={(e) => setUserForm(prev => ({ ...prev, business_function: e.target.value }))}
                  >
                    <option value="">Select Function</option>
                    {businessFunctions.map(func => (
                      <option key={func} value={func}>{func}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Geographic Location</label>
                  <select
                    value={userForm.geo_location}
                    onChange={(e) => setUserForm(prev => ({ ...prev, geo_location: e.target.value }))}
                  >
                    <option value="">Select Location</option>
                    {geoLocations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Team</label>
                  <input
                    type="text"
                    value={userForm.team}
                    onChange={(e) => setUserForm(prev => ({ ...prev, team: e.target.value }))}
                    placeholder="Enter team name"
                  />
                </div>

                <div className="form-group">
                  <label>Lead Recruiter</label>
                  <input
                    type="text"
                    value={userForm.lead_recruiter}
                    onChange={(e) => setUserForm(prev => ({ ...prev, lead_recruiter: e.target.value }))}
                    placeholder="Enter lead recruiter name"
                  />
                </div>

                {!selectedUser && (
                  <>
                    <div className="form-group">
                      <label>Password *</label>
                      <input
                        type="password"
                        value={userForm.password}
                        onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter password"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Confirm Password *</label>
                      <input
                        type="password"
                        value={userForm.confirm_password}
                        onChange={(e) => setUserForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                        placeholder="Confirm password"
                        required
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => setShowUserModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                className="submit-button"
                onClick={handleSubmitUser}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="button-spinner"></div>
                    {selectedUser ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    {selectedUser ? 'Update User' : 'Create User'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;