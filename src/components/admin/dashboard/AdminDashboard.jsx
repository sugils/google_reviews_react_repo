import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { 
  getAdminOverviewAnalytics,
  getAdminBUAnalysis, 
  getAdminRecruiterAnalysis,
  getAdminTopPerformers,
  getAdminCommentsAnalytics,
  getAdminDetailedComments,
  getAdminBusinessUnitsFilter,
  getAdminBURecruiters,
  getAdminCandidateCommentsDetails,
  getAdminRecruiterFullDetails,
  getAdminTopPerformingRecruiters,
  handleAdminApiError 
} from '../../../services/api';
import './AdminDashboard.css';

const COLORS = {
  primary: '#667eea',
  secondary: '#764ba2',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
  indigo: '#6366f1',
  teal: '#14b8a6'
};

const PIE_COLORS = ['#667eea', '#764ba2', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#ec4899'];

// Universal safe number parser
const safeParseNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const strValue = String(value).trim().toLowerCase();
  if (strValue === '' || strValue === 'nan' || strValue === 'null' || 
      strValue === 'undefined' || strValue === 'infinity' || strValue === '-infinity') {
    return defaultValue;
  }
  
  let parsed;
  if (typeof value === 'string') {
    const cleanStr = strValue.replace(/[^\d.-]/g, '');
    parsed = parseFloat(cleanStr);
  } else if (typeof value === 'number') {
    parsed = value;
  } else {
    return defaultValue;
  }
  
  if (!Number.isFinite(parsed)) {
    return defaultValue;
  }
  
  return parsed;
};

// Process nested API data structures
const processApiData = (data) => {
  if (!data || typeof data !== 'object') return null;
  
  const processed = Array.isArray(data) ? [] : {};
  
  if (Array.isArray(data)) {
    return data.map(item => processApiData(item));
  }
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    if (value === null || value === undefined) {
      processed[key] = null;
    } else if (Array.isArray(value)) {
      processed[key] = value.map(v => 
        typeof v === 'object' ? processApiData(v) : v
      );
    } else if (typeof value === 'object') {
      processed[key] = processApiData(value);
    } else if (typeof value === 'number' || 
               (typeof value === 'string' && !isNaN(Number(value)) && 
                key !== 'bu_code' && key !== 'employee_id' && !key.includes('_code') && !key.includes('_name'))) {
      processed[key] = safeParseNumber(value, 0);
    } else {
      processed[key] = value;
    }
  });
  
  return processed;
};

const ModernAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBU, setSelectedBU] = useState('');
  const [sortBy, setSortBy] = useState('response_rate');
  const [filterRating, setFilterRating] = useState('all');
  const [searchRecruiter, setSearchRecruiter] = useState('');
  const [expandedRecruiter, setExpandedRecruiter] = useState(null);
  const [expandedBU, setExpandedBU] = useState(null);
  const [error, setError] = useState(null);
  
  // New states for enhanced features
  const [selectedBUReasons, setSelectedBUReasons] = useState({});
  const [showBUComments, setShowBUComments] = useState({});
  const [expandedReviewsRecruiter, setExpandedReviewsRecruiter] = useState({});
  
  // Data states
  const [overviewData, setOverviewData] = useState(null);
  const [buAnalysisData, setBuAnalysisData] = useState(null);
  const [recruiterData, setRecruiterData] = useState(null);
  const [topPerformers, setTopPerformers] = useState(null);
  const [detailedComments, setDetailedComments] = useState(null);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [buRecruiters, setBuRecruiters] = useState([]);
  const [buComments, setBuComments] = useState({});

  useEffect(() => {
    loadAllData();
  }, [dateRange]);

  useEffect(() => {
    if (selectedBU && selectedBU !== '') {
      fetchBURecruiters(selectedBU);
    }
  }, [selectedBU]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = { days: dateRange };
      const dateParams = {
        start_date: new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      };
      
      const results = await Promise.allSettled([
        getAdminOverviewAnalytics(params),
        getAdminBUAnalysis(params),
        getAdminRecruiterFullDetails({ ...dateParams, page: 1, per_page: 50 }),
        getAdminTopPerformingRecruiters(dateParams),
        getAdminCandidateCommentsDetails({ ...dateParams, page: 1, per_page: 100 }),
        getAdminBusinessUnitsFilter()
      ]);

      const [overviewRes, buRes, recruiterRes, topPerformersRes, commentsRes, businessUnitsRes] = results;

      // Process overview data
      if (overviewRes.status === 'fulfilled' && overviewRes.value?.success) {
        const overview = overviewRes.value.data || {};
        
        const safeOverview = {
          overview: overview.overview || {},
          additional_insights: {
            five_star_reviews: safeParseNumber(overview.additional_insights?.five_star_reviews || overview.overview?.five_star_reviews),
            four_star_reviews: safeParseNumber(overview.additional_insights?.four_star_reviews || overview.overview?.four_star_reviews),
            three_star_reviews: safeParseNumber(overview.additional_insights?.three_star_reviews || overview.overview?.three_star_reviews),
            two_star_reviews: safeParseNumber(overview.additional_insights?.two_star_reviews || overview.overview?.two_star_reviews),
            one_star_reviews: safeParseNumber(overview.additional_insights?.one_star_reviews || overview.overview?.one_star_reviews),
            ...overview.additional_insights
          },
          recent_trends: overview.recent_trends || {}
        };
        setOverviewData(processApiData(safeOverview));
      } else {
        setOverviewData({
          overview: {},
          additional_insights: {},
          recent_trends: {}
        });
      }

      // Process BU analysis data
      if (buRes.status === 'fulfilled' && buRes.value?.success) {
        const buData = buRes.value.data || {};
        
        const recruitersByBU = {};
        if (recruiterRes.status === 'fulfilled' && recruiterRes.value?.data?.recruiters) {
          recruiterRes.value.data.recruiters.forEach(rec => {
            const buName = rec.header?.business_unit || rec.business_unit;
            if (buName) {
              recruitersByBU[buName] = (recruitersByBU[buName] || 0) + 1;
            }
          });
        }
        
        const cleanedBuAnalysis = Array.isArray(buData.bu_analysis) 
          ? buData.bu_analysis.map(bu => ({
              bu_id: bu.bu_id,
              bu_name: String(bu.bu_name || 'Unknown'),
              bu_code: String(bu.bu_code || ''),
              total_starts: safeParseNumber(bu.total_starts),
              requests_sent: safeParseNumber(bu.requests_sent),
              requests_not_sent: safeParseNumber(bu.requests_not_sent),
              reviews_received: safeParseNumber(bu.reviews_received),
              reviews_not_received: safeParseNumber(bu.reviews_not_received),
              requests_sent_percentage: safeParseNumber(bu.requests_sent_percentage),
              requests_not_sent_percentage: safeParseNumber(bu.requests_not_sent_percentage),
              reviews_received_percentage: safeParseNumber(bu.reviews_received_percentage),
              response_rate_percentage: safeParseNumber(bu.response_rate_percentage),
              avg_rating: safeParseNumber(bu.avg_rating),
              five_star_reviews: safeParseNumber(bu.five_star_reviews),
              active_recruiters: recruitersByBU[bu.bu_name] || safeParseNumber(bu.active_recruiters) || safeParseNumber(bu.total_recruiters)
            }))
          : [];
        
        setBuAnalysisData({
          bu_analysis: cleanedBuAnalysis,
          summary: {
            total_business_units: safeParseNumber(buData.summary?.total_business_units),
            total_candidates_all_bu: safeParseNumber(buData.summary?.total_candidates_all_bu),
            avg_response_rate_all_bu: safeParseNumber(buData.summary?.avg_response_rate_all_bu),
            avg_rating_all_bu: safeParseNumber(buData.summary?.avg_rating_all_bu)
          }
        });
      } else {
        setBuAnalysisData({ 
          bu_analysis: [], 
          summary: {
            total_business_units: 0,
            total_candidates_all_bu: 0,
            avg_response_rate_all_bu: 0,
            avg_rating_all_bu: 0
          }
        });
      }

      // Process recruiter data
      if (recruiterRes.status === 'fulfilled') {
        const recData = recruiterRes.value?.data || recruiterRes.value || {};
        const cleanedRecruiters = Array.isArray(recData.recruiters)
          ? recData.recruiters.map(rec => ({
              header: {
                ...rec.header,
                recruiter_id: rec.header?.recruiter_id || rec.recruiter_id,
                recruiter_name: rec.header?.recruiter_name || rec.recruiter_name || rec.name,
                employee_id: rec.header?.employee_id || rec.employee_id,
                total_starts: safeParseNumber(rec.header?.total_starts || rec.total_starts || rec.total_candidates),
                total_reviews_received: safeParseNumber(rec.header?.total_reviews_received || rec.reviews_received),
                avg_rating: safeParseNumber(rec.header?.avg_rating || rec.avg_rating),
                total_stars: safeParseNumber(rec.header?.total_stars || rec.total_stars),
                email: rec.header?.email || rec.email,
                business_unit: rec.header?.business_unit || rec.business_unit,
                business_function: rec.header?.business_function || rec.business_function
              },
              details: Array.isArray(rec.details) ? rec.details.map(detail => ({
                ...detail,
                stars: safeParseNumber(detail.stars)
              })) : []
            }))
          : [];
        setRecruiterData({ recruiters: cleanedRecruiters });
      } else {
        setRecruiterData({ recruiters: [] });
      }

      // Process top performers
      if (topPerformersRes.status === 'fulfilled') {
        const perfData = topPerformersRes.value?.data || topPerformersRes.value || {};
        const cleanedPerformers = Array.isArray(perfData.top_performers)
          ? perfData.top_performers.map(perf => ({
              ...perf,
              rank: safeParseNumber(perf.rank),
              total_starts: safeParseNumber(perf.total_starts || perf.metrics?.total_candidates || perf.metrics?.total_starts),
              total_stars: safeParseNumber(perf.total_stars || perf.metrics?.total_stars),
              avg_rating: safeParseNumber(perf.avg_rating || perf.metrics?.avg_rating),
              reviews_received: safeParseNumber(perf.reviews_received || perf.metrics?.reviews_received),
              response_rate: safeParseNumber(perf.response_rate || perf.metrics?.response_rate),
              high_quality_reviews: safeParseNumber(perf.four_star_reviews || 0) + safeParseNumber(perf.five_star_reviews || 0),
              metrics: {
                total_starts: safeParseNumber(perf.total_starts || perf.metrics?.total_candidates || perf.metrics?.total_starts),
                total_stars: safeParseNumber(perf.total_stars || perf.metrics?.total_stars),
                avg_rating: safeParseNumber(perf.avg_rating || perf.metrics?.avg_rating),
                reviews_received: safeParseNumber(perf.reviews_received || perf.metrics?.reviews_received),
                response_rate: safeParseNumber(perf.response_rate || perf.metrics?.response_rate),
                high_quality_reviews: safeParseNumber(perf.four_star_reviews || 0) + safeParseNumber(perf.five_star_reviews || 0)
              }
            }))
          : [];
        
        cleanedPerformers.sort((a, b) => {
          const reviewDiff = b.metrics.reviews_received - a.metrics.reviews_received;
          if (reviewDiff !== 0) return reviewDiff;
          const qualityDiff = b.metrics.high_quality_reviews - a.metrics.high_quality_reviews;
          if (qualityDiff !== 0) return qualityDiff;
          return b.metrics.avg_rating - a.metrics.avg_rating;
        });
        
        setTopPerformers({ top_performers: cleanedPerformers.slice(0, 5) });
      } else {
        setTopPerformers({ top_performers: [] });
      }

      // Process comments data
      if (commentsRes.status === 'fulfilled') {
        const commentData = commentsRes.value?.data || commentsRes.value || {};
        const processedComments = processApiData(commentData);
        setDetailedComments(processedComments);
        
        if (commentData.comments && Array.isArray(commentData.comments)) {
          const commentsByBU = {};
          commentData.comments.forEach(comment => {
            const buName = comment.business_unit || 
                          comment.bu_name ||
                          comment.for_which_candidate?.business_unit || 
                          comment.recruiter?.business_unit ||
                          'Unknown';
            
            if (!commentsByBU[buName]) {
              commentsByBU[buName] = [];
            }
            commentsByBU[buName].push(comment);
          });
          setBuComments(commentsByBU);
        }
      } else {
        setDetailedComments({ comments: [] });
        setBuComments({});
      }

      // Process business units
      if (businessUnitsRes.status === 'fulfilled' && businessUnitsRes.value?.success) {
        setBusinessUnits(businessUnitsRes.value.data || []);
      } else {
        setBusinessUnits([]);
      }

    } catch (error) {
      console.error('Dashboard load error:', error);
      setError('Failed to load dashboard data. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBURecruiters = async (buId) => {
    try {
      const response = await getAdminBURecruiters(buId, { days: dateRange });
      if (response?.success && response.data) {
        setBuRecruiters(response.data);
      }
    } catch (error) {
      console.error('BU recruiters fetch error:', error);
      setBuRecruiters([]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const formatNumber = (num) => {
    const value = safeParseNumber(num);
    return new Intl.NumberFormat().format(value);
  };

  const formatPercentage = (num) => {
    const value = safeParseNumber(num);
    return `${value.toFixed(1)}%`;
  };

  const getFilteredRecruiters = () => {
    try {
      if (!recruiterData?.recruiters || !Array.isArray(recruiterData.recruiters)) return [];
      
      let filtered = [...recruiterData.recruiters];
      
      if (searchRecruiter) {
        filtered = filtered.filter(r => 
          r.header?.recruiter_name?.toLowerCase().includes(searchRecruiter.toLowerCase()) ||
          r.header?.employee_id?.toLowerCase().includes(searchRecruiter.toLowerCase())
        );
      }
      
      if (filterRating !== 'all') {
        const rating = parseInt(filterRating);
        filtered = filtered.filter(r => 
          Math.floor(safeParseNumber(r.header?.avg_rating)) === rating
        );
      }
      
      return filtered;
    } catch (error) {
      console.error('Error filtering recruiters:', error);
      return [];
    }
  };

  const getSortedBUData = () => {
    try {
      if (!buAnalysisData?.bu_analysis || !Array.isArray(buAnalysisData.bu_analysis)) {
        return [];
      }
      
      let validData = buAnalysisData.bu_analysis.filter(bu => 
        bu && typeof bu === 'object' && bu.bu_code
      );
      
      let sorted = [...validData];
      
      switch(sortBy) {
        case 'response_rate':
          sorted.sort((a, b) => 
            safeParseNumber(b.response_rate_percentage) - safeParseNumber(a.response_rate_percentage)
          );
          break;
        case 'total_starts':
          sorted.sort((a, b) => 
            safeParseNumber(b.total_starts) - safeParseNumber(a.total_starts)
          );
          break;
        case 'reviews_received':
          sorted.sort((a, b) => 
            safeParseNumber(b.reviews_received) - safeParseNumber(a.reviews_received)
          );
          break;
        default:
          break;
      }
      
      return sorted;
    } catch (error) {
      console.error('Error sorting BU data:', error);
      return [];
    }
  };

  const getBUReasonData = (buName) => {
    const comments = buComments[buName] || [];
    if (comments.length === 0) return [];
    
    const reasonCounts = {};
    comments.forEach(comment => {
      const reason = comment.reason || comment.comment_reason || 'Other';
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });
    
    return Object.entries(reasonCounts)
      .map(([name, value], index) => ({
        name,
        value,
        color: PIE_COLORS[index % PIE_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  };

  const getBUFilteredComments = (buName) => {
    const comments = buComments[buName] || [];
    const selectedReason = selectedBUReasons[buName];
    
    if (selectedReason) {
      return comments.filter(comment => 
        (comment.reason || comment.comment_reason || 'Other') === selectedReason
      );
    }
    
    return comments;
  };

  const toggleRecruiterReviews = (recruiterId) => {
    setExpandedReviewsRecruiter(prev => ({
      ...prev,
      [recruiterId]: !prev[recruiterId]
    }));
  };

  const ProgressBar = ({ value, max, color = COLORS.primary, height = 6 }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
      <div style={{ 
        width: '100%', 
        height: `${height}px`, 
        backgroundColor: '#e2e8f0', 
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{ 
          width: `${Math.min(percentage, 100)}%`, 
          height: '100%', 
          backgroundColor: color,
          borderRadius: '3px',
          transition: 'width 0.3s ease'
        }} />
      </div>
    );
  };

  const StarRating = ({ rating, showNumber = true, size = 'normal' }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const fontSize = size === 'small' ? '12px' : '14px';
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<i key={i} className="fas fa-star" style={{ color: '#fbbf24', fontSize }}></i>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<i key={i} className="fas fa-star-half-alt" style={{ color: '#fbbf24', fontSize }}></i>);
      } else {
        stars.push(<i key={i} className="far fa-star" style={{ color: '#cbd5e1', fontSize }}></i>);
      }
    }
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>{stars}</span>
        {showNumber && <span style={{ fontWeight: 600, fontSize: size === 'small' ? '12px' : '14px' }}>{rating.toFixed(1)}</span>}
      </div>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = payload[0].payload.total || 1;
      return (
        <div className="custom-tooltip-compact">
          <p className="tooltip-label">{data.name}</p>
          <p className="tooltip-value">Count: {data.value}</p>
          <p className="tooltip-percentage">
            {((data.value / total) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loader"></div>
        <p>Loading Analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-container" style={{ padding: '40px', textAlign: 'center' }}>
          <h2 style={{ color: '#ef4444' }}>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={handleRefresh} style={{ marginTop: '20px', padding: '10px 20px' }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const overview = overviewData?.overview || {};
  const total = safeParseNumber(overview.total_candidates) || 1;
  const requestsNotSent = Math.max(0, total - safeParseNumber(overview.requests_sent));
  const reviewsNotReceived = Math.max(0, safeParseNumber(overview.requests_sent) - safeParseNumber(overview.reviews_received));
  const responseRate = safeParseNumber(overview.requests_sent) > 0 
    ? safeParseNumber((safeParseNumber(overview.reviews_received) / safeParseNumber(overview.requests_sent)) * 100) : 0;

  return (
    <div className="admin-dashboard-compact">
      {/* Header */}
      <div className="dash-header-compact">
        <div className="dash-title">
          <h1><i className="fas fa-chart-line"></i> VDart Analytics</h1>
        </div>
        
        <div className="dash-controls">
          <div className="tabs">
            {[
              { id: 'overview', icon: 'fas fa-tachometer-alt', label: 'Overview' },
              { id: 'business', icon: 'fas fa-building', label: 'Business Units' },
              { id: 'recruiters', icon: 'fas fa-users', label: 'Recruiters' }
            ].map(tab => (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <i className={tab.icon}></i> {tab.label}
              </button>
            ))}
          </div>
          
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="date-select"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          
          <button onClick={handleRefresh} className="btn-refresh" disabled={refreshing}>
            <i className={`fas fa-sync-alt ${refreshing ? 'spinning' : ''}`}></i>
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="dash-content-compact">
          {/* Metrics Cards with Percentages */}
          <div className="metrics-container-compact">
            <div className="metric-box-compact">
              <div className="metric-icon blue">
                <i className="fas fa-users"></i>
              </div>
              <div className="metric-info">
                <h3>{formatNumber(overview.total_candidates)}</h3>
                <p>Total Starts</p>
                <span className="metric-percentage">100%</span>
              </div>
            </div>

            <div className="metric-box-compact">
              <div className="metric-icon green">
                <i className="fas fa-paper-plane"></i>
              </div>
              <div className="metric-info">
                <h3>{formatNumber(overview.requests_sent)}</h3>
                <p>Total Reviews Sent</p>
                <span className="metric-percentage">{formatPercentage((overview.requests_sent / total) * 100)}</span>
              </div>
            </div>

            <div className="metric-box-compact">
              <div className="metric-icon orange">
                <i className="fas fa-clock"></i>
              </div>
              <div className="metric-info">
                <h3>{formatNumber(requestsNotSent)}</h3>
                <p>Total Reviews Not Sent</p>
                <span className="metric-percentage">{formatPercentage((requestsNotSent / total) * 100)}</span>
              </div>
            </div>

            <div className="metric-box-compact">
              <div className="metric-icon purple">
                <i className="fas fa-star"></i>
              </div>
              <div className="metric-info">
                <h3>{formatNumber(overview.reviews_received)}</h3>
                <p>Total Reviews Received</p>
                <span className="metric-percentage">{formatPercentage((overview.reviews_received / total) * 100)}</span>
              </div>
            </div>

            <div className="metric-box-compact">
              <div className="metric-icon red">
                <i className="fas fa-hourglass-half"></i>
              </div>
              <div className="metric-info">
                <h3>{formatNumber(reviewsNotReceived)}</h3>
                <p>Reviews Yet to Receive</p>
                <span className="metric-percentage">{formatPercentage((reviewsNotReceived / (overview.requests_sent || 1)) * 100)}</span>
              </div>
            </div>

            <div className="metric-box-compact">
              <div className="metric-icon teal">
                <i className="fas fa-percentage"></i>
              </div>
              <div className="metric-info">
                <h3>{formatPercentage(responseRate)}</h3>
                <p>Response Rate</p>
              </div>
            </div>
          </div>

          {/* Visual Analytics Cards - 2x2 Grid */}
          <div className="analytics-grid-compact">
            {/* Distribution Card */}
            <div className="analytics-card-compact">
              <h3><i className="fas fa-chart-pie"></i> Review Distribution</h3>
              <div className="distribution-stats-compact">
                <div className="dist-item">
                  <div className="dist-header">
                    <span className="dist-label">Received</span>
                    <span className="dist-value">{formatNumber(overview.reviews_received)}</span>
                  </div>
                  <ProgressBar value={overview.reviews_received} max={overview.total_candidates} color={COLORS.success} height={8} />
                </div>
                <div className="dist-item">
                  <div className="dist-header">
                    <span className="dist-label">Pending</span>
                    <span className="dist-value">{formatNumber(reviewsNotReceived)}</span>
                  </div>
                  <ProgressBar value={reviewsNotReceived} max={overview.total_candidates} color={COLORS.warning} height={8} />
                </div>
                <div className="dist-item">
                  <div className="dist-header">
                    <span className="dist-label">Not Requested</span>
                    <span className="dist-value">{formatNumber(requestsNotSent)}</span>
                  </div>
                  <ProgressBar value={requestsNotSent} max={overview.total_candidates} color={COLORS.danger} height={8} />
                </div>
              </div>
            </div>

            {/* Star Rating Distribution */}
            <div className="analytics-card-compact">
              <h3><i className="fas fa-star"></i> Rating Distribution</h3>
              <div className="star-distribution-compact">
                {[5, 4, 3, 2, 1].map(stars => {
                  const count = safeParseNumber(
                    overviewData?.additional_insights?.[
                      stars === 5 ? 'five_star_reviews' :
                      stars === 4 ? 'four_star_reviews' :
                      stars === 3 ? 'three_star_reviews' :
                      stars === 2 ? 'two_star_reviews' : 
                      'one_star_reviews'
                    ]
                  );
                  const total = safeParseNumber(overview.reviews_received) || 1;
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  
                  return (
                    <div key={stars} className="star-row-compact">
                      <div className="star-label">{stars}★</div>
                      <div className="star-bar">
                        <ProgressBar value={count} max={total} color={COLORS.warning} height={16} />
                      </div>
                      <div className="star-count">{formatNumber(count)} ({percentage.toFixed(0)}%)</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekly Trends */}
            <div className="analytics-card-compact">
              <h3><i className="fas fa-chart-line"></i> Weekly Trends</h3>
              <div className="trends-grid-compact">
                <div className="trend-item-compact">
                  <div className="trend-icon">
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="trend-data">
                    <h4>New Candidates</h4>
                    <div className="trend-values">
                      <span className="current">This Week: <strong>{formatNumber(overviewData?.recent_trends?.new_candidates_7d)}</strong></span>
                      <span className="previous">Last Week: {formatNumber(overviewData?.recent_trends?.prev_candidates_7d)}</span>
                      {(() => {
                        const curr = safeParseNumber(overviewData?.recent_trends?.new_candidates_7d);
                        const prev = safeParseNumber(overviewData?.recent_trends?.prev_candidates_7d);
                        const change = prev > 0 ? ((curr - prev) / prev * 100).toFixed(1) : 0;
                        return (
                          <span className={`trend-change ${change >= 0 ? 'positive' : 'negative'}`}>
                            <i className={`fas fa-arrow-${change >= 0 ? 'up' : 'down'}`}></i> {Math.abs(change)}%
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                
                <div className="trend-item-compact">
                  <div className="trend-icon">
                    <i className="fas fa-paper-plane"></i>
                  </div>
                  <div className="trend-data">
                    <h4>Requests Sent</h4>
                    <div className="trend-values">
                      <span className="current">This Week: <strong>{formatNumber(overviewData?.recent_trends?.new_requests_7d)}</strong></span>
                      <span className="previous">Last Week: {formatNumber(overviewData?.recent_trends?.prev_requests_7d)}</span>
                      {(() => {
                        const curr = safeParseNumber(overviewData?.recent_trends?.new_requests_7d);
                        const prev = safeParseNumber(overviewData?.recent_trends?.prev_requests_7d);
                        const change = prev > 0 ? ((curr - prev) / prev * 100).toFixed(1) : 0;
                        return (
                          <span className={`trend-change ${change >= 0 ? 'positive' : 'negative'}`}>
                            <i className={`fas fa-arrow-${change >= 0 ? 'up' : 'down'}`}></i> {Math.abs(change)}%
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                
                <div className="trend-item-compact">
                  <div className="trend-icon">
                    <i className="fas fa-star"></i>
                  </div>
                  <div className="trend-data">
                    <h4>Reviews Received</h4>
                    <div className="trend-values">
                      <span className="current">This Week: <strong>{formatNumber(overviewData?.recent_trends?.new_reviews_7d)}</strong></span>
                      <span className="previous">Last Week: {formatNumber(overviewData?.recent_trends?.prev_reviews_7d)}</span>
                      {(() => {
                        const curr = safeParseNumber(overviewData?.recent_trends?.new_reviews_7d);
                        const prev = safeParseNumber(overviewData?.recent_trends?.prev_reviews_7d);
                        const change = prev > 0 ? ((curr - prev) / prev * 100).toFixed(1) : 0;
                        return (
                          <span className={`trend-change ${change >= 0 ? 'positive' : 'negative'}`}>
                            <i className={`fas fa-arrow-${change >= 0 ? 'up' : 'down'}`}></i> {Math.abs(change)}%
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="analytics-card-compact">
              <h3><i className="fas fa-trophy"></i> Top Performers (By Reviews)</h3>
              {topPerformers?.top_performers && topPerformers.top_performers.length > 0 ? (
                <div className="top-performers-list-compact">
                  {topPerformers.top_performers.slice(0, 5).map((performer, index) => (
                    <div key={index} className="performer-row-compact">
                      <div className="performer-rank">
                        {index === 0 && <i className="fas fa-trophy gold"></i>}
                        {index === 1 && <i className="fas fa-medal silver"></i>}
                        {index === 2 && <i className="fas fa-award bronze"></i>}
                        {index > 2 && <span className="rank-number">#{index + 1}</span>}
                      </div>
                      <div className="performer-details">
                        <div className="performer-name">{performer.name || 'Unknown'}</div>
                        <div className="performer-stats">
                          <span title="Total Reviews">{formatNumber(performer.metrics?.reviews_received)} reviews</span>
                          <span title="4-5 Star Reviews">{formatNumber(performer.metrics?.high_quality_reviews || 0)} ⭐4-5</span>
                          <span title="Average Rating">{safeParseNumber(performer.metrics?.avg_rating).toFixed(1)} avg</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">No data available</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BUSINESS UNITS TAB WITH INTEGRATED INSIGHTS */}
      {activeTab === 'business' && (
        <div className="dash-content-compact">
          {/* BU Summary Cards */}
          <div className="bu-summary-cards-compact">
            <div className="bu-card-compact">
              <div className="bu-card-icon">
                <i className="fas fa-building"></i>
              </div>
              <div className="bu-card-content">
                <h3>{safeParseNumber(buAnalysisData?.summary?.total_business_units)}</h3>
                <p>Business Units</p>
              </div>
            </div>

            <div className="bu-card-compact">
              <div className="bu-card-icon green">
                <i className="fas fa-users"></i>
              </div>
              <div className="bu-card-content">
                <h3>{formatNumber(buAnalysisData?.summary?.total_candidates_all_bu)}</h3>
                <p>Total Candidates</p>
              </div>
            </div>

            <div className="bu-card-compact">
              <div className="bu-card-icon purple">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="bu-card-content">
                <h3>{formatPercentage(buAnalysisData?.summary?.avg_response_rate_all_bu)}</h3>
                <p>Avg Response</p>
              </div>
            </div>

            <div className="bu-card-compact">
              <div className="bu-card-icon orange">
                <i className="fas fa-star"></i>
              </div>
              <div className="bu-card-content">
                <h3>{safeParseNumber(buAnalysisData?.summary?.avg_rating_all_bu).toFixed(1)}</h3>
                <p>Avg Rating</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bu-filters-compact">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="response_rate">Sort by Response Rate</option>
              <option value="total_starts">Sort by Total Starts</option>
              <option value="reviews_received">Sort by Reviews</option>
            </select>
          </div>

          {/* Business Units Accordion with Integrated Insights */}
          <div className="bu-accordion-compact">
            <h3><i className="fas fa-building"></i> Business Unit Performance</h3>
            {getSortedBUData().length > 0 ? (
              getSortedBUData().map((bu, index) => {
                const buName = bu.bu_name;
                const buCommentsData = buComments[buName] || [];
                const reasonData = getBUReasonData(buName);
                
                return (
                  <div key={bu.bu_id || index} className="bu-accordion-item-compact">
                    <div 
                      className="bu-accordion-header-compact"
                      onClick={() => setExpandedBU(expandedBU === bu.bu_id ? null : bu.bu_id)}
                    >
                      <div className="bu-header-content-compact">
                        <div className="bu-basic-info-compact">
                          <span className="bu-rank">#{index + 1}</span>
                          <div className="bu-identity">
                            <strong>{bu.bu_name}</strong>
                            <span className="bu-code">{bu.bu_code}</span>
                          </div>
                        </div>
                        <div className="bu-key-metrics-compact">
                          <div className="bu-metric-compact">
                            <span className="bu-metric-value">{formatNumber(bu.total_starts)}</span>
                            <span className="bu-metric-label">Starts</span>
                          </div>
                          <div className="bu-metric-compact">
                            <span className="bu-metric-value">{formatPercentage(bu.response_rate_percentage)}</span>
                            <span className="bu-metric-label">Response</span>
                          </div>
                          <div className="bu-metric-compact">
                            <span className="bu-metric-value">{formatNumber(bu.requests_not_sent)}</span>
                            <span className="bu-metric-label">Not Sent</span>
                          </div>
                          <div className="bu-metric-compact">
                            <span className="bu-metric-value">{formatNumber(bu.active_recruiters)}</span>
                            <span className="bu-metric-label">Recruiters</span>
                          </div>
                        </div>
                      </div>
                      <i className={`fas fa-chevron-${expandedBU === bu.bu_id ? 'up' : 'down'}`}></i>
                    </div>
                    
                    {expandedBU === bu.bu_id && (
  <div className="bu-accordion-body-compact">
    <div className="bu-detailed-stats-compact">
      {/* Request & Review Stats */}
      <div className="bu-stat-row-compact">
        <div className="bu-stat-item-compact">
          <label>Requests Sent</label>
          <span className="stat-value">{formatNumber(bu.requests_sent)}</span>
          <ProgressBar value={bu.requests_sent} max={bu.total_starts} color={COLORS.success} />
          <span className="stat-percentage">{formatPercentage(bu.requests_sent_percentage)}</span>
        </div>
        <div className="bu-stat-item-compact">
          <label>Reviews Received</label>
          <span className="stat-value">{formatNumber(bu.reviews_received)}</span>
          <ProgressBar value={bu.reviews_received} max={bu.requests_sent} color={COLORS.purple} />
          <span className="stat-percentage">{formatPercentage((bu.reviews_received / (bu.requests_sent || 1)) * 100)}</span>
        </div>
        <div className="bu-stat-item-compact">
          <label>Requests Not Sent</label>
          <span className="stat-value">{formatNumber(bu.requests_not_sent)}</span>
          <ProgressBar value={bu.requests_not_sent} max={bu.total_starts} color={COLORS.danger} />
          <span className="stat-percentage">{formatPercentage(bu.requests_not_sent_percentage)}</span>
        </div>
      </div>

      {/* SIDE BY SIDE PIE CHARTS */}
      <div className="bu-charts-grid-compact">
        {/* Review Status Pie Chart */}
        <div className="bu-review-status-section-compact">
          <h4><i className="fas fa-chart-pie"></i> Review Status Distribution</h4>
          <div className="bu-status-chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Sent', value: safeParseNumber(bu.requests_sent), color: '#10b981' },
                    { name: 'Not Sent', value: safeParseNumber(bu.requests_not_sent), color: '#ef4444' },
                    { name: 'Received', value: safeParseNumber(bu.reviews_received), color: '#8b5cf6' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({value, percent}) => `${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: 'Sent', value: safeParseNumber(bu.requests_sent), color: '#10b981' },
                    { name: 'Not Sent', value: safeParseNumber(bu.requests_not_sent), color: '#ef4444' },
                    { name: 'Received', value: safeParseNumber(bu.reviews_received), color: '#8b5cf6' }
                  ].map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Comment Reasons Pie Chart */}
        {buCommentsData.length > 0 && reasonData.length > 0 && (
          <div className="bu-comments-analysis-section-compact">
            <h4><i className="fas fa-comments"></i> Comment Reasons ({buCommentsData.length})</h4>
            <div className="bu-pie-chart-compact">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={reasonData.map(d => ({ ...d, total: buCommentsData.length }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({percent}) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reasonData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Comments Section - Below the charts */}
      {buCommentsData.length > 0 && (
        <div className="bu-comments-section-compact">
          <div className="bu-comments-header">
            <h4><i className="fas fa-list"></i> Detailed Comments</h4>
            <button
              className="show-comments-btn-compact"
              onClick={(e) => {
                e.stopPropagation();
                setShowBUComments(prev => ({ ...prev, [buName]: !prev[buName] }));
              }}
            >
              <i className={`fas fa-chevron-${showBUComments[buName] ? 'up' : 'down'}`}></i>
              {showBUComments[buName] ? 'Hide' : 'Show'} Comments
            </button>
          </div>
          
          {showBUComments[buName] && (
            <>
              {/* Reason Filter Buttons */}
              <div className="bu-reason-filters-compact">
                <button
                  className={`reason-btn-compact ${!selectedBUReasons[buName] ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBUReasons(prev => ({ ...prev, [buName]: null }));
                  }}
                >
                  All ({buCommentsData.length})
                </button>
                {reasonData.map(reason => (
                  <button
                    key={reason.name}
                    className={`reason-btn-compact ${selectedBUReasons[buName] === reason.name ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBUReasons(prev => ({ ...prev, [buName]: reason.name }));
                    }}
                  >
                    {reason.name} ({reason.value})
                  </button>
                ))}
              </div>
              
              {/* Comments List */}
              <div className="bu-comments-list-compact">
                {getBUFilteredComments(buName).slice(0, 10).map((comment, idx) => (
                  <div key={comment.comment_id || idx} className="bu-comment-item-compact">
                    <div className="comment-header-compact">
                      <span className="comment-user-compact">
                        {comment.who_left_comment?.recruiter_name || 
                         comment.recruiter_name || 
                         comment.recruiter?.name || 
                         'Unknown'}
                      </span>
                      <span className="comment-reason-compact">
                        {comment.reason || comment.comment_reason || 'General'}
                      </span>
                    </div>
                    <p className="comment-text-compact">{comment.comment || comment.comment_text}</p>
                    <div className="comment-meta-compact">
                      <span><i className="fas fa-user"></i> {comment.for_which_candidate?.name || comment.candidate_name || 'N/A'}</span>
                      <span><i className="fas fa-briefcase"></i> {comment.for_which_candidate?.job_title || comment.job_title || 'N/A'}</span>
                    </div>
                  </div>
                ))}
                {getBUFilteredComments(buName).length > 10 && (
                  <p className="more-comments-text">Showing 10 of {getBUFilteredComments(buName).length} comments</p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  </div>
)}
                  </div>
                );
              })
            ) : (
              <div className="no-data">No business unit data available</div>
            )}
          </div>
        </div>
      )}

      {/* RECRUITERS TAB */}
      {activeTab === 'recruiters' && (
        <div className="dash-content-compact">
          {/* Top Performers Section */}
          {topPerformers?.top_performers && topPerformers.top_performers.length > 0 && (
            <div className="top-performers-section-compact">
              <h2><i className="fas fa-trophy"></i> Top 5 Performers (By Review Count)</h2>
              <div className="performers-grid-compact">
                {topPerformers.top_performers.slice(0, 5).map((performer, index) => (
                  <div key={performer.recruiter_id || index} className="performer-card-compact">
                    <div className={`rank-badge-compact rank-${index + 1}`}>
                      {index === 0 && <i className="fas fa-trophy"></i>}
                      {index === 1 && <i className="fas fa-medal"></i>}
                      {index === 2 && <i className="fas fa-award"></i>}
                      {index > 2 && `#${index + 1}`}
                    </div>
                    <h4>{performer.name || performer.user_name || 'Unknown'}</h4>
                    <p className="emp-id">{performer.employee_id || 'N/A'}</p>
                    <div className="performer-metrics-compact">
                      <div className="metric">
                        <span className="value">{formatNumber(performer.metrics?.reviews_received)}</span>
                        <span className="label">Reviews</span>
                      </div>
                      <div className="metric">
                        <span className="value">{formatNumber(performer.metrics?.high_quality_reviews || 0)}</span>
                        <span className="label">4-5★</span>
                      </div>
                      <div className="metric">
                        <span className="value">{safeParseNumber(performer.metrics?.avg_rating).toFixed(1)}</span>
                        <span className="label">Avg</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="recruiter-filters-compact">
            <input
              type="text"
              placeholder="Search recruiter..."
              value={searchRecruiter}
              onChange={(e) => setSearchRecruiter(e.target.value)}
              className="search-input"
            />
            
            <select 
              value={filterRating} 
              onChange={(e) => setFilterRating(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          {/* Recruiters Grid Layout */}
          <div className="recruiters-grid-section">
            <h3><i className="fas fa-users"></i> All Recruiters ({getFilteredRecruiters().length})</h3>
            
            {/* Grid of Recruiter Cards */}
            <div className="recruiters-card-grid">
              {getFilteredRecruiters().length > 0 ? (
                getFilteredRecruiters().map((recruiter, index) => (
                  <div key={recruiter.header?.recruiter_id || index} className="recruiter-grid-card">
                    {/* Card Header with Rank */}
                    <div className="recruiter-card-header">
                      <span className="recruiter-rank-badge">#{index + 1}</span>
                      <div className="recruiter-avatar">
                        <i className="fas fa-user-circle"></i>
                      </div>
                    </div>
                    
                    {/* Basic Info */}
                    <div className="recruiter-card-info">
                      <h4>{recruiter.header?.recruiter_name || 'Unknown'}</h4>
                      <span className="recruiter-emp-id">{recruiter.header?.employee_id || 'N/A'}</span>
                      <span className="recruiter-bu">{recruiter.header?.business_unit || 'N/A'}</span>
                    </div>
                    
                    {/* Key Metrics */}
                    <div className="recruiter-card-metrics">
                      <div className="metric-item">
                        <StarRating rating={safeParseNumber(recruiter.header?.avg_rating)} size="small" />
                      </div>
                      <div className="metric-row">
                        <div className="metric-item">
                          <span className="metric-value">{formatNumber(recruiter.header?.total_reviews_received)}</span>
                          <span className="metric-label">Reviews</span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-value">{formatNumber(recruiter.header?.total_starts)}</span>
                          <span className="metric-label">Candidates</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* View Details Button */}
                    <button 
                      className="view-details-btn"
                      onClick={() => setExpandedRecruiter(
                        expandedRecruiter === recruiter.header?.recruiter_id ? null : recruiter.header?.recruiter_id
                      )}
                    >
                      {expandedRecruiter === recruiter.header?.recruiter_id ? 'Hide Details' : 'View Details'}
                      <i className={`fas fa-chevron-${expandedRecruiter === recruiter.header?.recruiter_id ? 'up' : 'down'}`}></i>
                    </button>
                    
                    {/* Expanded Details Section */}
                    {expandedRecruiter === recruiter.header?.recruiter_id && (
                      <div className="recruiter-expanded-details">
                        {/* Contact Info */}
                        <div className="expanded-contact">
                          <p><i className="fas fa-envelope"></i> {recruiter.header?.email || 'N/A'}</p>
                          <p><i className="fas fa-b12riefcase"></i> {recruiter.header?.business_function || 'N/A'}</p>
                        </div>
                        
                        {/* Detailed Stats */}
                        <div className="expanded-stats">
                          <div className="stat-card">
                            <i className="fas fa-star"></i>
                            <span className="stat-value">{safeParseNumber(recruiter.header?.total_stars)}</span>
                            <span className="stat-label">Total Stars</span>
                          </div>
                          <div className="stat-card">
                            <i className="fas fa-percentage"></i>
                            <span className="stat-value">
                              {recruiter.header?.total_starts > 0 
                                ? formatPercentage(Math.min((recruiter.header?.total_reviews_received / recruiter.header?.total_starts) * 100, 100))
                                : '0%'}
                            </span>
                            <span className="stat-label">Response Rate</span>
                          </div>
                        </div>
                        
                        {/* Reviews Section */}
                        {recruiter.details && recruiter.details.length > 0 && (
                          <div className="expanded-reviews">
                            <div className="reviews-header">
                              <h5><i className="fas fa-comments"></i> Reviews ({recruiter.details.length})</h5>
                              {!expandedReviewsRecruiter[recruiter.header?.recruiter_id] && recruiter.details.length > 3 && (
                                <button 
                                  className="show-more-reviews-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleRecruiterReviews(recruiter.header?.recruiter_id);
                                  }}
                                >
                                  Show All
                                </button>
                              )}
                            </div>
                            
                            <div className="reviews-list">
                              {recruiter.details.slice(0, expandedReviewsRecruiter[recruiter.header?.recruiter_id] ? recruiter.details.length : 3).map((detail, idx) => (
                                <div key={idx} className="review-item">
                                  <div className="review-header">
                                    <span className="candidate-name">
                                      <i className="fas fa-user"></i> {detail.candidate_name || 'Anonymous'}
                                    </span>
                                    <StarRating rating={safeParseNumber(detail.stars)} showNumber={false} size="small" />
                                  </div>
                                  {detail.review_message && (
                                    <p className="review-message">{detail.review_message}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            {expandedReviewsRecruiter[recruiter.header?.recruiter_id] && recruiter.details.length > 3 && (
                              <button 
                                className="show-less-reviews-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRecruiterReviews(recruiter.header?.recruiter_id);
                                }}
                              >
                                Show Less
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-data">No recruiter data available</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernAdminDashboard;