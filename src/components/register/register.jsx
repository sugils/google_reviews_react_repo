import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Eye, EyeOff, Mail, Lock, User, Building, Users, 
  MapPin, Briefcase, UserPlus, Phone, Shield, ArrowRight 
} from 'lucide-react';
import './register.css';
import { register, getDropdownData, getFilteredTeams } from '../../services/api';
import { toast } from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    employee_id: '',
    bu_id: '',
    bf_id: '',
    team_id: '',
    geo_id: '',
    lead_recruiter: '',
    phone_number: '',
    password: '',
    confirm_password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownData, setDropdownData] = useState({
    geo_locations: [],
    business_units: [],
    business_functions: [],
    teams: []
  });
  const [availableTeams, setAvailableTeams] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (formData.bu_id || formData.bf_id) {
      fetchFilteredTeams();
    } else {
      setAvailableTeams(dropdownData.teams || []);
    }
  }, [formData.bu_id, formData.bf_id, dropdownData.teams]);

  const fetchDropdownData = async () => {
    setLoadingDropdowns(true);
    try {
      const response = await getDropdownData();
      if (response.success) {
        setDropdownData(response.data);
      } else {
        toast.error('Failed to load form options');
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toast.error('Failed to load form options');
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const fetchFilteredTeams = async () => {
    try {
      const response = await getFilteredTeams(formData.bu_id, formData.bf_id);
      if (response.success) {
        setAvailableTeams(response.data);
        if (formData.team_id && !response.data.find(team => team.team_id === parseInt(formData.team_id))) {
          setFormData(prev => ({ ...prev, team_id: '' }));
        }
      }
    } catch (error) {
      console.error('Error fetching filtered teams:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const requiredFields = [
      'user_name', 'user_email', 'employee_id', 'bu_id', 'bf_id', 
      'team_id', 'geo_id', 'password', 'confirm_password'
    ];
    
    const emptyFields = requiredFields.filter(field => !formData[field]);
    
    if (emptyFields.length > 0) {
      toast.error('Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.user_email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (formData.phone_number) {
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(formData.phone_number)) {
        toast.error('Please enter a valid phone number');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const submitData = {
        ...formData,
        bu_id: parseInt(formData.bu_id),
        bf_id: parseInt(formData.bf_id),
        team_id: parseInt(formData.team_id),
        geo_id: parseInt(formData.geo_id),
        role: 'recruiter'
      };
      
      const response = await register(submitData);
      
      if (response.success) {
        toast.success('Registration successful! Please login with your credentials.');
        navigate('/login');
      } else {
        toast.error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingDropdowns) {
    return (
      <div className="register-page-container">
        <div className="register-background">
          <div className="register-gradient-orb register-orb-1"></div>
          <div className="register-gradient-orb register-orb-2"></div>
          <div className="register-gradient-orb register-orb-3"></div>
          <div className="register-mesh-gradient"></div>
        </div>
        <div className="register-loading-container">
          <div className="register-loading-spinner-large"></div>
          <p className="register-loading-text">Loading form options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page-container">
      {/* Animated Background */}
      <div className="register-background">
        <div className="register-gradient-orb register-orb-1"></div>
        <div className="register-gradient-orb register-orb-2"></div>
        <div className="register-gradient-orb register-orb-3"></div>
        <div className="register-mesh-gradient"></div>
      </div>

      {/* Register Card */}
      <div className="register-card-wrapper">
        <div className="register-card">
          {/* Header */}
          <div className="register-header">
            <div className="register-icon-wrapper">
              <UserPlus className="register-icon" size={40} />
            </div>
            <h1 className="register-title">
              Join <span className="register-gradient-text">VDart</span>
            </h1>
            <p className="register-subtitle">Create your account to get started</p>
          </div>

          {/* Form */}
          <form className="register-form" onSubmit={handleSubmit}>
            {/* Personal Information */}
            <div className="register-form-section">
              <h3 className="register-section-title">
                <User size={20} />
                Personal Information
              </h3>
              
              <div className="register-form-row">
                <div className="register-form-group">
                  <label htmlFor="user_name" className="register-form-label">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="user_name"
                    name="user_name"
                    className="register-form-input"
                    placeholder="Enter your full name"
                    value={formData.user_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="register-form-group">
                  <label htmlFor="user_email" className="register-form-label">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="user_email"
                    name="user_email"
                    className="register-form-input"
                    placeholder="Enter your email"
                    value={formData.user_email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="register-form-row">
                <div className="register-form-group">
                  <label htmlFor="employee_id" className="register-form-label">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    id="employee_id"
                    name="employee_id"
                    className="register-form-input"
                    placeholder="Enter employee ID"
                    value={formData.employee_id}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="register-form-group">
                  <label htmlFor="phone_number" className="register-form-label">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    className="register-form-input"
                    placeholder="Enter phone number"
                    value={formData.phone_number}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div className="register-form-section">
              <h3 className="register-section-title">
                <Building size={20} />
                Work Information
              </h3>
              
              <div className="register-form-row">
                <div className="register-form-group">
                  <label htmlFor="geo_id" className="register-form-label">
                    Geographic Location *
                  </label>
                  <select
                    id="geo_id"
                    name="geo_id"
                    className="register-form-input register-form-select"
                    value={formData.geo_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Location</option>
                    {dropdownData.geo_locations.map(location => (
                      <option key={location.geo_id} value={location.geo_id}>
                        {location.geo_name} ({location.geo_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="register-form-group">
                  <label htmlFor="bu_id" className="register-form-label">
                    Business Unit *
                  </label>
                  <select
                    id="bu_id"
                    name="bu_id"
                    className="register-form-input register-form-select"
                    value={formData.bu_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Business Unit</option>
                    {dropdownData.business_units.map(unit => (
                      <option key={unit.bu_id} value={unit.bu_id}>
                        {unit.bu_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="register-form-row">
                <div className="register-form-group">
                  <label htmlFor="bf_id" className="register-form-label">
                    Business Function *
                  </label>
                  <select
                    id="bf_id"
                    name="bf_id"
                    className="register-form-input register-form-select"
                    value={formData.bf_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Function</option>
                    {dropdownData.business_functions.map(func => (
                      <option key={func.bf_id} value={func.bf_id}>
                        {func.bf_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="register-form-group">
                  <label htmlFor="team_id" className="register-form-label">
                    Team *
                  </label>
                  <select
                    id="team_id"
                    name="team_id"
                    className="register-form-input register-form-select"
                    value={formData.team_id}
                    onChange={handleChange}
                    required
                    disabled={!formData.bu_id && !formData.bf_id}
                  >
                    <option value="">
                      {formData.bu_id || formData.bf_id ? 'Select Team' : 'Select Business Unit/Function first'}
                    </option>
                    {availableTeams.map(team => (
                      <option key={team.team_id} value={team.team_id}>
                        {team.team_name}
                        {team.bu_name && team.bf_name && ` (${team.bu_name} - ${team.bf_name})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="register-form-group register-full-width">
                <label htmlFor="lead_recruiter" className="register-form-label">
                  Lead Recruiter
                </label>
                <input
                  type="text"
                  id="lead_recruiter"
                  name="lead_recruiter"
                  className="register-form-input"
                  placeholder="Enter lead recruiter name (optional)"
                  value={formData.lead_recruiter}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Security Information */}
            <div className="register-form-section">
              <h3 className="register-section-title">
                <Shield size={20} />
                Security
              </h3>
              
              <div className="register-form-row">
                <div className="register-form-group">
                  <label htmlFor="password" className="register-form-label">
                    Password *
                  </label>
                  <div className="register-input-wrapper register-password-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      className="register-form-input"
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="register-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="register-form-group">
                  <label htmlFor="confirm_password" className="register-form-label">
                    Confirm Password *
                  </label>
                  <div className="register-input-wrapper register-password-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirm_password"
                      name="confirm_password"
                      className="register-form-input"
                      placeholder="Confirm password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="register-password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex="-1"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="register-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="register-btn-loading">
                  <div className="register-loading-spinner"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                <>
                  <UserPlus size={20} />
                  <span>Create Account</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="register-footer">
            <p className="register-footer-text">
              Already have an account?{' '}
              <Link to="/login" className="register-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;