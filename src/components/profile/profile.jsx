import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Briefcase, Building, Users, MapPin, 
  Edit, Save, X, Lock, Phone, Calendar, Clock, Award,
  CheckCircle, AlertCircle, FileSignature, Plus, Trash2,
  Eye, Settings, Star
} from 'lucide-react';
import './profile.css';
import { 
  getUserProfile, 
  updateUserProfile, 
  getDropdownDataProtected as getDropdownData, 
  getFilteredTeamsProtected as getFilteredTeams,
  getUserSignatures,
  createSignature,
  updateSignature,
  deleteSignature,
  setDefaultSignature,
  previewSignature
} from '../../services/api';
import { toast } from 'react-hot-toast';

const Profile = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Signature states
  const [signatures, setSignatures] = useState([]);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [editingSignature, setEditingSignature] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const coverImage = "src/assests/vdart banner.jpeg"
  
  const [dropdownData, setDropdownData] = useState({
    geo_locations: [],
    business_units: [],
    business_functions: [],
    teams: []
  });
  const [availableTeams, setAvailableTeams] = useState([]);
  
  const [formData, setFormData] = useState({
    user_name: '',
    bu_id: '',
    bf_id: '',
    team_id: '',
    geo_id: '',
    lead_recruiter: '',
    phone_number: ''
  });

  // Signature form data
  const [signatureFormData, setSignatureFormData] = useState({
    signature_name: '',
    signature_html: '',
    is_default: false
  });

  useEffect(() => {
    fetchUserProfile();
    fetchDropdownData();
    fetchUserSignatures();
  }, []);

  useEffect(() => {
    if (isEditing && (formData.bu_id || formData.bf_id)) {
      fetchFilteredTeams();
    }
  }, [formData.bu_id, formData.bf_id, isEditing]);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const response = await getUserProfile();
      if (response.success) {
        setUserProfile(response.data);
        setFormData({
          user_name: response.data.user_name || '',
          bu_id: response.data.bu_id || '',
          bf_id: response.data.bf_id || '',
          team_id: response.data.team_id || '',
          geo_id: response.data.geo_id || '',
          lead_recruiter: response.data.lead_recruiter || '',
          phone_number: response.data.phone_number || ''
        });
      } else {
        toast.error('Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const response = await getDropdownData();
      if (response.success) {
        setDropdownData(response.data);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const fetchFilteredTeams = async () => {
    try {
      const response = await getFilteredTeams(formData.bu_id, formData.bf_id);
      if (response.success) {
        setAvailableTeams(response.data);
      }
    } catch (error) {
      console.error('Error fetching filtered teams:', error);
    }
  };

  const fetchUserSignatures = async () => {
    try {
      const response = await getUserSignatures();
      if (response.success) {
        setSignatures(response.data);
      }
    } catch (error) {
      console.error('Error fetching signatures:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignatureInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSignatureFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    const requiredFields = ['user_name', 'bu_id', 'bf_id', 'team_id', 'geo_id'];
    const emptyFields = requiredFields.filter(field => !formData[field]);
    
    if (emptyFields.length > 0) {
      toast.error('Please fill in all required fields');
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

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    
    try {
      const updateData = {
        ...formData,
        bu_id: parseInt(formData.bu_id),
        bf_id: parseInt(formData.bf_id),
        team_id: parseInt(formData.team_id),
        geo_id: parseInt(formData.geo_id)
      };

      const response = await updateUserProfile(updateData);
      
      if (response.success) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        fetchUserProfile();
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      user_name: userProfile?.user_name || '',
      bu_id: userProfile?.bu_id || '',
      bf_id: userProfile?.bf_id || '',
      team_id: userProfile?.team_id || '',
      geo_id: userProfile?.geo_id || '',
      lead_recruiter: userProfile?.lead_recruiter || '',
      phone_number: userProfile?.phone_number || ''
    });
    setIsEditing(false);
    setAvailableTeams([]);
  };

  // Signature Management Functions
  const openSignatureModal = (signature = null) => {
    setEditingSignature(signature);
    setSignatureFormData({
      signature_name: signature?.signature_name || '',
      signature_html: signature?.signature_html || '',
      is_default: signature?.is_default || false
    });
    setSignaturePreview(signature?.signature_html || '');
    setIsSignatureModalOpen(true);
    setIsPreviewMode(false);
  };

  const closeSignatureModal = () => {
    setIsSignatureModalOpen(false);
    setEditingSignature(null);
    setSignatureFormData({
      signature_name: '',
      signature_html: '',
      is_default: false
    });
    setSignaturePreview('');
    setIsPreviewMode(false);
  };

  const handlePreviewSignature = async () => {
    if (!signatureFormData.signature_html.trim()) {
      toast.error('Please enter signature HTML to preview');
      return;
    }

    try {
      const response = await previewSignature(signatureFormData.signature_html);
      if (response.success) {
        setSignaturePreview(response.data.cleaned_html);
        setIsPreviewMode(true);
      } else {
        toast.error('Failed to preview signature');
      }
    } catch (error) {
      console.error('Error previewing signature:', error);
      toast.error('Failed to preview signature');
    }
  };

  const handleSaveSignature = async () => {
    if (!signatureFormData.signature_name.trim()) {
      toast.error('Please enter a signature name');
      return;
    }

    if (!signatureFormData.signature_html.trim()) {
      toast.error('Please enter signature HTML');
      return;
    }

    try {
      const response = editingSignature 
        ? await updateSignature(editingSignature.signature_id, signatureFormData)
        : await createSignature(signatureFormData);

      if (response.success) {
        toast.success(`Signature ${editingSignature ? 'updated' : 'created'} successfully!`);
        closeSignatureModal();
        fetchUserSignatures();
      } else {
        toast.error(response.message || 'Failed to save signature');
      }
    } catch (error) {
      console.error('Error saving signature:', error);
      toast.error('Failed to save signature');
    }
  };

  const handleDeleteSignature = async (signatureId) => {
    if (!window.confirm('Are you sure you want to delete this signature?')) {
      return;
    }

    try {
      const response = await deleteSignature(signatureId);
      if (response.success) {
        toast.success('Signature deleted successfully!');
        fetchUserSignatures();
      } else {
        toast.error('Failed to delete signature');
      }
    } catch (error) {
      console.error('Error deleting signature:', error);
      toast.error('Failed to delete signature');
    }
  };

  const handleSetDefaultSignature = async (signatureId) => {
    try {
      const response = await setDefaultSignature(signatureId);
      if (response.success) {
        toast.success('Default signature updated!');
        fetchUserSignatures();
      } else {
        toast.error('Failed to set default signature');
      }
    } catch (error) {
      console.error('Error setting default signature:', error);
      toast.error('Failed to set default signature');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDisplayValue = (value, fallback = 'Not specified') => {
    return value || fallback;
  };

  if (isLoading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Profile Header Card */}
      <div className="profile-header-card">
        <div className="profile-cover">
          <img 
            src={coverImage} 
            alt="VDart Company Banner" 
            className="cover-image"
            onError={(e) => {
              // Fallback if image doesn't load
              e.target.style.display = 'none';
            }}
          />
          <div className="cover-gradient"></div>
        </div>
        
        <div className="profile-header-content">
          <div className="profile-avatar-large">
            <User size={60} />
          </div>
          
          <div className="profile-info">
            <h1>{userProfile?.user_name}</h1>
            <p className="profile-title">{userProfile?.role === 'admin' ? 'Administrator' : 'Recruiter'}</p>
            <p className="profile-location">
              <MapPin size={14} />
              {userProfile?.geo_name || 'Location not specified'}
            </p>
          </div>
          
          <div className="profile-actions">
            {!isEditing ? (
              <button className="edit-btn" onClick={() => setIsEditing(true)}>
                <Edit size={18} />
                Edit Profile
              </button>
            ) : (
              <div className="action-buttons">
                <button className="save-btn" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <div className="spinner"></div> : <Save size={18} />}
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button className="cancel-btn" onClick={handleCancel}>
                  <X size={18} />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="profile-stats">
          <div className="stat">
            <span className="stat-value">{userProfile?.employee_id}</span>
            <span className="stat-label">Employee ID</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              <CheckCircle size={16} className="status-icon active" />
              {userProfile?.is_active ? 'Active' : 'Inactive'}
            </span>
            <span className="stat-label">Status</span>
          </div>
          <div className="stat">
            <span className="stat-value">{userProfile?.created_at ? formatDate(userProfile.created_at) : 'N/A'}</span>
            <span className="stat-label">Member Since</span>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="profile-content-grid">
        {/* Personal Information Card - Now includes account info */}
        <div className="info-card">
          <div className="card-header">
            <h3>
              <User size={20} />
              Personal Information
            </h3>
          </div>
          
          <div className="card-content">
            <div className="info-row">
              <label>Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="user_name"
                  value={formData.user_name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your full name"
                />
              ) : (
                <span>{getDisplayValue(userProfile?.user_name)}</span>
              )}
            </div>
            
            <div className="info-row">
              <label>Email Address</label>
              <span className="readonly">{userProfile?.user_email}</span>
            </div>
            
            <div className="info-row">
              <label>Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter phone number"
                />
              ) : (
                <span>{getDisplayValue(userProfile?.phone_number)}</span>
              )}
            </div>
            
            <div className="info-row">
              <label>Employee ID</label>
              <span className="readonly">{userProfile?.employee_id}</span>
            </div>

            <div className="info-row">
              <label>Role</label>
              <span className="role-tag">
                <Award size={14} />
                {userProfile?.role === 'admin' ? 'Administrator' : 'Recruiter'}
              </span>
            </div>
            
            <div className="info-row">
              <label>Password</label>
              <div className="password-field">
                <span>••••••••••••</span>
                <button className="change-password" disabled>
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Work Information Card */}
        <div className="info-card">
          <div className="card-header">
            <h3>
              <Briefcase size={20} />
              Work Information
            </h3>
          </div>
          
          <div className="card-content">
            <div className="info-row">
              <label>Business Unit</label>
              {isEditing ? (
                <select
                  name="bu_id"
                  value={formData.bu_id}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Select Business Unit</option>
                  {dropdownData.business_units.map(unit => (
                    <option key={unit.bu_id} value={unit.bu_id}>
                      {unit.bu_name}
                    </option>
                  ))}
                </select>
              ) : (
                <span>{getDisplayValue(userProfile?.bu_name)}</span>
              )}
            </div>
            
            <div className="info-row">
              <label>Business Function</label>
              {isEditing ? (
                <select
                  name="bf_id"
                  value={formData.bf_id}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Select Function</option>
                  {dropdownData.business_functions.map(func => (
                    <option key={func.bf_id} value={func.bf_id}>
                      {func.bf_name}
                    </option>
                  ))}
                </select>
              ) : (
                <span>{getDisplayValue(userProfile?.bf_name)}</span>
              )}
            </div>
            
            <div className="info-row">
              <label>Team</label>
              {isEditing ? (
                <select
                  name="team_id"
                  value={formData.team_id}
                  onChange={handleInputChange}
                  className="form-select"
                  disabled={!formData.bu_id && !formData.bf_id}
                >
                  <option value="">
                    {formData.bu_id || formData.bf_id ? 'Select Team' : 'Select Business Unit/Function first'}
                  </option>
                  {availableTeams.map(team => (
                    <option key={team.team_id} value={team.team_id}>
                      {team.team_name}
                    </option>
                  ))}
                </select>
              ) : (
                <span>{getDisplayValue(userProfile?.team_name)}</span>
              )}
            </div>
            
            <div className="info-row">
              <label>Location</label>
              {isEditing ? (
                <select
                  name="geo_id"
                  value={formData.geo_id}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Select Location</option>
                  {dropdownData.geo_locations.map(location => (
                    <option key={location.geo_id} value={location.geo_id}>
                      {location.geo_name} ({location.geo_code})
                    </option>
                  ))}
                </select>
              ) : (
                <span>
                  {getDisplayValue(userProfile?.geo_name)} 
                  {userProfile?.geo_code && ` (${userProfile.geo_code})`}
                </span>
              )}
            </div>
            
            <div className="info-row">
              <label>Lead Recruiter</label>
              {isEditing ? (
                <input
                  type="text"
                  name="lead_recruiter"
                  value={formData.lead_recruiter}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter lead recruiter name"
                />
              ) : (
                <span>{getDisplayValue(userProfile?.lead_recruiter)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Email Signatures Card */}
        <div className="info-card">
          <div className="card-header">
            <h3>
              <FileSignature size={20} />
              Email Signatures
            </h3>
            <button 
              className="add-signature-btn"
              onClick={() => openSignatureModal()}
            >
              <Plus size={16} />
              Add Signature
            </button>
          </div>
          
          <div className="card-content">
            {signatures.length === 0 ? (
              <div className="no-signatures">
                <FileSignature size={48} className="no-signatures-icon" />
                <p>No signatures created yet</p>
                <button 
                  className="create-first-signature"
                  onClick={() => openSignatureModal()}
                >
                  Create Your First Signature
                </button>
              </div>
            ) : (
              <div className="signatures-list">
                {signatures.map(signature => (
                  <div key={signature.signature_id} className="signature-item">
                    <div className="signature-header">
                      <div className="signature-info">
                        <h4>{signature.signature_name}</h4>
                        {signature.is_default && (
                          <span className="default-badge">
                            <Star size={12} />
                            Default
                          </span>
                        )}
                      </div>
                      <div className="signature-actions">
                        <button 
                          className="action-btn preview-btn"
                          onClick={() => {
                            setSignaturePreview(signature.signature_html);
                            setIsPreviewMode(true);
                          }}
                          title="Preview"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="action-btn edit-btn"
                          onClick={() => openSignatureModal(signature)}
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        {!signature.is_default && (
                          <button 
                            className="action-btn default-btn"
                            onClick={() => handleSetDefaultSignature(signature.signature_id)}
                            title="Set as Default"
                          >
                            <Star size={14} />
                          </button>
                        )}
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteSignature(signature.signature_id)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="signature-preview-mini">
                      <div 
                        dangerouslySetInnerHTML={{ __html: signature.signature_html }} 
                        style={{ fontSize: '12px', maxHeight: '60px', overflow: 'hidden' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity Timeline Card - Now spans full width */}
        {/* <div className="info-card full-width"> */}
          {/* <div className="card-header">
            <h3>
              <Clock size={20} />
              Account Activity
            </h3>
          </div> */}
          
          {/* <div className="card-content">
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-icon">
                  <Calendar size={16} />
                </div>
                <div className="timeline-content">
                  <h4>Account Created</h4>
                  <p>{userProfile?.created_at ? formatDate(userProfile.created_at) : 'Not available'}</p>
                </div>
              </div>
              
              <div className="timeline-item">
                <div className="timeline-icon">
                  <Edit size={16} />
                </div>
                <div className="timeline-content">
                  <h4>Last Profile Update</h4>
                  <p>{userProfile?.updated_at ? formatDate(userProfile.updated_at) : 'Not available'}</p>
                </div>
              </div>
              
              <div className="timeline-item">
                <div className="timeline-icon">
                  <User size={16} />
                </div>
                <div className="timeline-content">
                  <h4>Last Login</h4>
                  <p>{userProfile?.last_login_at ? formatDate(userProfile.last_login_at) : 'Not available'}</p>
                </div>
              </div>
            </div>
          </div> */}
        {/* </div> */}
      </div>

      {/* Signature Modal */}
      {isSignatureModalOpen && (
        <div className="modal-overlay" onClick={closeSignatureModal}>
          <div className="signature-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <FileSignature size={20} />
                {editingSignature ? 'Edit Signature' : 'Create New Signature'}
              </h3>
              <button className="modal-close" onClick={closeSignatureModal}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="signature-form">
                <div className="form-group">
                  <label>Signature Name *</label>
                  <input
                    type="text"
                    name="signature_name"
                    value={signatureFormData.signature_name}
                    onChange={handleSignatureInputChange}
                    placeholder="e.g., Professional, Casual, Marketing"
                    className="form-input"
                    maxLength={100}
                  />
                </div>
                
                <div className="form-group">
                  <div className="form-group-header">
                    <label>Signature HTML *</label>
                    <button 
                      type="button"
                      className="preview-btn-small"
                      onClick={handlePreviewSignature}
                    >
                      <Eye size={14} />
                      Preview
                    </button>
                  </div>
                  <textarea
                    name="signature_html"
                    value={signatureFormData.signature_html}
                    onChange={handleSignatureInputChange}
                    placeholder="Paste your HTML signature here..."
                    className="signature-textarea"
                    rows={8}
                  />
                  <small>Paste your HTML signature code here. You can include images, tables, and formatting.</small>
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_default"
                      checked={signatureFormData.is_default}
                      onChange={handleSignatureInputChange}
                    />
                    Set as default signature
                  </label>
                </div>
                
                {isPreviewMode && signaturePreview && (
                  <div className="signature-preview">
                    <h4>Preview:</h4>
                    <div className="preview-container">
                      <div 
                        dangerouslySetInnerHTML={{ __html: signaturePreview }}
                        className="signature-preview-content"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="cancel-btn" onClick={closeSignatureModal}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleSaveSignature}>
                <Save size={16} />
                {editingSignature ? 'Update Signature' : 'Create Signature'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewMode && !isSignatureModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPreviewMode(false)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Eye size={20} />
                Signature Preview
              </h3>
              <button className="modal-close" onClick={() => setIsPreviewMode(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="signature-preview-large">
                <div 
                  dangerouslySetInnerHTML={{ __html: signaturePreview }}
                  className="signature-preview-content"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setIsPreviewMode(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;