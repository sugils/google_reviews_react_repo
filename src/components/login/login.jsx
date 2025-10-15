import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, LogIn, ArrowRight, Shield } from 'lucide-react';
import './login.css';
import { login, checkAdminRole } from '../../services/api';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    user_email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.user_email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await login(formData);
      
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        const isAdmin = checkAdminRole();
        
        console.log('Login successful. User:', response.data.user);
        console.log('Is Admin:', isAdmin);
        
        toast.success('Login successful!');
        
        if (isAdmin) {
          console.log('Redirecting to admin dashboard');
          navigate('/admin/dashboard', { replace: true });
        } else {
          console.log('Redirecting to user dashboard');
          navigate('/dashboard', { replace: true });
        }
      } else {
        toast.error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* Animated Background */}
      <div className="login-background">
        <div className="login-gradient-orb login-orb-1"></div>
        <div className="login-gradient-orb login-orb-2"></div>
        <div className="login-gradient-orb login-orb-3"></div>
        <div className="login-mesh-gradient"></div>
      </div>

      {/* Login Card */}
      <div className="login-card-wrapper">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="login-icon-wrapper">
              <Shield className="login-icon" size={40} />
            </div>
            <h1 className="login-title">
              Welcome to <span className="login-gradient-text">VDart</span>
            </h1>
            <p className="login-subtitle">Sign in to access your review dashboard</p>
          </div>

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-form-group">
              <label htmlFor="user_email" className="login-form-label">
                <Mail size={18} />
                <span>Email Address</span>
              </label>
              <div className="login-input-wrapper">
                <input
                  type="email"
                  id="user_email"
                  name="user_email"
                  className="login-form-input"
                  placeholder="Enter your email"
                  value={formData.user_email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="login-form-group">
              <label htmlFor="password" className="login-form-label">
                <Lock size={18} />
                <span>Password</span>
              </label>
              <div className="login-input-wrapper login-password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className="login-form-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="login-btn-loading">
                  <div className="login-loading-spinner"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Sign In</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <p className="login-footer-text">
              Don't have an account?{' '}
              <Link to="/register" className="login-link">
                Sign up here
              </Link>
            </p>
          </div>
        </div>

        {/* Info Panel */}
        <div className="login-info-panel">
          <h2 className="login-info-title">Review Tracker</h2>
          <p className="login-info-description">
            Streamline your candidate review process with powerful analytics and real-time tracking.
          </p>
          <ul className="login-info-features">
            <li>
              <div className="login-feature-icon">✓</div>
              <span>Real-time review tracking</span>
            </li>
            <li>
              <div className="login-feature-icon">✓</div>
              <span>Comprehensive analytics</span>
            </li>
            <li>
              <div className="login-feature-icon">✓</div>
              <span>Team collaboration tools</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;