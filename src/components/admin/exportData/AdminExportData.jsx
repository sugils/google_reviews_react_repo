import React, { useState, useEffect } from 'react';
import { 
  exportAllRecruitersDataAdmin,
  exportSingleRecruiterDataAdmin,
  exportReviewsDataAdmin,
  exportTicketsDataAdmin,
  getAllUsersAdmin,
  handleAdminApiError 
} from '../../../services/api';
import toast from 'react-hot-toast';
import './AdminExportData.css';

const AdminExportData = () => {
  const [selectedTab, setSelectedTab] = useState('all-recruiters');
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportHistory, setExportHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // All Recruiters Export State
  const [allRecruitersParams, setAllRecruitersParams] = useState({
    filter_period: '30',
    format: 'csv',
    include_inactive: false
  });

  // Single Recruiter Export State
  const [singleRecruiterParams, setSingleRecruiterParams] = useState({
    recruiter_id: '',
    filter_period: '30',
    format: 'csv'
  });

  // Reviews Export State
  const [reviewsParams, setReviewsParams] = useState({
    filter_period: '30',
    format: 'csv',
    stars_filter: '',
    recruiter_id: ''
  });

  // Tickets Export State
  const [ticketsParams, setTicketsParams] = useState({
    filter_period: '30',
    format: 'csv',
    status_filter: '',
    recruiter_id: ''
  });

  useEffect(() => {
    loadRecruiters();
  }, []);

  const loadRecruiters = async () => {
    try {
      const response = await getAllUsersAdmin({ role: 'recruiter', limit: 1000 });
      if (response.success) {
        setRecruiters(response.data.users);
      }
    } catch (error) {
      console.error('Failed to load recruiters:', error);
    }
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const addToExportHistory = (exportType, filename, recordCount) => {
    const historyItem = {
      id: Date.now(),
      type: exportType,
      filename: filename,
      recordCount: recordCount,
      timestamp: new Date().toLocaleString(),
      status: 'completed'
    };
    setExportHistory(prev => [historyItem, ...prev.slice(0, 9)]);
  };

  const handleAllRecruitersExport = async () => {
    setLoading(true);
    try {
      const response = await exportAllRecruitersDataAdmin(allRecruitersParams);
      if (response.success) {
        if (allRecruitersParams.format === 'csv') {
          downloadCSV(response.data.content, response.data.filename);
          addToExportHistory('All Recruiters', response.data.filename, response.data.record_count);
          toast.success(`CSV exported successfully! ${response.data.record_count} records`);
        } else {
          console.log('JSON Export Data:', response.data);
          toast.success('Export data retrieved successfully');
        }
      }
    } catch (error) {
      const errorMessage = handleAdminApiError(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSingleRecruiterExport = async () => {
    if (!singleRecruiterParams.recruiter_id) {
      toast.error('Please select a recruiter');
      return;
    }

    setLoading(true);
    try {
      const response = await exportSingleRecruiterDataAdmin(
        singleRecruiterParams.recruiter_id, 
        {
          filter_period: singleRecruiterParams.filter_period,
          format: singleRecruiterParams.format
        }
      );
      if (response.success) {
        if (singleRecruiterParams.format === 'csv') {
          downloadCSV(response.data.content, response.data.filename);
          addToExportHistory('Single Recruiter', response.data.filename, response.data.record_count);
          toast.success(`CSV exported successfully! ${response.data.record_count} records`);
        } else {
          console.log('JSON Export Data:', response.data);
          toast.success('Export data retrieved successfully');
        }
      }
    } catch (error) {
      const errorMessage = handleAdminApiError(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewsExport = async () => {
    setLoading(true);
    try {
      const response = await exportReviewsDataAdmin(reviewsParams);
      if (response.success) {
        if (reviewsParams.format === 'csv') {
          downloadCSV(response.data.content, response.data.filename);
          addToExportHistory('Reviews Data', response.data.filename, response.data.record_count);
          toast.success(`CSV exported successfully! ${response.data.record_count} records`);
        } else {
          console.log('JSON Export Data:', response.data);
          toast.success('Export data retrieved successfully');
        }
      }
    } catch (error) {
      const errorMessage = handleAdminApiError(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketsExport = async () => {
    setLoading(true);
    try {
      const response = await exportTicketsDataAdmin(ticketsParams);
      if (response.success) {
        if (ticketsParams.format === 'csv') {
          downloadCSV(response.data.content, response.data.filename);
          addToExportHistory('Tickets Data', response.data.filename, response.data.record_count);
          toast.success(`CSV exported successfully! ${response.data.record_count} records`);
        } else {
          console.log('JSON Export Data:', response.data);
          toast.success('Export data retrieved successfully');
        }
      }
    } catch (error) {
      const errorMessage = handleAdminApiError(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'all-recruiters', label: 'All Recruiters', icon: 'fas fa-users', color: '#6366f1' },
    { id: 'single-recruiter', label: 'Single Recruiter', icon: 'fas fa-user', color: '#8b5cf6' },
    { id: 'reviews', label: 'Reviews', icon: 'fas fa-star', color: '#f59e0b' },
    { id: 'tickets', label: 'Tickets', icon: 'fas fa-ticket-alt', color: '#10b981' }
  ];

  const periodOptions = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
    { value: '180', label: 'Last 6 months' },
    { value: '365', label: 'Last year' },
    { value: 'all', label: 'All time' }
  ];

  const exportFields = [
    'Date', 'Recruiter Name', 'Email ID', 'Employee ID', 
    'Business Unit', 'Business Function', 'Candidate Name', 
    'Candidate Work Details', 'Review Received', 'Stars', 
    'Google Review Live Link', 'Review Requested Date', 'Review Received Date'
  ];

  return (
    <div className="admin-export-container">
      {/* Page Header */}
      <div className="export-header">
        <div className="header-content">
          <h1>Export Data</h1>
          <p>Generate and download comprehensive reports for analysis</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-outline"
            onClick={() => setShowHistory(!showHistory)}
          >
            <i className="fas fa-history"></i>
            History
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="export-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-item ${selectedTab === tab.id ? 'active' : ''}`}
            onClick={() => setSelectedTab(tab.id)}
            style={{ '--tab-color': tab.color }}
          >
            <i className={tab.icon}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Export Content */}
      <div className="export-content">
        {selectedTab === 'all-recruiters' && (
          <div className="export-panel">
            <div className="panel-header">
              <div className="panel-icon" style={{ background: `linear-gradient(135deg, ${tabs[0].color}, ${tabs[0].color}dd)` }}>
                <i className="fas fa-users"></i>
              </div>
              <div className="panel-info">
                <h2>All Recruiters Export</h2>
                <p>Export comprehensive performance data for all recruiters</p>
              </div>
            </div>

            <div className="panel-body">
              <div className="config-section">
                <div className="config-grid">
                  <div className="config-field">
                    <label>
                      <i className="fas fa-calendar"></i>
                      Time Period
                    </label>
                    <select
                      value={allRecruitersParams.filter_period}
                      onChange={(e) => setAllRecruitersParams(prev => ({
                        ...prev, 
                        filter_period: e.target.value
                      }))}
                    >
                      {periodOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="config-field">
                    <label>
                      <i className="fas fa-file-export"></i>
                      Export Format
                    </label>
                    <div className="format-selector">
                      <button
                        className={`format-btn ${allRecruitersParams.format === 'csv' ? 'active' : ''}`}
                        onClick={() => setAllRecruitersParams(prev => ({ ...prev, format: 'csv' }))}
                      >
                        <i className="fas fa-file-csv"></i>
                        CSV
                      </button>
                      <button
                        className={`format-btn ${allRecruitersParams.format === 'json' ? 'active' : ''}`}
                        onClick={() => setAllRecruitersParams(prev => ({ ...prev, format: 'json' }))}
                      >
                        <i className="fas fa-code"></i>
                        JSON
                      </button>
                    </div>
                  </div>
                </div>

                <div className="config-field">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={allRecruitersParams.include_inactive}
                      onChange={(e) => setAllRecruitersParams(prev => ({
                        ...prev, 
                        include_inactive: e.target.checked
                      }))}
                    />
                    <span className="checkbox-box"></span>
                    <span>Include inactive recruiters</span>
                  </label>
                </div>
              </div>

              <div className="fields-preview">
                <h3>
                  <i className="fas fa-list"></i>
                  Included Fields
                </h3>
                <div className="fields-list">
                  {exportFields.map((field, index) => (
                    <span key={index} className="field-chip">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="panel-footer">
              <button 
                className="btn-export"
                onClick={handleAllRecruitersExport}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loader"></span>
                    Exporting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-download"></i>
                    Export Data
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {selectedTab === 'single-recruiter' && (
          <div className="export-panel">
            <div className="panel-header">
              <div className="panel-icon" style={{ background: `linear-gradient(135deg, ${tabs[1].color}, ${tabs[1].color}dd)` }}>
                <i className="fas fa-user"></i>
              </div>
              <div className="panel-info">
                <h2>Single Recruiter Export</h2>
                <p>Export detailed performance data for a specific recruiter</p>
              </div>
            </div>

            <div className="panel-body">
              <div className="config-section">
                <div className="config-field full-width">
                  <label>
                    <i className="fas fa-user-tie"></i>
                    Select Recruiter
                  </label>
                  <select
                    value={singleRecruiterParams.recruiter_id}
                    onChange={(e) => setSingleRecruiterParams(prev => ({
                      ...prev, 
                      recruiter_id: e.target.value
                    }))}
                  >
                    <option value="">Choose a recruiter...</option>
                    {recruiters.map(recruiter => (
                      <option key={recruiter.user_id} value={recruiter.user_id}>
                        {recruiter.user_name} ({recruiter.employee_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="config-grid">
                  <div className="config-field">
                    <label>
                      <i className="fas fa-calendar"></i>
                      Time Period
                    </label>
                    <select
                      value={singleRecruiterParams.filter_period}
                      onChange={(e) => setSingleRecruiterParams(prev => ({
                        ...prev, 
                        filter_period: e.target.value
                      }))}
                    >
                      {periodOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="config-field">
                    <label>
                      <i className="fas fa-file-export"></i>
                      Export Format
                    </label>
                    <div className="format-selector">
                      <button
                        className={`format-btn ${singleRecruiterParams.format === 'csv' ? 'active' : ''}`}
                        onClick={() => setSingleRecruiterParams(prev => ({ ...prev, format: 'csv' }))}
                      >
                        <i className="fas fa-file-csv"></i>
                        CSV
                      </button>
                      <button
                        className={`format-btn ${singleRecruiterParams.format === 'json' ? 'active' : ''}`}
                        onClick={() => setSingleRecruiterParams(prev => ({ ...prev, format: 'json' }))}
                      >
                        <i className="fas fa-code"></i>
                        JSON
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel-footer">
              <button 
                className="btn-export"
                onClick={handleSingleRecruiterExport}
                disabled={loading || !singleRecruiterParams.recruiter_id}
              >
                {loading ? (
                  <>
                    <span className="loader"></span>
                    Exporting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-download"></i>
                    Export Data
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {selectedTab === 'reviews' && (
          <div className="export-panel">
            <div className="panel-header">
              <div className="panel-icon" style={{ background: `linear-gradient(135deg, ${tabs[2].color}, ${tabs[2].color}dd)` }}>
                <i className="fas fa-star"></i>
              </div>
              <div className="panel-info">
                <h2>Reviews Export</h2>
                <p>Export comprehensive reviews and ratings data</p>
              </div>
            </div>

            <div className="panel-body">
              <div className="config-section">
                <div className="config-grid">
                  <div className="config-field">
                    <label>
                      <i className="fas fa-calendar"></i>
                      Time Period
                    </label>
                    <select
                      value={reviewsParams.filter_period}
                      onChange={(e) => setReviewsParams(prev => ({
                        ...prev, 
                        filter_period: e.target.value
                      }))}
                    >
                      {periodOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="config-field">
                    <label>
                      <i className="fas fa-star"></i>
                      Star Rating
                    </label>
                    <select
                      value={reviewsParams.stars_filter}
                      onChange={(e) => setReviewsParams(prev => ({
                        ...prev, 
                        stars_filter: e.target.value
                      }))}
                    >
                      <option value="">All Ratings</option>
                      <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                      <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                      <option value="3">⭐⭐⭐ 3 Stars</option>
                      <option value="2">⭐⭐ 2 Stars</option>
                      <option value="1">⭐ 1 Star</option>
                    </select>
                  </div>

                  <div className="config-field">
                    <label>
                      <i className="fas fa-user"></i>
                      Recruiter Filter
                    </label>
                    <select
                      value={reviewsParams.recruiter_id}
                      onChange={(e) => setReviewsParams(prev => ({
                        ...prev, 
                        recruiter_id: e.target.value
                      }))}
                    >
                      <option value="">All Recruiters</option>
                      {recruiters.map(recruiter => (
                        <option key={recruiter.user_id} value={recruiter.user_id}>
                          {recruiter.user_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="config-field">
                    <label>
                      <i className="fas fa-file-export"></i>
                      Export Format
                    </label>
                    <div className="format-selector">
                      <button
                        className={`format-btn ${reviewsParams.format === 'csv' ? 'active' : ''}`}
                        onClick={() => setReviewsParams(prev => ({ ...prev, format: 'csv' }))}
                      >
                        <i className="fas fa-file-csv"></i>
                        CSV
                      </button>
                      <button
                        className={`format-btn ${reviewsParams.format === 'json' ? 'active' : ''}`}
                        onClick={() => setReviewsParams(prev => ({ ...prev, format: 'json' }))}
                      >
                        <i className="fas fa-code"></i>
                        JSON
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel-footer">
              <button 
                className="btn-export"
                onClick={handleReviewsExport}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loader"></span>
                    Exporting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-download"></i>
                    Export Data
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {selectedTab === 'tickets' && (
          <div className="export-panel">
            <div className="panel-header">
              <div className="panel-icon" style={{ background: `linear-gradient(135deg, ${tabs[3].color}, ${tabs[3].color}dd)` }}>
                <i className="fas fa-ticket-alt"></i>
              </div>
              <div className="panel-info">
                <h2>Tickets Export</h2>
                <p>Export ticket tracking and request data</p>
              </div>
            </div>

            <div className="panel-body">
              <div className="config-section">
                <div className="config-grid">
                  <div className="config-field">
                    <label>
                      <i className="fas fa-calendar"></i>
                      Time Period
                    </label>
                    <select
                      value={ticketsParams.filter_period}
                      onChange={(e) => setTicketsParams(prev => ({
                        ...prev, 
                        filter_period: e.target.value
                      }))}
                    >
                      {periodOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="config-field">
                    <label>
                      <i className="fas fa-tasks"></i>
                      Status Filter
                    </label>
                    <select
                      value={ticketsParams.status_filter}
                      onChange={(e) => setTicketsParams(prev => ({
                        ...prev, 
                        status_filter: e.target.value
                      }))}
                    >
                      <option value="">All Statuses</option>
                      <option value="email_sent">📧 Email Sent</option>
                      <option value="in_progress">⏳ In Progress</option>
                      <option value="reminder_sent">🔔 Reminder Sent</option>
                      <option value="review_received">✅ Review Received</option>
                      <option value="closed">🔒 Closed</option>
                      <option value="expired">⏰ Expired</option>
                    </select>
                  </div>

                  <div className="config-field">
                    <label>
                      <i className="fas fa-user"></i>
                      Recruiter Filter
                    </label>
                    <select
                      value={ticketsParams.recruiter_id}
                      onChange={(e) => setTicketsParams(prev => ({
                        ...prev, 
                        recruiter_id: e.target.value
                      }))}
                    >
                      <option value="">All Recruiters</option>
                      {recruiters.map(recruiter => (
                        <option key={recruiter.user_id} value={recruiter.user_id}>
                          {recruiter.user_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="config-field">
                    <label>
                      <i className="fas fa-file-export"></i>
                      Export Format
                    </label>
                    <div className="format-selector">
                      <button
                        className={`format-btn ${ticketsParams.format === 'csv' ? 'active' : ''}`}
                        onClick={() => setTicketsParams(prev => ({ ...prev, format: 'csv' }))}
                      >
                        <i className="fas fa-file-csv"></i>
                        CSV
                      </button>
                      <button
                        className={`format-btn ${ticketsParams.format === 'json' ? 'active' : ''}`}
                        onClick={() => setTicketsParams(prev => ({ ...prev, format: 'json' }))}
                      >
                        <i className="fas fa-code"></i>
                        JSON
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel-footer">
              <button 
                className="btn-export"
                onClick={handleTicketsExport}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loader"></span>
                    Exporting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-download"></i>
                    Export Data
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Export History Modal */}
      {showHistory && (
        <div className="history-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Export History</h3>
              <button className="close-btn" onClick={() => setShowHistory(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              {exportHistory.length > 0 ? (
                <div className="history-list">
                  {exportHistory.map(item => (
                    <div key={item.id} className="history-item">
                      <div className="history-icon">
                        <i className="fas fa-file-download"></i>
                      </div>
                      <div className="history-info">
                        <h4>{item.type}</h4>
                        <p>{item.filename}</p>
                        <div className="history-meta">
                          <span><i className="fas fa-database"></i> {item.recordCount} records</span>
                          <span><i className="fas fa-clock"></i> {item.timestamp}</span>
                        </div>
                      </div>
                      <span className="status-badge completed">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <i className="fas fa-inbox"></i>
                  <p>No export history yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExportData;