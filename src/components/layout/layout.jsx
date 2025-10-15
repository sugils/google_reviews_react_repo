import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Mail, TrendingUp, Clock, User, LogOut, 
  Menu, X, Bell, Search, Settings, ChevronDown, DollarSign
} from 'lucide-react';
import './layout.css';
import { logout, getCurrentUser } from '../../services/api';
import { toast } from 'react-hot-toast';
import logo from '../../assests/logo.png';

const Layout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();

  // Track window width for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menus when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
      if (!event.target.closest('.mobile-menu-container') && 
          !event.target.closest('.mobile-menu-btn')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    {
      path: '/dashboard',
      icon: <Home size={windowWidth < 480 ? 16 : 18} />,
      label: 'Dashboard',
      description: 'View your overview'
    },
    {
      path: '/raise-review',
      icon: <Mail size={windowWidth < 480 ? 16 : 18} />,
      label: 'Raise Review',
      description: 'Submit new review request'
    },
    {
      path: '/track-tickets',
      icon: <TrendingUp size={windowWidth < 480 ? 16 : 18} />,
      label: 'Track Tickets',
      description: 'Monitor your tickets'
    },
    {
      path: '/review-history',
      icon: <Clock size={windowWidth < 480 ? 16 : 18} />,
      label: 'Review History',
      description: 'View past reviews'
    },
    {
      path: '/profile',
      icon: <User size={windowWidth < 480 ? 16 : 18} />,
      label: 'Profile',
      description: 'Manage your profile'
    }
  ];

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const handleNavClick = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Prevent body scroll when menu is open
    document.body.style.overflow = !isMobileMenuOpen ? 'hidden' : 'auto';
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.label : 'Dashboard';
  };

  const getLocationName = () => {
    if (user?.geo_location) {
      if (typeof user.geo_location === 'object' && user.geo_location.geo_name) {
        return user.geo_location.geo_name;
      }
      if (typeof user.geo_location === 'string') {
        return user.geo_location;
      }
    }
    return 'Location';
  };

  // Clean up body scroll on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="vd-layout-container">
      {/* Top Navigation Bar */}
      <header className="vd-topbar">
        <div className="vd-topbar-content">
          {/* Logo Section */}
         
            <img src={logo} alt="VDart" className="vd-brand-logo" />
         

          {/* Desktop Navigation */}
          <nav className="vd-desktop-nav">
            <ul className="vd-nav-list">
              {menuItems.map((item) => (
                <li key={item.path} className="vd-nav-item">
                  <button
                    className={`vd-nav-link ${isActiveRoute(item.path) ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.path)}
                    aria-current={isActiveRoute(item.path) ? 'page' : undefined}
                    title={item.description}
                  >
                    <span className="vd-nav-icon">{item.icon}</span>
                    <span className="vd-nav-label">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right Section */}
          <div className="vd-topbar-right">
            {/* Notifications - Hide on very small screens */}
            <button 
              className="vd-topbar-action-btn vd-notification-btn" 
              aria-label="Notifications"
            >
              <Bell size={windowWidth < 480 ? 16 : 18} />
              <span className="vd-notification-badge">3</span>
            </button>

            {/* User Menu */}
            <div className="vd-user-menu-container">
              <button 
                className="vd-user-menu-trigger"
                onClick={toggleUserMenu}
                aria-expanded={isUserMenuOpen}
                title="User Menu"
              >
                <div className="vd-user-avatar">
                  <User size={windowWidth < 480 ? 14 : 16} />
                </div>
                <span className="vd-user-name-display">
                  {user?.user_name?.split(' ')[0] || 'User'}
                </span>
                <ChevronDown 
                  size={windowWidth < 480 ? 14 : 16} 
                  className={`vd-chevron ${isUserMenuOpen ? 'rotated' : ''}`} 
                />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="vd-user-dropdown">
                  <div className="vd-user-dropdown-header">
                    <div className="vd-dropdown-user-avatar">
                      <User size={20} />
                    </div>
                    <div className="vd-dropdown-user-info">
                      <span className="vd-dropdown-user-name">
                        {user?.user_name || 'Guest'}
                      </span>
                      <span className="vd-dropdown-user-email">
                        {user?.user_email || 'guest@example.com'}
                      </span>
                      <span className="vd-dropdown-user-role">
                        {user?.user_role === 'admin' ? 'Admin' : 'User'} • {getLocationName()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="vd-user-dropdown-divider"></div>
                  
                  <button 
                    className="vd-user-dropdown-item"
                    onClick={() => {
                      handleNavClick('/profile');
                      setIsUserMenuOpen(false);
                    }}
                  >
                    <User size={16} />
                    <span>Profile Settings</span>
                  </button>
                  
                  <button 
                    className="vd-user-dropdown-item"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                    }}
                  >
                    <Settings size={16} />
                    <span>Preferences</span>
                  </button>
                  
                  <div className="vd-user-dropdown-divider"></div>
                  
                  <button 
                    className="vd-user-dropdown-item vd-logout-item"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="vd-mobile-menu-btn mobile-menu-container"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? 
                <X size={windowWidth < 480 ? 18 : 20} /> : 
                <Menu size={windowWidth < 480 ? 18 : 20} />
              }
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu - Slide from right */}
      <div className={`vd-mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="vd-mobile-nav-header">
          <h3>Menu</h3>
          <button 
            className="vd-mobile-close-btn"
            onClick={toggleMobileMenu}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="vd-mobile-user-info">
          <div className="vd-mobile-user-avatar">
            <User size={24} />
          </div>
          <div className="vd-mobile-user-details">
            <span className="vd-mobile-user-name">{user?.user_name || 'Guest'}</span>
            <span className="vd-mobile-user-email">{user?.user_email || 'guest@example.com'}</span>
          </div>
        </div>

        <nav className="vd-mobile-navigation">
          <ul className="vd-mobile-nav-list">
            {menuItems.map((item) => (
              <li key={item.path} className="vd-mobile-nav-item">
                <button
                  className={`vd-mobile-nav-link ${isActiveRoute(item.path) ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.path)}
                  aria-current={isActiveRoute(item.path) ? 'page' : undefined}
                >
                  <span className="vd-mobile-nav-icon">{item.icon}</span>
                  <div className="vd-mobile-nav-text">
                    <span className="vd-mobile-nav-label">{item.label}</span>
                    <span className="vd-mobile-nav-desc">{item.description}</span>
                  </div>
                  {isActiveRoute(item.path) && (
                    <span className="vd-mobile-nav-indicator"></span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="vd-mobile-nav-footer">
          <button className="vd-mobile-settings-btn" onClick={() => {}}>
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <button className="vd-mobile-logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="vd-mobile-overlay"
          onClick={() => {
            setIsMobileMenuOpen(false);
            document.body.style.overflow = 'auto';
          }}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <main className="vd-main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;