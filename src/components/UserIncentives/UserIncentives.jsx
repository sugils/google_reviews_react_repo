// components/userIncentives/UserIncentives.jsx - Updated with error fixes
import React, { useState, useEffect } from 'react';
import { userIncentiveAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './UserIncentives.css';

const UserIncentives = () => {
  const [dashboard, setDashboard] = useState(null);
  const [incentives, setIncentives] = useState(null);
  const [history, setHistory] = useState([]);
  const [ranking, setRanking] = useState(null);
  const [teamComparison, setTeamComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState({
    filter_type: 'current_month',
    date_from: '',
    date_to: '',
    page: 1,
    per_page: 20
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'details') {
      fetchIncentiveDetails();
    } else if (activeTab === 'history') {
      fetchHistory();
    } else if (activeTab === 'ranking') {
      fetchRanking();
    }
  }, [activeTab, filters]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await userIncentiveAPI.getMyDashboard();
      setDashboard(response.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncentiveDetails = async () => {
    setLoading(true);
    try {
      const response = await userIncentiveAPI.getMyIncentives(filters);
      setIncentives(response.data);
    } catch (error) {
      toast.error('Failed to fetch incentive details');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await userIncentiveAPI.getMyHistory({ months: 6 });
      setHistory(response.data?.history || []);
    } catch (error) {
      toast.error('Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  const fetchRanking = async () => {
    setLoading(true);
    try {
      const [rankingRes, comparisonRes] = await Promise.all([
        userIncentiveAPI.getMyRanking({ filter_type: filters.filter_type }),
        userIncentiveAPI.getTeamComparison({ filter_type: filters.filter_type })
      ]);
      setRanking(rankingRes.data?.ranking);
      setTeamComparison(comparisonRes.data?.comparison);
    } catch (error) {
      toast.error('Failed to fetch ranking data');
    } finally {
      setLoading(false);
    }
  };

// In UserIncentives.jsx, update handleExport:

const handleExport = async () => {
  try {
    const token = localStorage.getItem('token');
    const queryString = new URLSearchParams(filters).toString();
    // Correct path without /v1
    const endpoint = `/api/incentives/my-incentives/export${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `my_incentives_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  } catch (error) {
    toast.error('Failed to export report');
    console.error('Export error:', error);
  }
};

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1
    }));
  };

  // Helper function to safely format numbers
  const formatNumber = (value, decimals = 1) => {
    if (value === null || value === undefined) return '0';
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '0';
    return num.toFixed(decimals);
  };

  // Helper function to safely format currency
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0';
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString();
  };

  return (
    <div className="user-incentives">
      <div className="incentives-header">
        <h1>My Review Incentives</h1>
        <button onClick={handleExport} className="export-btn">
          <i className="fas fa-download"></i> Export My Data
        </button>
      </div>

      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Detailed View
          </button>
          <button 
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
          <button 
            className={`tab ${activeTab === 'ranking' ? 'active' : ''}`}
            onClick={() => setActiveTab('ranking')}
          >
            My Ranking
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <div className="content-section">
          {activeTab === 'dashboard' && dashboard && (
            <div className="dashboard-view">
              <div className="metrics-grid">
                <div className="metric-card current-month">
                  <div className="metric-header">
                    <i className="fas fa-calendar-alt"></i>
                    <span>{dashboard.current_month?.month || 'Current Month'}</span>
                  </div>
                  <div className="metric-value">
                    ₹{formatCurrency(dashboard.current_month?.total_amount)}
                  </div>
                  <div className="metric-details">
                    <span>{dashboard.current_month?.total_reviews || 0} Reviews</span>
                    <span>⭐ {formatNumber(dashboard.current_month?.avg_rating)}</span>
                  </div>
                </div>

                <div className="metric-card previous-month">
                  <div className="metric-header">
                    <i className="fas fa-history"></i>
                    <span>{dashboard.previous_month?.month || 'Previous Month'}</span>
                  </div>
                  <div className="metric-value">
                    ₹{formatCurrency(dashboard.previous_month?.total_amount)}
                  </div>
                  <div className="metric-details">
                    <span>{dashboard.previous_month?.total_reviews || 0} Reviews</span>
                    <span>⭐ {formatNumber(dashboard.previous_month?.avg_rating)}</span>
                  </div>
                </div>

                <div className="metric-card quarter">
                  <div className="metric-header">
                    <i className="fas fa-chart-line"></i>
                    <span>{dashboard.current_quarter?.quarter || 'Current Quarter'}</span>
                  </div>
                  <div className="metric-value">
                    ₹{formatCurrency(dashboard.current_quarter?.total_amount)}
                  </div>
                  <div className="metric-details">
                    <span>{dashboard.current_quarter?.total_reviews || 0} Reviews</span>
                    <span>⭐ {formatNumber(dashboard.current_quarter?.avg_rating)}</span>
                  </div>
                </div>

                <div className="metric-card year">
                  <div className="metric-header">
                    <i className="fas fa-trophy"></i>
                    <span>Year {dashboard.current_year?.year || new Date().getFullYear()}</span>
                  </div>
                  <div className="metric-value">
                    ₹{formatCurrency(dashboard.current_year?.total_amount)}
                  </div>
                  <div className="metric-details">
                    <span>{dashboard.current_year?.total_reviews || 0} Reviews</span>
                    <span>⭐ {formatNumber(dashboard.current_year?.avg_rating)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="details-view">
              <div className="filters-row">
                <select 
                  name="filter_type" 
                  value={filters.filter_type}
                  onChange={handleFilterChange}
                >
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="current_month">Current Month</option>
                  <option value="current_quarter">Current Quarter</option>
                  <option value="custom">Custom Range</option>
                </select>

                {filters.filter_type === 'custom' && (
                  <>
                    <input 
                      type="date" 
                      name="date_from"
                      value={filters.date_from}
                      onChange={handleFilterChange}
                    />
                    <input 
                      type="date" 
                      name="date_to"
                      value={filters.date_to}
                      onChange={handleFilterChange}
                    />
                  </>
                )}
              </div>

              {incentives && (
                <>
                  <div className="summary-bar">
                    <div className="summary-item">
                      <span>Total Reviews:</span>
                      <strong>{incentives.summary?.total_reviews || 0}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Total Amount:</span>
                      <strong>₹{formatCurrency(incentives.summary?.total_amount)}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Average Rating:</span>
                      <strong>⭐ {formatNumber(incentives.summary?.avg_rating)}</strong>
                    </div>
                  </div>

                  <div className="table-container">
                    <table className="incentive-table">
                      <thead>
                        <tr>
                          <th>Week</th>
                          <th>Date</th>
                          <th>Candidate</th>
                          <th>Client</th>
                          <th>Rating</th>
                          <th>Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incentives.records?.map((record, index) => (
                          <tr key={index}>
                            <td>{record.week_no || '-'}</td>
                            <td>{record.review_date || '-'}</td>
                            <td>{record.candidate_name || '-'}</td>
                            <td>{record.client_name || '-'}</td>
                            <td>
                              <div className="rating">
                                {[...Array(5)].map((_, i) => (
                                  <i 
                                    key={i} 
                                    className={`fas fa-star ${i < (record.rating || 0) ? 'filled' : ''}`}
                                  />
                                ))}
                              </div>
                            </td>
                            <td>₹{formatCurrency(record.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="history-view">
              <div className="history-chart">
                {history.map((month, index) => {
                  const maxReviews = Math.max(...history.map(h => h.review_count || 0), 1);
                  return (
                    <div key={index} className="history-item">
                      <div className="month-label">{month.month || '-'}</div>
                      <div className="month-bar">
                        <div 
                          className="bar-fill"
                          style={{ 
                            width: `${((month.review_count || 0) / maxReviews) * 100}%` 
                          }}
                        />
                      </div>
                      <div className="month-details">
                        <span>{month.review_count || 0} reviews</span>
                        <span>₹{formatCurrency(month.amount)}</span>
                        <span>⭐ {formatNumber(month.avg_rating)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'ranking' && (
            <div className="ranking-view">
              {ranking && (
                <div className="ranking-card">
                  <h3>My Performance Ranking</h3>
                  <div className="ranking-metrics">
                    <div className="rank-item">
                      <span>Review Count Rank</span>
                      <strong>#{ranking.review_count_rank || '-'} of {ranking.total_recruiters || '-'}</strong>
                    </div>
                    <div className="rank-item">
                      <span>Rating Rank</span>
                      <strong>#{ranking.rating_rank || '-'} of {ranking.total_recruiters || '-'}</strong>
                    </div>
                    <div className="rank-item">
                      <span>My Reviews</span>
                      <strong>{ranking.review_count || 0}</strong>
                    </div>
                    <div className="rank-item">
                      <span>My Rating</span>
                      <strong>⭐ {formatNumber(ranking.avg_rating)}</strong>
                    </div>
                  </div>
                </div>
              )}

              {teamComparison && (
                <div className="comparison-card">
                  <h3>Team Comparison</h3>
                  <div className="comparison-metrics">
                    <div className="comparison-item">
                      <span>My Reviews</span>
                      <strong>{teamComparison.user_reviews || 0}</strong>
                    </div>
                    <div className="comparison-item">
                      <span>Team Average</span>
                      <strong>{formatNumber(teamComparison.team_avg_reviews)}</strong>
                    </div>
                    <div className="comparison-item">
                      <span>My Rating</span>
                      <strong>⭐ {formatNumber(teamComparison.user_rating)}</strong>
                    </div>
                    <div className="comparison-item">
                      <span>Team Avg Rating</span>
                      <strong>⭐ {formatNumber(teamComparison.team_avg_rating)}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserIncentives;