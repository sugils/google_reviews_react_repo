import React, { useState, useEffect } from 'react';
import { 
  getAllReviewsAdmin,
  getReviewDetailsAdmin,
  getReviewStatisticsAdmin,
  getReviewTrendsAdmin,
  getAllUsersAdmin,
  getAdminBUAnalysis,
  getAdminRecruiterAnalysis,
  getAdminCommentsAnalytics,
  handleAdminApiError 
} from '../../../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import toast from 'react-hot-toast';
import './AdminReviewHistory.css';

const AdminReviewHistory = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all-reviews');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    stars: '',
    recruiter_id: '',
    date_from: '',
    date_to: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total_count: 0,
    total_pages: 0
  });
  const [recruiters, setRecruiters] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [reviewTrends, setReviewTrends] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Chart data states
  const [ratingDistribution, setRatingDistribution] = useState([]);
  const [businessUnitStats, setBusinessUnitStats] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [buAnalysis, setBuAnalysis] = useState(null);
  const [recruiterAnalysis, setRecruiterAnalysis] = useState(null);
  const [commentsAnalytics, setCommentsAnalytics] = useState(null);

  useEffect(() => {
    if (selectedTab === 'all-reviews') {
      loadReviews();
    } else if (selectedTab === 'statistics') {
      loadStatistics();
      loadReviewTrends();
      loadBUAnalysis();
      loadRecruiterAnalysis();
      loadCommentsAnalytics();
    }
    loadRecruiters();
  }, [filters, pagination.page, searchTerm, selectedTab]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        search: searchTerm,
        page: pagination.page,
        limit: pagination.limit
      };
      const response = await getAllReviewsAdmin(params);
      if (response.success) {
        setReviews(response.data.reviews || []);
        setPagination(prev => ({ 
          ...prev, 
          total_count: response.data.pagination?.total_count || 0,
          total_pages: response.data.pagination?.total_pages || 0
        }));
      }
    } catch (error) {
      const errorMessage = handleAdminApiError(error);
      toast.error(errorMessage || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const loadRecruiters = async () => {
    try {
      const response = await getAllUsersAdmin({ role: 'recruiter', limit: 1000 });
      if (response.success) {
        setRecruiters(response.data.users || []);
      }
    } catch (error) {
      console.error('Failed to load recruiters:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await getReviewStatisticsAdmin(12);
      if (response.success && response.data) {
        setStatistics(response.data);
        
        // Process rating distribution
        if (response.data.rating_distribution) {
          const distribution = [
            { name: '5 Stars', value: response.data.rating_distribution.five_stars || 0, color: '#10B981' },
            { name: '4 Stars', value: response.data.rating_distribution.four_stars || 0, color: '#3B82F6' },
            { name: '3 Stars', value: response.data.rating_distribution.three_stars || 0, color: '#F59E0B' },
            { name: '2 Stars', value: response.data.rating_distribution.two_stars || 0, color: '#F97316' },
            { name: '1 Star', value: response.data.rating_distribution.one_star || 0, color: '#EF4444' }
          ];
          setRatingDistribution(distribution);
        }

        // Process business unit stats
        if (response.data.bu_performance) {
          const buStats = response.data.bu_performance.map(bu => ({
            name: bu.bu_name,
            reviews: bu.total_reviews,
            avgRating: bu.avg_rating,
            fiveStars: bu.five_star_reviews
          }));
          setBusinessUnitStats(buStats);
        }
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const loadReviewTrends = async () => {
    try {
      const response = await getReviewTrendsAdmin({ months: 12 });
      if (response.success && response.data) {
        setReviewTrends(response.data);
        
        // Process monthly trends
        if (response.data.monthly_trends && Array.isArray(response.data.monthly_trends)) {
          const trends = response.data.monthly_trends.map(trend => ({
            month: trend.month,
            totalReviews: trend.total_reviews || 0,
            avgRating: trend.avg_rating || 0,
            fiveStarRate: trend.five_star_percentage || 0
          }));
          setMonthlyTrends(trends);
        }
      }
    } catch (error) {
      console.error('Failed to load review trends:', error);
    }
  };

  const loadBUAnalysis = async () => {
    try {
      const response = await getAdminBUAnalysis({ 
        start_date: filters.date_from, 
        end_date: filters.date_to 
      });
      if (response.success && response.data) {
        setBuAnalysis(response.data);
        
        // Process BU data for detailed charts
        if (response.data.bu_performance && Array.isArray(response.data.bu_performance)) {
          const buStats = response.data.bu_performance.slice(0, 10).map(bu => ({
            name: bu.bu_name || bu.business_unit,
            reviews: bu.total_reviews || 0,
            avgRating: bu.avg_rating || 0,
            fiveStars: bu.five_star_count || 0
          }));
          setBusinessUnitStats(buStats);
        }
      }
    } catch (error) {
      console.error('Failed to load BU analysis:', error);
    }
  };

  const loadRecruiterAnalysis = async () => {
    try {
      const response = await getAdminRecruiterAnalysis({ 
        start_date: filters.date_from, 
        end_date: filters.date_to,
        limit: 10
      });
      if (response.success && response.data) {
        setRecruiterAnalysis(response.data);
      }
    } catch (error) {
      console.error('Failed to load recruiter analysis:', error);
    }
  };

  const loadCommentsAnalytics = async () => {
    try {
      const response = await getAdminCommentsAnalytics({ 
        start_date: filters.date_from, 
        end_date: filters.date_to 
      });
      if (response.success && response.data) {
        setCommentsAnalytics(response.data);
      }
    } catch (error) {
      console.error('Failed to load comments analytics:', error);
    }
  };

  const handleViewDetails = async (reviewId) => {
    try {
      const response = await getReviewDetailsAdmin(reviewId);
      if (response.success) {
        setSelectedReview(response.data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      const errorMessage = handleAdminApiError(error);
      toast.error(errorMessage || 'Failed to load review details');
    }
  };

  const handleResetFilters = () => {
    setFilters({
      stars: '',
      recruiter_id: '',
      date_from: '',
      date_to: ''
    });
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStarRating = (stars) => {
    return '★'.repeat(stars || 0);
  };

  const getStarsBadgeClass = (stars) => {
    if (stars === 5) return 'stars-excellent';
    if (stars === 4) return 'stars-good';
    if (stars === 3) return 'stars-average';
    if (stars === 2) return 'stars-below';
    return 'stars-poor';
  };

  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
  };

  const formatDateTime = (dateString) => {
    return dateString ? new Date(dateString).toLocaleString() : 'N/A';
  };

  const tabs = [
    { id: 'all-reviews', label: 'All Reviews', count: pagination.total_count },
    { id: 'statistics', label: 'Statistics', count: 0 }
  ];

  const calculatePercentage = (value, total) => {
    if (!total || total === 0) return 0;
    return ((value / total) * 100).toFixed(1);
  };

  if (loading && reviews.length === 0 && selectedTab === 'all-reviews') {
    return (
      <div className="review-loading">
        <div className="loading-spinner"></div>
        <p>Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="admin-review-history">
      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${selectedTab === tab.id ? 'active' : ''}`}
            onClick={() => setSelectedTab(tab.id)}
          >
            
            <span>{tab.label}</span>
            {tab.count > 0 && <span className="tab-count">{tab.count}</span>}
          </button>
        ))}
      </div>

      {selectedTab === 'statistics' && (
        <div className="statistics-section">
          {/* Overview Cards */}
          <div className="stats-overview">
            <div className="stat-card primary">
              <div className="stat-icon">
                <i className="fas fa-star"></i>
              </div>
              <div className="stat-content">
                <h3>Total Reviews</h3>
                <p className="stat-value">{statistics?.overall_stats?.total_reviews || 0}</p>
                <span className="stat-trend positive">
                  <i className="fas fa-arrow-up"></i> 
                  {statistics?.growth?.percentage || 0}% this month
                </span>
              </div>
            </div>
            
            <div className="stat-card success">
              <div className="stat-icon">
                <i className="fas fa-chart-bar"></i>
              </div>
              <div className="stat-content">
                <h3>Average Rating</h3>
                <p className="stat-value">
                  {statistics?.overall_stats?.avg_rating?.toFixed(1) || '0.0'}
                </p>
                <span className="stat-trend positive">
                  <i className="fas fa-arrow-up"></i> 
                  {statistics?.rating_trend?.change || 0} points
                </span>
              </div>
            </div>
            
            <div className="stat-card info">
              <div className="stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-content">
                <h3>Active Recruiters</h3>
                <p className="stat-value">{statistics?.overall_stats?.active_recruiters || 0}</p>
                <span className="stat-trend neutral">
                  <i className="fas fa-minus"></i> No change
                </span>
              </div>
            </div>
            
            <div className="stat-card warning">
              <div className="stat-icon">
                <i className="fas fa-medal"></i>
              </div>
              <div className="stat-content">
                <h3>5-Star Reviews</h3>
                <p className="stat-value">{statistics?.overall_stats?.five_stars || 0}</p>
                <span className="stat-trend positive">
                  <i className="fas fa-arrow-up"></i> 
                  {calculatePercentage(
                    statistics?.overall_stats?.five_stars,
                    statistics?.overall_stats?.total_reviews
                  )}%
                </span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-section">
            {/* Rating Distribution */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>
                  <i className="fas fa-chart-pie"></i>
                  Rating Distribution
                </h3>
              </div>
              <div className="chart-content">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={ratingDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={140}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {ratingDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} reviews`, 'Count']}
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Business Unit Performance */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>
                  <i className="fas fa-building"></i>
                  Business Unit Performance
                </h3>
              </div>
              <div className="chart-content">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={businessUnitStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#64748b" 
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="reviews" fill="#6366f1" name="Total Reviews" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="fiveStars" fill="#10B981" name="5-Star Reviews" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Monthly Trends Chart */}
          {monthlyTrends.length > 0 && (
            <div className="chart-card full-width">
              <div className="chart-header">
                <h3>
                  <i className="fas fa-chart-line"></i>
                  Monthly Review Trends
                </h3>
              </div>
              <div className="chart-content">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="totalReviews" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      name="Total Reviews"
                      dot={{ fill: '#6366f1' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgRating" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Avg Rating"
                      dot={{ fill: '#10B981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Top Recruiters Performance */}
          {recruiterAnalysis && recruiterAnalysis.top_performers && (
            <div className="chart-card">
              <div className="chart-header">
                <h3>
                  <i className="fas fa-trophy"></i>
                  Top Performing Recruiters
                </h3>
              </div>
              <div className="chart-content">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart 
                    data={recruiterAnalysis.top_performers.slice(0, 10).map(r => ({
                      name: r.recruiter_name,
                      reviews: r.total_reviews || 0,
                      rating: r.avg_rating || 0,
                      fiveStars: r.five_star_count || 0
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#64748b" 
                      fontSize={11}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="reviews" fill="#8b5cf6" name="Total Reviews" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="fiveStars" fill="#10B981" name="5-Star Reviews" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Comments Analytics */}
          {commentsAnalytics && commentsAnalytics.reasons_distribution && (
            <div className="chart-card">
              <div className="chart-header">
                <h3>
                  <i className="fas fa-comments"></i>
                  Comments Analytics
                </h3>
              </div>
              <div className="chart-content">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={Object.entries(commentsAnalytics.reasons_distribution).map(([key, value]) => ({
                        name: key.replace(/_/g, ' '),
                        value: value,
                        color: key === 'positive' ? '#10B981' : 
                               key === 'improvement' ? '#f59e0b' : 
                               key === 'neutral' ? '#6b7280' : '#ef4444'
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      dataKey="value"
                    >
                      {Object.entries(commentsAnalytics.reasons_distribution).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={
                          entry[0] === 'positive' ? '#10B981' : 
                          entry[0] === 'improvement' ? '#f59e0b' : 
                          entry[0] === 'neutral' ? '#6b7280' : '#ef4444'
                        } />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Detailed Business Unit Stats */}
          {businessUnitStats.length > 0 && (
            <div className="bu-performance">
              <h3>
                <i className="fas fa-chart-line"></i>
                Detailed Business Unit Analytics
              </h3>
              <div className="bu-grid">
                {businessUnitStats.map((bu, index) => (
                  <div key={index} className="bu-card">
                    <h4>{bu.name}</h4>
                    <div className="bu-stats">
                      <div className="bu-stat">
                        <label>Total Reviews:</label>
                        <span>{bu.reviews}</span>
                      </div>
                      <div className="bu-stat">
                        <label>Avg Rating:</label>
                        <span>{bu.avgRating?.toFixed(1) || '0.0'}</span>
                      </div>
                      <div className="bu-stat">
                        <label>5-Star Reviews:</label>
                        <span>{bu.fiveStars}</span>
                      </div>
                      <div className="bu-stat">
                        <label>Success Rate:</label>
                        <span>
                          {bu.reviews > 0 
                            ? ((bu.fiveStars / bu.reviews) * 100).toFixed(1)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Recruiter Performance Details */}
          {recruiterAnalysis && recruiterAnalysis.overall_metrics && (
            <div className="stats-overview" style={{ marginTop: '2rem' }}>
              <div className="stat-card info">
                <div className="stat-icon">
                  <i className="fas fa-user-tie"></i>
                </div>
                <div className="stat-content">
                  <h3>Top Recruiter</h3>
                  <p className="stat-value" style={{ fontSize: '1.2rem' }}>
                    {recruiterAnalysis.top_performers?.[0]?.recruiter_name || 'N/A'}
                  </p>
                  <span className="stat-trend positive">
                    {recruiterAnalysis.top_performers?.[0]?.avg_rating?.toFixed(1) || '0'} avg rating
                  </span>
                </div>
              </div>

              <div className="stat-card warning">
                <div className="stat-icon">
                  <i className="fas fa-percentage"></i>
                </div>
                <div className="stat-content">
                  <h3>Overall Success Rate</h3>
                  <p className="stat-value">
                    {recruiterAnalysis.overall_metrics?.success_rate?.toFixed(1) || '0'}%
                  </p>
                  <span className="stat-trend neutral">
                    5-star review rate
                  </span>
                </div>
              </div>

              <div className="stat-card success">
                <div className="stat-icon">
                  <i className="fas fa-comment-dots"></i>
                </div>
                <div className="stat-content">
                  <h3>Total Comments</h3>
                  <p className="stat-value">
                    {commentsAnalytics?.total_comments || 0}
                  </p>
                  <span className="stat-trend positive">
                    {commentsAnalytics?.positive_percentage?.toFixed(0) || 0}% positive
                  </span>
                </div>
              </div>

              <div className="stat-card primary">
                <div className="stat-icon">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="stat-content">
                  <h3>Avg Response Time</h3>
                  <p className="stat-value">
                    {statistics?.response_metrics?.avg_days || 0}
                  </p>
                  <span className="stat-trend">days</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'all-reviews' && (
        <>
          {/* Filters Section - Redesigned */}
          <div className="filters-bar">
            <div className="filters-left">
              <div className="search-box">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="filters-right">
              <select
                className="filter-select"
                value={filters.stars}
                onChange={(e) => setFilters(prev => ({ ...prev, stars: e.target.value }))}
              >
                <option value="">All Ratings</option>
                <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                <option value="3">⭐⭐⭐ 3 Stars</option>
                <option value="2">⭐⭐ 2 Stars</option>
                <option value="1">⭐ 1 Star</option>
              </select>

              <select
                className="filter-select"
                value={filters.recruiter_id}
                onChange={(e) => setFilters(prev => ({ ...prev, recruiter_id: e.target.value }))}
              >
                <option value="">All Recruiters</option>
                {recruiters.map(recruiter => (
                  <option key={recruiter.user_id} value={recruiter.user_id}>
                    {recruiter.user_name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                className="filter-date"
                value={filters.date_from}
                onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                placeholder="From Date"
              />

              <input
                type="date"
                className="filter-date"
                value={filters.date_to}
                onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                placeholder="To Date"
              />

              <button 
                className="filter-reset-btn"
                onClick={handleResetFilters}
                title="Reset Filters"
              >
                <i className="fas fa-redo"></i>
              </button>
            </div>
          </div>

          {/* Reviews Table */}
          <div className="reviews-table-container">
            <div className="table-header">
              <h2>Reviews ({pagination.total_count})</h2>
              <span className="showing-text">
                Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total_count)} - {Math.min(pagination.page * pagination.limit, pagination.total_count)} of {pagination.total_count}
              </span>
            </div>

            <div className="table-wrapper">
              <table className="reviews-table">
                <thead>
                  <tr>
                    <th>Review Info</th>
                    <th>Candidate</th>
                    <th>Recruiter</th>
                    <th>Client & Role</th>
                    <th>Rating</th>
                    <th>Review Details</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.length > 0 ? (
                    reviews.map(review => (
                      <tr key={review.review_id}>
                        <td className="review-info">
                          <div className="review-meta">
                            <p className="review-id">#{review.ticket_number}</p>
                            <p className="review-date">{formatDateTime(review.created_at)}</p>
                            <p className="review-platform">{review.review_platform || 'Google'}</p>
                          </div>
                        </td>
                        <td className="candidate-info">
                          <div className="candidate-details">
                            <p className="candidate-name">{review.cfirstname} {review.clastname}</p>
                            <p className="candidate-start">
                              {review.start_date ? `Started: ${formatDate(review.start_date)}` : 'Start date N/A'}
                            </p>
                          </div>
                        </td>
                        <td className="recruiter-info">
                          <div className="recruiter-details">
                            <p className="recruiter-name">{review.recruiter_name}</p>
                            <p className="recruiter-id">{review.recruiter_employee_id}</p>
                          </div>
                        </td>
                        <td className="client-info">
                          <div className="client-details">
                            <p className="client-name">{review.client_name || 'N/A'}</p>
                            <p className="job-title">{review.job_title || 'N/A'}</p>
                            <p className="location">{review.geo_name || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="rating-cell">
                          <div className="rating-display">
                            <span className={`stars-badge ${getStarsBadgeClass(review.review_stars)}`}>
                              {getStarRating(review.review_stars)}
                            </span>
                            <span className="stars-number">{review.review_stars}/5</span>
                          </div>
                        </td>
                        <td className="review-content">
                          <div className="review-details">
                            {review.review_message ? (
                              <p className="review-message">
                                {review.review_message.length > 100 
                                  ? `${review.review_message.substring(0, 100)}...` 
                                  : review.review_message
                                }
                              </p>
                            ) : (
                              <p className="no-message">No review message</p>
                            )}
                            {review.review_url && (
                              <a 
                                href={review.review_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="review-link"
                              >
                                <i className="fas fa-external-link-alt"></i> View Original
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button
                              className="action-btn view"
                              onClick={() => handleViewDetails(review.review_id)}
                              title="View Full Details"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            {review.review_url && (
                              <a
                                href={review.review_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="action-btn external"
                                title="View on Platform"
                              >
                                <i className="fas fa-external-link-alt"></i>
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="empty-state">
                        <i className="fas fa-inbox"></i>
                        <h3>No reviews found</h3>
                        <p>Try adjusting your filters or search criteria</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="pagination-bar">
                <div className="pagination-info">
                  Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total_count)} - {Math.min(pagination.page * pagination.limit, pagination.total_count)} of {pagination.total_count} reviews
                </div>
                <div className="pagination-controls">
                  <button
                    className="page-btn"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  
                  <span className="page-info">
                    Page {pagination.page} of {pagination.total_pages}
                  </span>
                  
                  <button
                    className="page-btn"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.total_pages}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Review Details Modal */}
      {showDetailsModal && selectedReview && (
        <ReviewDetailsModal
          review={selectedReview}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
};

// Review Details Modal Component
const ReviewDetailsModal = ({ review, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content review-details-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <i className="fas fa-star"></i>
            Review Details - #{review.ticket_number}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="modal-body">
          <div className="review-overview">
            <div className="rating-display-large">
              <span className="stars-large">{'★'.repeat(review.review_stars || 0)}</span>
              <span className="rating-number">{review.review_stars}/5</span>
            </div>
            <div className="review-meta-large">
              <p><strong>Platform:</strong> {review.review_platform || 'Google'}</p>
              <p><strong>Received:</strong> {review.review_received_date || 'N/A'}</p>
              <p><strong>Requested:</strong> {review.review_request_date || 'N/A'}</p>
            </div>
          </div>

          <div className="details-grid">
            <div className="detail-section">
              <h4>
                <i className="fas fa-user"></i>
                Candidate Information
              </h4>
              <div className="detail-item">
                <label>Name:</label>
                <span>{review.cfirstname} {review.clastname}</span>
              </div>
              <div className="detail-item">
                <label>Email:</label>
                <span>{review.cemail}</span>
              </div>
              <div className="detail-item">
                <label>Job Title:</label>
                <span>{review.job_title || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Start Date:</label>
                <span>{review.start_date || 'N/A'}</span>
              </div>
            </div>

            <div className="detail-section">
              <h4>
                <i className="fas fa-user-tie"></i>
                Recruiter Information
              </h4>
              <div className="detail-item">
                <label>Name:</label>
                <span>{review.recruiter_name}</span>
              </div>
              <div className="detail-item">
                <label>Email:</label>
                <span>{review.recruiter_email}</span>
              </div>
              <div className="detail-item">
                <label>Employee ID:</label>
                <span>{review.recruiter_employee_id}</span>
              </div>
            </div>

            <div className="detail-section">
              <h4>
                <i className="fas fa-building"></i>
                Client & Location
              </h4>
              <div className="detail-item">
                <label>Client:</label>
                <span>{review.client_name || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Location:</label>
                <span>{review.geo_name || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Business Function:</label>
                <span>{review.bf_name || 'N/A'}</span>
              </div>
            </div>
          </div>

          {review.review_message && (
            <div className="review-message-section">
              <h4>
                <i className="fas fa-quote-left"></i>
                Review Message
              </h4>
              <div className="review-message-full">
                {review.review_message}
              </div>
            </div>
          )}

          {review.review_url && (
            <div className="review-link-section">
              <h4>
                <i className="fas fa-external-link-alt"></i>
                Original Review Link
              </h4>
              <a 
                href={review.review_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="review-link-full"
              >
                {review.review_url}
              </a>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            <i className="fas fa-times"></i> Close
          </button>
          {review.review_url && (
            <a 
              href={review.review_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <i className="fas fa-external-link-alt"></i> View on Platform
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReviewHistory;