import React, { useState, useEffect, useMemo } from 'react';
import { adminIncentiveAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import './AdminIncentives.css';

const AdminIncentives = () => {
  const [incentiveData, setIncentiveData] = useState(null);
  const [recruiterSummary, setRecruiterSummary] = useState([]);
  const [teamSummary, setTeamSummary] = useState([]);
  const [recruiterHistory, setRecruiterHistory] = useState({});
  const [loadingHistory, setLoadingHistory] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    filter_type: '30days',
    date_from: '',
    date_to: '',
    recruiter_id: '',
    bu_id: '',
    team_id: '',
    rating_min: '',
    rating_max: '',
    payment_status: '', // Filter for payment status
    page: 1,
    per_page: 50
  });
  const [selectedRecruiters, setSelectedRecruiters] = useState([]);
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('grouped');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [expandedGroups, setExpandedGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [historyView, setHistoryView] = useState({});
  const [paymentStatus, setPaymentStatus] = useState({}); // Track payment status for reviews

  useEffect(() => {
    fetchIncentiveData();
  }, [filters]);

  const fetchIncentiveData = async () => {
    setLoading(true);
    try {
      const response = await adminIncentiveAPI.calculateIncentives(filters);
      
      if (response.success && response.data) {
        const processedRecords = response.data.records?.map(record => ({
          ...record,
          // Use incentive_amount from backend which is 0 for non-eligible reviews
          amount: record.incentive_amount || 0,
          // Use eligibility status from backend
          incentive_eligibility: record.incentive_eligibility || (record.review_stars >= 4 ? 'eligible' : 'not_eligible'),
          payment_status: record.payment_status || 'unpaid',
          review_id: record.review_id || `${record.recruiter_id}_${record.candidate_id}_${Date.now()}`
        })) || [];
        
        // Initialize payment status tracking
        const statusMap = {};
        processedRecords.forEach(record => {
          statusMap[record.review_id] = record.payment_status;
        });
        setPaymentStatus(statusMap);
        
        // Calculate correct amounts based on payment status
        let totalPaidAmount = 0;
        let totalUnpaidAmount = 0;
        let paidCount = 0;
        let unpaidCount = 0;
        
        processedRecords.forEach(record => {
          if (record.payment_status === 'paid') {
            totalPaidAmount += 1000;
            paidCount++;
          } else {
            totalUnpaidAmount += 1000;
            unpaidCount++;
          }
        });
        
        setIncentiveData({
          ...response.data,
          records: processedRecords,
          total_reviews: processedRecords.length,
          paid_reviews: paidCount,
          unpaid_reviews: unpaidCount,
          total_amount_to_be_paid: totalUnpaidAmount, // Only unpaid amount needs to be paid
          total_paid_amount: totalPaidAmount,
          total_unpaid_amount: totalUnpaidAmount
        });
      }
      
      // Fetch summary data
      const [recruiters, teams] = await Promise.all([
        adminIncentiveAPI.getRecruiterSummary(filters),
        adminIncentiveAPI.getTeamSummary(filters)
      ]);
      
      const processedRecruiters = recruiters.data?.recruiters?.map(r => {
        const paidReviews = r.paid_reviews || 0;
        const unpaidReviews = r.total_reviews - paidReviews;
        return {
          ...r,
          paid_reviews: paidReviews,
          unpaid_reviews: unpaidReviews,
          total_amount: (r.total_reviews || 0) * 1000,
          paid_amount: paidReviews * 1000,
          unpaid_amount: unpaidReviews * 1000
        };
      }) || [];
      
      const processedTeams = teams.data?.teams?.map(t => {
        const paidReviews = t.paid_reviews || 0;
        const unpaidReviews = t.total_reviews - paidReviews;
        return {
          ...t,
          paid_reviews: paidReviews,
          unpaid_reviews: unpaidReviews,
          total_amount: (t.total_reviews || 0) * 1000,
          paid_amount: paidReviews * 1000,
          unpaid_amount: unpaidReviews * 1000
        };
      }) || [];
      
      setRecruiterSummary(processedRecruiters);
      setTeamSummary(processedTeams);
      
    } catch (error) {
      toast.error('Failed to fetch incentive data');
      console.error('Error fetching incentive data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark reviews as paid
  const handleMarkAsPaid = async (reviewIds = null, recruiterIds = null) => {
    try {
      let updatedReviewIds = [];
      
      if (reviewIds && reviewIds.length > 0) {
        updatedReviewIds = reviewIds;
      } else if (recruiterIds && recruiterIds.length > 0) {
        updatedReviewIds = incentiveData.records
          .filter(r => recruiterIds.includes(r.recruiter_id) && paymentStatus[r.review_id] !== 'paid')
          .map(r => r.review_id);
      } else if (selectedReviews.length > 0) {
        updatedReviewIds = selectedReviews.filter(id => paymentStatus[id] !== 'paid');
      } else if (selectedRecruiters.length > 0) {
        updatedReviewIds = incentiveData.records
          .filter(r => selectedRecruiters.includes(r.recruiter_id) && paymentStatus[r.review_id] !== 'paid')
          .map(r => r.review_id);
      } else {
        toast.error('Please select reviews or recruiters to mark as paid');
        return;
      }

      if (updatedReviewIds.length === 0) {
        toast.info('All selected reviews are already marked as paid');
        return;
      }

      const response = await adminIncentiveAPI.updatePaymentStatus({
        review_ids: updatedReviewIds,
        payment_status: 'paid',
        payment_date: new Date().toISOString(),
        payment_notes: 'Marked as paid by admin'
      });

      if (response.success) {
        // Update local payment status
        const newPaymentStatus = { ...paymentStatus };
        updatedReviewIds.forEach(id => {
          newPaymentStatus[id] = 'paid';
        });
        setPaymentStatus(newPaymentStatus);
        
        toast.success(`Successfully marked ${updatedReviewIds.length} reviews as paid`);
        setSelectedReviews([]);
        setSelectedRecruiters([]);
        fetchIncentiveData(); // Refresh data
      }
    } catch (error) {
      toast.error('Failed to update payment status');
      console.error('Error marking as paid:', error);
    }
  };

  // Mark reviews as unpaid
  const handleMarkAsUnpaid = async (reviewIds = null, recruiterIds = null) => {
    try {
      let updatedReviewIds = [];
      
      if (reviewIds && reviewIds.length > 0) {
        updatedReviewIds = reviewIds;
      } else if (recruiterIds && recruiterIds.length > 0) {
        updatedReviewIds = incentiveData.records
          .filter(r => recruiterIds.includes(r.recruiter_id) && paymentStatus[r.review_id] === 'paid')
          .map(r => r.review_id);
      } else if (selectedReviews.length > 0) {
        updatedReviewIds = selectedReviews.filter(id => paymentStatus[id] === 'paid');
      } else if (selectedRecruiters.length > 0) {
        updatedReviewIds = incentiveData.records
          .filter(r => selectedRecruiters.includes(r.recruiter_id) && paymentStatus[r.review_id] === 'paid')
          .map(r => r.review_id);
      } else {
        toast.error('Please select reviews or recruiters to mark as unpaid');
        return;
      }

      if (updatedReviewIds.length === 0) {
        toast.info('All selected reviews are already marked as unpaid');
        return;
      }

      const response = await adminIncentiveAPI.updatePaymentStatus({
        review_ids: updatedReviewIds,
        payment_status: 'unpaid',
        payment_notes: 'Marked as unpaid by admin'
      });

      if (response.success) {
        const newPaymentStatus = { ...paymentStatus };
        updatedReviewIds.forEach(id => {
          newPaymentStatus[id] = 'unpaid';
        });
        setPaymentStatus(newPaymentStatus);
        
        toast.success(`Successfully marked ${updatedReviewIds.length} reviews as unpaid`);
        setSelectedReviews([]);
        setSelectedRecruiters([]);
        fetchIncentiveData();
      }
    } catch (error) {
      toast.error('Failed to update payment status');
      console.error('Error marking as unpaid:', error);
    }
  };

  // Fetch history for a specific recruiter
  const fetchRecruiterHistory = async (recruiterId) => {
    setLoadingHistory(prev => ({ ...prev, [recruiterId]: true }));
    try {
      const response = await adminIncentiveAPI.getRecruiterHistory({
        recruiter_id: recruiterId,
        months: 6
      });
      
      if (response?.success && response?.data?.history) {
        setRecruiterHistory(prev => ({
          ...prev,
          [recruiterId]: response.data.history
        }));
      } else if (response?.history) {
        setRecruiterHistory(prev => ({
          ...prev,
          [recruiterId]: response.history
        }));
      } else {
        setRecruiterHistory(prev => ({
          ...prev,
          [recruiterId]: []
        }));
      }
    } catch (error) {
      console.error('Error fetching recruiter history:', error);
      setRecruiterHistory(prev => ({
        ...prev,
        [recruiterId]: []
      }));
    } finally {
      setLoadingHistory(prev => ({ ...prev, [recruiterId]: false }));
    }
  };

  // Group data by recruiter with correct payment calculations
  const groupedByRecruiter = useMemo(() => {
    if (!incentiveData?.records) return [];
    
    const grouped = {};
    incentiveData.records.forEach(record => {
      const key = record.recruiter_id;
      if (!grouped[key]) {
        grouped[key] = {
          recruiter_id: record.recruiter_id,
          recruiter_name: record.recruiter_name,
          employee_id: record.employee_id,
          team_name: record.team_name,
          business_unit: record.business_unit,
          reviews: [],
          total_reviews: 0,
          paid_reviews: 0,
          unpaid_reviews: 0,
          total_amount: 0,
          paid_amount: 0,
          unpaid_amount: 0,
          avg_rating: 0
        };
      }
      
      grouped[key].reviews.push(record);
      grouped[key].total_reviews += 1;
      grouped[key].total_amount = grouped[key].total_reviews * 1000;
      
      const isPaid = paymentStatus[record.review_id] === 'paid' || record.payment_status === 'paid';
      if (isPaid) {
        grouped[key].paid_reviews += 1;
        grouped[key].paid_amount += 1000;
      } else {
        grouped[key].unpaid_reviews += 1;
        grouped[key].unpaid_amount += 1000;
      }
    });

    // Calculate average ratings
    Object.values(grouped).forEach(group => {
      const totalRating = group.reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
      group.avg_rating = group.reviews.length > 0 ? totalRating / group.reviews.length : 0;
    });

    return Object.values(grouped);
  }, [incentiveData, paymentStatus]);

  // Calculate total unique recruiters
  const totalUniqueRecruiters = useMemo(() => {
    return groupedByRecruiter.length;
  }, [groupedByRecruiter]);

  // Filter grouped data based on search term
  const filteredGroupedData = useMemo(() => {
    return groupedByRecruiter.filter(group =>
      group.recruiter_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [groupedByRecruiter, searchTerm]);

  // Sorting function
  const sortData = (data, key, direction) => {
    return [...data].sort((a, b) => {
      const aVal = a[key] || 0;
      const bVal = b[key] || 0;
      if (direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  };

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const sortedGroupedData = useMemo(() => {
    if (!sortConfig.key) return filteredGroupedData;
    return sortData(filteredGroupedData, sortConfig.key, sortConfig.direction);
  }, [filteredGroupedData, sortConfig]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1
    }));
  };

  const handleExport = async () => {
    try {
      const blob = await adminIncentiveAPI.exportReport({
        ...filters,
        include_payment_status: true
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `incentive_report_${new Date().toISOString().split('T')[0]}.csv`;
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

  const handleGeneratePaymentReport = async () => {
    try {
      const currentDate = new Date();
      const response = await adminIncentiveAPI.generatePaymentReport({
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        include_payment_status: true
      });
      
      if (response.success && response.data) {
        toast.success('Payment report generated successfully');
        if (response.data.summary) {
          const { total_recruiters, total_reviews, paid_amount, unpaid_amount } = response.data.summary;
          toast.success(`Report: ${total_recruiters} recruiters, ${total_reviews} reviews, To be paid: ₹${unpaid_amount?.toLocaleString()}`);
        }
      }
    } catch (error) {
      toast.error('Failed to generate payment report');
    }
  };

  const toggleRecruiterSelection = (recruiterId) => {
    setSelectedRecruiters(prev => {
      if (prev.includes(recruiterId)) {
        return prev.filter(id => id !== recruiterId);
      }
      return [...prev, recruiterId];
    });
  };

  const toggleReviewSelection = (reviewId) => {
    setSelectedReviews(prev => {
      if (prev.includes(reviewId)) {
        return prev.filter(id => id !== reviewId);
      }
      return [...prev, reviewId];
    });
  };

  const toggleGroupExpansion = (recruiterId) => {
    setExpandedGroups(prev => {
      if (prev.includes(recruiterId)) {
        return prev.filter(id => id !== recruiterId);
      }
      if (!recruiterHistory[recruiterId] && !loadingHistory[recruiterId]) {
        fetchRecruiterHistory(recruiterId);
      }
      return [...prev, recruiterId];
    });
  };

  const toggleHistoryView = (recruiterId) => {
    setHistoryView(prev => ({
      ...prev,
      [recruiterId]: !prev[recruiterId]
    }));
    
    if (!recruiterHistory[recruiterId] && !loadingHistory[recruiterId]) {
      fetchRecruiterHistory(recruiterId);
    }
  };

  const selectAllRecruiters = (checked) => {
    if (checked && sortedGroupedData) {
      const uniqueRecruiters = sortedGroupedData.map(g => g.recruiter_id);
      setSelectedRecruiters(uniqueRecruiters);
    } else {
      setSelectedRecruiters([]);
    }
  };

  const selectAllReviews = (checked) => {
    if (checked && incentiveData?.records) {
      const allReviewIds = incentiveData.records.map(r => r.review_id);
      setSelectedReviews(allReviewIds);
    } else {
      setSelectedReviews([]);
    }
  };

  const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined) return '0';
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '0';
    return num.toFixed(decimals);
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0';
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString();
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return '#10b981';
    if (rating >= 3.5) return '#3b82f6';
    if (rating >= 2.5) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="admin-incentives-container">
      {/* Header Section */}
      <div className="incentives-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Review Incentive Management</h1>
            <p className="subtitle">Track and manage recruiter review incentives with payment status</p>
          </div>
          <div className="header-actions">
            <button onClick={handleExport} className="action-btn export-btn">
              <i className="fas fa-download"></i>
              <span>Export Report</span>
            </button>
            <button onClick={handleGeneratePaymentReport} className="action-btn payment-btn">
              <i className="fas fa-file-invoice-dollar"></i>
              <span>Payment Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards - Updated with correct insights */}
      <div className="stats-cards">
        <div className="stat-card total-reviews">
          <div className="stat-icon">
            <i className="fas fa-clipboard-check"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{incentiveData?.total_reviews || 0}</div>
            <div className="stat-label">Total Reviews</div>
            <div className="stat-subinfo">
              <span className="paid">{incentiveData?.paid_reviews || 0} Paid</span>
              <span className="unpaid">{incentiveData?.unpaid_reviews || 0} Unpaid</span>
            </div>
          </div>
        </div>
        
        <div className="stat-card total-recruiters">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{totalUniqueRecruiters}</div>
            <div className="stat-label">Total Recruiters</div>
          </div>
        </div>
        
        <div className="stat-card amount-to-pay">
          <div className="stat-icon">
            <i className="fas fa-hand-holding-usd"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">₹{(incentiveData?.total_unpaid_amount || 0).toLocaleString()}</div>
            <div className="stat-label">Amount to be Paid</div>
            <div className="stat-subinfo pending">Pending Payment</div>
          </div>
        </div>
        
        <div className="stat-card paid-amount">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">₹{(incentiveData?.total_paid_amount || 0).toLocaleString()}</div>
            <div className="stat-label">Already Paid</div>
            <div className="stat-subinfo completed">Completed</div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-container">
        <div className="filters-header">
          <h3><i className="fas fa-filter"></i> Filters</h3>
          <button className="reset-filters" onClick={() => window.location.reload()}>
            <i className="fas fa-redo"></i> Reset
          </button>
        </div>
        <div className="filters-grid">
          <div className="filter-item">
            <label>Time Period</label>
            <select 
              name="filter_type" 
              value={filters.filter_type}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="current_quarter">Current Quarter</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {filters.filter_type === 'custom' && (
            <>
              <div className="filter-item">
                <label>From Date</label>
                <input 
                  type="date" 
                  name="date_from"
                  value={filters.date_from}
                  onChange={handleFilterChange}
                  className="filter-input"
                />
              </div>
              <div className="filter-item">
                <label>To Date</label>
                <input 
                  type="date" 
                  name="date_to"
                  value={filters.date_to}
                  onChange={handleFilterChange}
                  className="filter-input"
                />
              </div>
            </>
          )}

          <div className="filter-item">
            <label>Payment Status</label>
            <select 
              name="payment_status"
              value={filters.payment_status}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Min Rating</label>
            <select 
              name="rating_min"
              value={filters.rating_min}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All</option>
              <option value="1">1+ Stars</option>
              <option value="2">2+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="4">4+ Stars</option>
              <option value="5">5 Stars</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Max Rating</label>
            <select 
              name="rating_max"
              value={filters.rating_max}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All</option>
              <option value="1">Up to 1 Star</option>
              <option value="2">Up to 2 Stars</option>
              <option value="3">Up to 3 Stars</option>
              <option value="4">Up to 4 Stars</option>
              <option value="5">Up to 5 Stars</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-section">
        <div className="tabs-header">
          <button 
            className={`tab-btn ${activeTab === 'grouped' ? 'active' : ''}`}
            onClick={() => setActiveTab('grouped')}
          >
            <i className="fas fa-layer-group"></i>
            Grouped by Recruiter
          </button>
          <button 
            className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            <i className="fas fa-list"></i>
            Detailed View
          </button>
          <button 
            className={`tab-btn ${activeTab === 'recruiter' ? 'active' : ''}`}
            onClick={() => setActiveTab('recruiter')}
          >
            <i className="fas fa-user-tie"></i>
            Recruiter Summary
          </button>
          <button 
            className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            <i className="fas fa-users-cog"></i>
            Team Summary
          </button>
        </div>

        {/* Search and Actions Bar */}
        {activeTab === 'grouped' && (
          <div className="search-actions-bar">
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search recruiters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="bulk-actions">
              {selectedRecruiters.length > 0 && (
                <>
                  <span className="selected-count">
                    <i className="fas fa-check-circle"></i>
                    {selectedRecruiters.length} recruiters selected
                  </span>
                  <button onClick={() => handleMarkAsPaid()} className="payment-status-btn paid">
                    <i className="fas fa-check-double"></i>
                    Mark as Paid
                  </button>
                  <button onClick={() => handleMarkAsUnpaid()} className="payment-status-btn unpaid">
                    <i className="fas fa-times-circle"></i>
                    Mark as Unpaid
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
          </div>
          <p className="loading-text">Loading incentive data...</p>
        </div>
      ) : (
        <div className="content-wrapper">
          {activeTab === 'grouped' && (
            <div className="grouped-view">
              <div className="grouped-header">
                <div className="select-all">
                  <input 
                    type="checkbox" 
                    id="selectAll"
                    onChange={(e) => selectAllRecruiters(e.target.checked)}
                    checked={selectedRecruiters.length > 0 && 
                            selectedRecruiters.length === sortedGroupedData.length}
                  />
                  <label htmlFor="selectAll">Select All</label>
                </div>
                <div className="sort-controls">
                  <button 
                    className={`sort-btn ${sortConfig.key === 'recruiter_name' ? 'active' : ''}`}
                    onClick={() => handleSort('recruiter_name')}
                  >
                    Name
                    {sortConfig.key === 'recruiter_name' && (
                      <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </button>
                  <button 
                    className={`sort-btn ${sortConfig.key === 'total_reviews' ? 'active' : ''}`}
                    onClick={() => handleSort('total_reviews')}
                  >
                    Reviews
                    {sortConfig.key === 'total_reviews' && (
                      <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </button>
                  <button 
                    className={`sort-btn ${sortConfig.key === 'unpaid_amount' ? 'active' : ''}`}
                    onClick={() => handleSort('unpaid_amount')}
                  >
                    Unpaid
                    {sortConfig.key === 'unpaid_amount' && (
                      <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </button>
                </div>
              </div>

              <div className="recruiter-cards">
                {sortedGroupedData.length > 0 ? (
                  sortedGroupedData.map(group => (
                    <div key={group.recruiter_id} className="recruiter-card">
                      <div className="recruiter-card-header">
                        <div className="recruiter-select">
                          <input
                            type="checkbox"
                            checked={selectedRecruiters.includes(group.recruiter_id)}
                            onChange={() => toggleRecruiterSelection(group.recruiter_id)}
                          />
                        </div>
                        <div className="recruiter-info">
                          <h3>{group.recruiter_name}</h3>
                          <div className="recruiter-meta">
                            <span className="employee-id">
                              <i className="fas fa-id-badge"></i>
                              {group.employee_id}
                            </span>
                            <span className="team-name">
                              <i className="fas fa-users"></i>
                              {group.team_name}
                            </span>
                            <span className="bu-name">
                              <i className="fas fa-building"></i>
                              {group.business_unit}
                            </span>
                          </div>
                        </div>
                        <div className="expand-controls">
                          <button 
                            className="payment-action-btn mark-paid"
                            onClick={() => handleMarkAsPaid(null, [group.recruiter_id])}
                            title="Mark all unpaid as paid"
                            disabled={group.unpaid_reviews === 0}
                          >
                            <i className="fas fa-check-circle"></i>
                          </button>
                          <button 
                            className="history-btn"
                            onClick={() => toggleHistoryView(group.recruiter_id)}
                            title="View History"
                          >
                            <i className="fas fa-chart-line"></i>
                          </button>
                          <button 
                            className="expand-btn"
                            onClick={() => toggleGroupExpansion(group.recruiter_id)}
                          >
                            <i className={`fas fa-chevron-${expandedGroups.includes(group.recruiter_id) ? 'up' : 'down'}`}></i>
                          </button>
                        </div>
                      </div>

                      <div className="recruiter-stats">
                        <div className="stat-item">
                          <span className="stat-label">Total Reviews</span>
                          <span className="stat-value reviews-count">{group.total_reviews}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Paid</span>
                          <span className="stat-value paid-count">{group.paid_reviews}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Unpaid</span>
                          <span className="stat-value unpaid-count">{group.unpaid_reviews}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">To be Paid</span>
                          <span className="stat-value unpaid-amount-value">₹{group.unpaid_amount.toLocaleString()}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Already Paid</span>
                          <span className="stat-value paid-amount-value">₹{group.paid_amount.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* History View */}
                      {historyView[group.recruiter_id] && (
                        <div className="recruiter-history">
                          <div className="history-header">
                            <h4><i className="fas fa-history"></i> 6-Month History</h4>
                          </div>
                          {loadingHistory[group.recruiter_id] ? (
                            <div className="history-loading">
                              <div className="spinner-ring"></div>
                              <p>Loading history...</p>
                            </div>
                          ) : recruiterHistory[group.recruiter_id]?.length > 0 ? (
                            <div className="history-chart">
                              {recruiterHistory[group.recruiter_id].map((month, index) => {
                                const maxReviews = Math.max(
                                  ...(recruiterHistory[group.recruiter_id]?.map(h => h.review_count || h.total_reviews || 0) || [1]),
                                  1
                                );
                                const reviewCount = month.review_count || month.total_reviews || 0;
                                const paidCount = month.paid_reviews || 0;
                                const unpaidCount = month.unpaid_reviews || reviewCount - paidCount;
                                const monthRating = month.avg_rating || 0;
                                
                                return (
                                  <div key={index} className="history-item">
                                    <div className="month-label">{month.month || month.month_year || '-'}</div>
                                    <div className="month-bar">
                                      <div 
                                        className="bar-fill"
                                        style={{ 
                                          width: `${(reviewCount / maxReviews) * 100}%`,
                                          background: `linear-gradient(135deg, ${getRatingColor(monthRating)} 0%, ${getRatingColor(monthRating)}dd 100%)`
                                        }}
                                      />
                                    </div>
                                    <div className="month-details">
                                      <span className="review-count">{reviewCount} reviews</span>
                                      <span className="paid-status">P:{paidCount}/U:{unpaidCount}</span>
                                      <span className="amount">₹{formatCurrency(unpaidCount * 1000)}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="no-history-data">
                              <i className="fas fa-chart-line"></i>
                              <p>No historical data available</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Detailed Reviews Table */}
                      {expandedGroups.includes(group.recruiter_id) && (
                        <div className="recruiter-reviews">
                          <div className="reviews-header">
                            <h4>Review Details</h4>
                            <div className="review-actions">
                              <button 
                                className="select-all-reviews-btn"
                                onClick={() => {
                                  const reviewIds = group.reviews.map(r => r.review_id);
                                  const allSelected = reviewIds.every(id => selectedReviews.includes(id));
                                  if (allSelected) {
                                    setSelectedReviews(prev => prev.filter(id => !reviewIds.includes(id)));
                                  } else {
                                    setSelectedReviews(prev => [...new Set([...prev, ...reviewIds])]);
                                  }
                                }}
                              >
                                Select All
                              </button>
                            </div>
                          </div>
                          <table className="reviews-table">
                            <thead>
                              <tr>
                                <th width="40">
                                  <input
                                    type="checkbox"
                                    onChange={(e) => {
                                      const reviewIds = group.reviews.map(r => r.review_id);
                                      if (e.target.checked) {
                                        setSelectedReviews(prev => [...new Set([...prev, ...reviewIds])]);
                                      } else {
                                        setSelectedReviews(prev => prev.filter(id => !reviewIds.includes(id)));
                                      }
                                    }}
                                    checked={group.reviews.every(r => selectedReviews.includes(r.review_id))}
                                  />
                                </th>
                                <th>Date</th>
                                <th>Candidate</th>
                                <th>Rating</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.reviews.map((review, idx) => {
                                const isPaid = paymentStatus[review.review_id] === 'paid' || review.payment_status === 'paid';
                                return (
                                  <tr key={idx}>
                                    <td>
                                      <input
                                        type="checkbox"
                                        checked={selectedReviews.includes(review.review_id)}
                                        onChange={() => toggleReviewSelection(review.review_id)}
                                      />
                                    </td>
                                    <td>{review.review_date}</td>
                                    <td>{review.candidate_name}</td>
                                    <td>
                                      <div className="rating-stars" style={{color: getRatingColor(review.rating)}}>
                                        {[...Array(5)].map((_, i) => (
                                          <i key={i} className={`fas fa-star ${i < review.rating ? '' : 'empty'}`}></i>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="amount-cell">₹1,000</td>
                                    <td>
                                      <span className={`payment-badge ${isPaid ? 'paid' : 'unpaid'}`}>
                                        {isPaid ? 'paid' : 'unpaid'}
                                      </span>
                                    </td>
                                    <td>
                                      {!isPaid ? (
                                        <button 
                                          className="mini-payment-btn paid"
                                          onClick={() => handleMarkAsPaid([review.review_id])}
                                          title="Mark as paid"
                                        >
                                          <i className="fas fa-check"></i>
                                        </button>
                                      ) : (
                                        <button 
                                          className="mini-payment-btn unpaid"
                                          onClick={() => handleMarkAsUnpaid([review.review_id])}
                                          title="Mark as unpaid"
                                        >
                                          <i className="fas fa-times"></i>
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          {selectedReviews.filter(id => group.reviews.some(r => r.review_id === id)).length > 0 && (
                            <div className="review-bulk-actions">
                              <span className="selected-reviews-count">
                                {selectedReviews.filter(id => group.reviews.some(r => r.review_id === id)).length} reviews selected
                              </span>
                              <button 
                                onClick={() => handleMarkAsPaid(selectedReviews.filter(id => group.reviews.some(r => r.review_id === id)))}
                                className="review-action-btn paid"
                              >
                                Mark Selected as Paid
                              </button>
                              <button 
                                onClick={() => handleMarkAsUnpaid(selectedReviews.filter(id => group.reviews.some(r => r.review_id === id)))}
                                className="review-action-btn unpaid"
                              >
                                Mark Selected as Unpaid
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-data">
                    <i className="fas fa-inbox"></i>
                    <p>No incentive data found for the selected period</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="details-view">
              <div className="details-header">
                <div className="select-all">
                  <input 
                    type="checkbox" 
                    id="selectAllDetails"
                    onChange={(e) => selectAllReviews(e.target.checked)}
                    checked={selectedReviews.length > 0 && 
                            selectedReviews.length === incentiveData?.records?.length}
                  />
                  <label htmlFor="selectAllDetails">Select All</label>
                </div>
                {selectedReviews.length > 0 && (
                  <div className="details-bulk-actions">
                    <span className="selected-count">
                      {selectedReviews.length} reviews selected
                    </span>
                    <button onClick={() => handleMarkAsPaid(selectedReviews)} className="payment-status-btn paid">
                      Mark as Paid
                    </button>
                    <button onClick={() => handleMarkAsUnpaid(selectedReviews)} className="payment-status-btn unpaid">
                      Mark as Unpaid
                    </button>
                  </div>
                )}
              </div>
              <div className="table-wrapper">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th width="40">
                        <input
                          type="checkbox"
                          onChange={(e) => selectAllReviews(e.target.checked)}
                          checked={selectedReviews.length > 0 && 
                                  selectedReviews.length === incentiveData?.records?.length}
                        />
                      </th>
                      <th>Week</th>
                      <th>Date</th>
                      <th>Recruiter</th>
                      <th>Employee ID</th>
                      <th>Candidate</th>
                      <th>Team</th>
                      <th>BU</th>
                      <th>Rating</th>
                      <th>Amount</th>
                      <th>Payment Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incentiveData?.records?.length > 0 ? (
                      incentiveData.records.map((record, index) => {
                        const isPaid = paymentStatus[record.review_id] === 'paid' || record.payment_status === 'paid';
                        return (
                          <tr key={index}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedReviews.includes(record.review_id)}
                                onChange={() => toggleReviewSelection(record.review_id)}
                              />
                            </td>
                            <td className="week-cell">{record.week_no || '-'}</td>
                            <td className="date-cell">{record.review_date || '-'}</td>
                            <td className="recruiter-cell">{record.recruiter_name || '-'}</td>
                            <td className="emp-id-cell">{record.employee_id || '-'}</td>
                            <td className="candidate-cell">{record.candidate_name || '-'}</td>
                            <td className="team-cell">{record.team_name || '-'}</td>
                            <td className="bu-cell">{record.business_unit || '-'}</td>
                            <td className="rating-cell">
                              <div className="rating-display" style={{color: getRatingColor(record.rating)}}>
                                {[...Array(5)].map((_, i) => (
                                  <i key={i} className={`fas fa-star ${i < (record.rating || 0) ? '' : 'empty'}`}></i>
                                ))}
                              </div>
                            </td>
                            <td className="amount-cell">₹1,000</td>
                            <td>
                              <span className={`payment-badge ${isPaid ? 'paid' : 'unpaid'}`}>
                                {isPaid ? 'paid' : 'unpaid'}
                              </span>
                            </td>
                            <td className="action-cell">
                              {!isPaid ? (
                                <button 
                                  className="mini-payment-btn paid"
                                  onClick={() => handleMarkAsPaid([record.review_id])}
                                  title="Mark as paid"
                                >
                                  <i className="fas fa-check"></i> Paid
                                </button>
                              ) : (
                                <button 
                                  className="mini-payment-btn unpaid"
                                  onClick={() => handleMarkAsUnpaid([record.review_id])}
                                  title="Mark as unpaid"
                                >
                                  <i className="fas fa-times"></i> Unpaid
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="12" className="no-data-cell">
                          <div className="no-data">
                            <i className="fas fa-inbox"></i>
                            <p>No incentive data found</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'recruiter' && (
            <div className="recruiter-summary">
              <div className="table-wrapper">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Recruiter Name</th>
                      <th>Team</th>
                      <th>BU</th>
                      <th>Total Reviews</th>
                      <th>Paid</th>
                      <th>Unpaid</th>
                      <th>To be Paid</th>
                      <th>Already Paid</th>
                      <th>History</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recruiterSummary.length > 0 ? (
                      recruiterSummary.map((recruiter, index) => (
                        <tr key={index}>
                          <td className="emp-id-cell">{recruiter.employee_id || '-'}</td>
                          <td className="recruiter-cell">{recruiter.recruiter_name || '-'}</td>
                          <td className="team-cell">{recruiter.team_name || '-'}</td>
                          <td className="bu-cell">{recruiter.bu_name || '-'}</td>
                          <td className="reviews-cell">{recruiter.total_reviews || 0}</td>
                          <td className="paid-cell">{recruiter.paid_reviews || 0}</td>
                          <td className="unpaid-cell">{recruiter.unpaid_reviews || 0}</td>
                          <td className="unpaid-amount-cell">₹{(recruiter.unpaid_amount || 0).toLocaleString()}</td>
                          <td className="paid-amount-cell">₹{(recruiter.paid_amount || 0).toLocaleString()}</td>
                          <td className="action-cell">
                            <button 
                              className="view-history-btn"
                              onClick={() => toggleHistoryView(recruiter.recruiter_id || recruiter.employee_id)}
                              title="View History"
                            >
                              <i className="fas fa-chart-line"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="no-data-cell">
                          <div className="no-data">
                            <i className="fas fa-inbox"></i>
                            <p>No recruiter summary data available</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="team-summary">
              <div className="table-wrapper">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Team Name</th>
                      <th>Business Unit</th>
                      <th>Total Recruiters</th>
                      <th>Total Reviews</th>
                      <th>Paid Reviews</th>
                      <th>Unpaid Reviews</th>
                      <th>To be Paid</th>
                      <th>Already Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamSummary.length > 0 ? (
                      teamSummary.map((team, index) => (
                        <tr key={index}>
                          <td className="team-cell">{team.team_name || 'No Team Assigned'}</td>
                          <td className="bu-cell">{team.bu_name || '-'}</td>
                          <td className="recruiters-cell">{team.total_recruiters || 0}</td>
                          <td className="reviews-cell">{team.total_reviews || 0}</td>
                          <td className="paid-cell">{team.paid_reviews || 0}</td>
                          <td className="unpaid-cell">{team.unpaid_reviews || 0}</td>
                          <td className="unpaid-amount-cell">₹{(team.unpaid_amount || 0).toLocaleString()}</td>
                          <td className="paid-amount-cell">₹{(team.paid_amount || 0).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="no-data-cell">
                          <div className="no-data">
                            <i className="fas fa-inbox"></i>
                            <p>No team summary data available</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminIncentives;