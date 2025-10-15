import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { adminLogout, getCurrentAdminUser } from '../../../services/api';
import toast from 'react-hot-toast';
import './AdminLayout.css';
import logo from '../../../assests/logo.png';

const AdminLayout = ({ children }) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = getCurrentAdminUser();

  const handleLogout = () => {
    adminLogout();
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const menuItems = [
    {
      path: '/admin/dashboard',
      icon: 'fas fa-home',
      label: 'Dashboard'
    },
    {
      path: '/admin/users',
      icon: 'fas fa-users',
      label: 'User Management'
    },
    {
      path: '/admin/tickets',
      icon: 'fas fa-chart-line',
      label: 'Track Tickets'
    },
    {
      path: '/admin/reviews',
      icon: 'fas fa-history',
      label: 'Review History'
    },
    {
    path: '/admin/incentives',
    icon: 'fas fa-coins',
    label: 'Incentives'
  },
    {
      path: '/admin/exports',
      icon: 'fas fa-user-circle',
      label: 'Export Data'
    }
  ];

  const isActiveRoute = (path) => {
    return location.pathname === path || (path !== '/admin/dashboard' && location.pathname.startsWith(path));
  };

  return (
    <div className="admin-layout">
      {/* Modern Navigation Bar */}
      <header className="admin-navbar">
        {/* Logo Section */}
        <div className="navbar-brand">
          <img src={logo} alt="VDart" className="brand-logo" />
          <span className="brand-title">Admin Portal</span>
        </div>

        {/* Center Navigation */}
        <nav className="navbar-menu">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActiveRoute(item.path) ? 'active' : ''}`}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="navbar-actions">
          {/* Notifications */}
          {/* <button className="notification-btn" title="Notifications">
            <i className="fas fa-bell"></i>
            <span className="notification-badge">3</span>
          </button> */}

          {/* Profile Section */}
          <div className="profile-section">
            <button
              className="profile-btn"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            >
              <i className="fas fa-user"></i>
              <span className="profile-label">{currentUser.user_name}</span>
              <div className="profile-avatar">
                {currentUser.user_name ? currentUser.user_name.charAt(0).toUpperCase() : 'A'}
              </div>
              <i className={`fas fa-chevron-down arrow ${profileDropdownOpen ? 'open' : ''}`}></i>
            </button>

            {profileDropdownOpen && (
              <>
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <div className="user-avatar-large">
                      {currentUser.user_name ? currentUser.user_name.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div className="user-info">
                      <p className="user-name">{currentUser.user_name || 'Admin User'}</p>
                      <p className="user-email">{currentUser.user_email || 'admin@vdartinc.com'}</p>
                      <p className="user-role">Administrator</p>
                    </div>
                  </div>
                  
                  <div className="dropdown-divider"></div>
                  
                  <div className="dropdown-menu">
                    <Link to="/admin/profile" className="dropdown-item">
                      <i className="fas fa-user"></i>
                      <span>My Profile</span>
                    </Link>
                    <button className="dropdown-item">
                      <i className="fas fa-cog"></i>
                      <span>Settings</span>
                    </button>
                    <Link to="/" className="dropdown-item">
                      <i className="fas fa-external-link-alt"></i>
                      <span>Main Application</span>
                    </Link>
                    <button className="dropdown-item">
                      <i className="fas fa-question-circle"></i>
                      <span>Help & Support</span>
                    </button>
                  </div>
                  
                  <div className="dropdown-divider"></div>
                  
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                  </button>
                </div>
                <div 
                  className="dropdown-overlay"
                  onClick={() => setProfileDropdownOpen(false)}
                />
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;