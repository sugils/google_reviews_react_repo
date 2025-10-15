import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Calendar, User, Star, Eye, 
  Download, ExternalLink, CheckCircle, Clock,
  BarChart3, TrendingUp, Award, RefreshCw,
  SortAsc, SortDesc, X, MessageSquare, AlertTriangle
} from 'lucide-react';
import './reviewHistory.css';
import { 
  getReviewTickets, 
  getCandidateComments, 
  addCandidateComment 
} from '../../services/api';
import { toast } from 'react-hot-toast';

const ReviewHistory = () => {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'review_received_date', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);

  // Comment Modal States
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentReview, setCommentReview] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentReason, setCommentReason] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [reviewComments, setReviewComments] = useState({});

  // Comment reasons for reviews
  const commentReasons = [
    { value: 'follow_up_needed', label: 'Follow-up needed with candidate' },
    { value: 'review_quality_concern', label: 'Review quality concern' },
    { value: 'positive_feedback', label: 'Positive feedback to share' },
    { value: 'process_improvement', label: 'Process improvement note' },
    { value: 'client_feedback', label: 'Client feedback received' },
    { value: 'candidate_feedback', label: 'Additional candidate feedback' },
    { value: 'verification_needed', label: 'Review verification needed' },
    { value: 'other', label: 'Other comment' }
  ];

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    filterReviews();
  }, [reviews, searchTerm, statusFilter, ratingFilter, platformFilter, sortConfig, reviewComments]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const response = await getReviewTickets();
      if (response.success) {
        // Filter to show only completed reviews (review_received or closed)
        const completedReviews = response.data.filter(ticket => 
          (ticket.ticket_status === 'review_received' || ticket.ticket_status === 'closed') &&
          ticket.review_stars // Only show tickets that have review details
        );
        setReviews(completedReviews);
        
        // Fetch comments for each review
        const commentsPromises = completedReviews.map(async (review) => {
          try {
            const commentsResponse = await getCandidateComments(review.candidate_id);
            return {
              candidateId: review.candidate_id,
              comments: commentsResponse.success ? commentsResponse.data : []
            };
          } catch (error) {
            return { candidateId: review.candidate_id, comments: [] };
          }
        });
        
        const commentsResults = await Promise.all(commentsPromises);
        const commentsMap = {};
        commentsResults.forEach(({ candidateId, comments }) => {
          commentsMap[candidateId] = comments;
        });
        setReviewComments(commentsMap);
      } else {
        toast.error('Failed to load review history');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load review history');
    } finally {
      setIsLoading(false);
    }
  };

  const filterReviews = () => {
    let filtered = [...reviews];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(review => 
        review.candidate_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.cemail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.review_message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'has_comments') {
        filtered = filtered.filter(review => hasComments(review));
      } else {
        filtered = filtered.filter(review => review.ticket_status === statusFilter);
      }
    }

    // Filter by rating
    if (ratingFilter !== 'all') {
      const rating = parseInt(ratingFilter);
      filtered = filtered.filter(review => review.review_stars === rating);
    }

    // Filter by platform
    if (platformFilter !== 'all') {
      filtered = filtered.filter(review => review.review_platform === platformFilter);
    }

    // Sort reviews
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'candidate_full_name') {
          aValue = aValue || `${a.cfirstname || ''} ${a.clastname || ''}`.trim();
          bValue = bValue || `${b.cfirstname || ''} ${b.clastname || ''}`.trim();
        }

        if (sortConfig.key === 'review_received_date') {
          aValue = new Date(aValue || 0);
          bValue = new Date(bValue || 0);
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredReviews(filtered);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (column) => {
    if (sortConfig.key !== column) return <SortAsc size={14} className="text-gray-400" />;
    return sortConfig.direction === 'asc' ? 
      <SortAsc size={14} className="text-indigo-600" /> : 
      <SortDesc size={14} className="text-indigo-600" />;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setRatingFilter('all');
    setPlatformFilter('all');
    setSortConfig({ key: 'review_received_date', direction: 'desc' });
  };

  // Check if review has comments
  const hasComments = (review) => {
    const comments = reviewComments[review.candidate_id] || [];
    return comments.length > 0;
  };

  // Comment Modal Functions
  const handleAddComment = (review) => {
    setCommentReview(review);
    setCommentText('');
    setCommentReason('');
    setShowCommentModal(true);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    if (!commentReason) {
      toast.error('Please select a reason');
      return;
    }

    setIsAddingComment(true);

    try {
      const commentData = {
        candidate_id: commentReview.candidate_id,
        comment_text: commentText.trim(),
        comment_reason: commentReason,
        comment_type: 'review_follow_up',
        related_ticket_id: commentReview.ticket_id
      };

      const response = await addCandidateComment(commentData);

      if (response.success) {
        toast.success('Comment added successfully');
        
        // Update local comments state
        const candidateId = commentReview.candidate_id;
        setReviewComments(prev => ({
          ...prev,
          [candidateId]: [...(prev[candidateId] || []), response.data]
        }));
        
        setShowCommentModal(false);
        setCommentReview(null);
        setCommentText('');
        setCommentReason('');
      } else {
        toast.error(response.message || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsAddingComment(false);
    }
  };

  const getStarRating = (stars) => {
    if (!stars) return '☆☆☆☆☆';
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'review_received': { label: 'Review Received', class: 'status-received', icon: 'fa-star' },
      'closed': { label: 'Closed', class: 'status-closed', icon: 'fa-check-circle' }
    };

    const config = statusConfig[status] || statusConfig['review_received'];
    
    return (
      <span className={`status-badge ${config.class}`}>
        <i className={`fas ${config.icon}`}></i>
        <span>{config.label}</span>
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateStats = () => {
    const totalReviews = reviews.length;
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((sum, review) => sum + (review.review_stars || 0), 0) / reviews.length).toFixed(1)
      : 0;
    const fiveStarReviews = reviews.filter(review => review.review_stars === 5).length;
    const successRate = totalReviews > 0 ? Math.round((fiveStarReviews / totalReviews) * 100) : 0;

    return { totalReviews, avgRating, fiveStarReviews, successRate };
  };

  const exportData = () => {
    if (filteredReviews.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + "Candidate Name,Email,Job Title,Rating,Review Date,Status,Review Message,Platform,Client,Location,Has Comments\n"
      + filteredReviews.map(review => 
          `"${review.candidate_full_name || ''}","${review.cemail || ''}","${review.job_title || ''}",${review.review_stars || 0},"${formatDate(review.review_received_date)}","${review.ticket_status}","${(review.review_message || '').replace(/"/g, '""')}","${review.review_platform || 'google'}","${review.client_name || ''}","${review.geo_name || ''}","${hasComments(review) ? 'Yes' : 'No'}"`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `review_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Review history exported successfully!');
  };

  // Get unique platforms for filter
  const uniquePlatforms = [...new Set(reviews.map(r => r.review_platform).filter(Boolean))];

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className='box'>
        <div className="fullscreen-container">
          <div className="loading">
            <div className="loading-spinner">
              <i className="fas fa-sync-alt fa-spin"></i>
            </div>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span>Loading review history...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fullscreen-container">
      {/* Dashboard Cards Section */}
      <div className="dashboard-section">
        <div className="dashboard-cards">
          <div className="dashboard-card blue">
            <div className="card-icon">
              <i className="fas fa-star"></i>
            </div>
            <div className="card-content">
              <h3>{stats.totalReviews}</h3>
              <p>TOTAL REVIEWS</p>
            </div>
          </div>
          
          <div className="dashboard-card green">
            <div className="card-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="card-content">
              <h3>{stats.avgRating}</h3>
              <p>AVG RATING</p>
            </div>
          </div>
          
          <div className="dashboard-card yellow">
            <div className="card-icon">
              <i className="fas fa-trophy"></i>
            </div>
            <div className="card-content">
              <h3>{stats.fiveStarReviews}</h3>
              <p>5-STAR REVIEWS</p>
            </div>
          </div>
          
          <div className="dashboard-card teal">
            <div className="card-icon">
              <i className="fas fa-percentage"></i>
            </div>
            <div className="card-content">
              <h3>{stats.successRate}%</h3>
              <p>SUCCESS RATE</p>
            </div>
          </div>
          
          <div className="dashboard-card purple">
            <div className="card-icon">
              <i className="fas fa-download"></i>
            </div>
            <div className="card-content">
              <button 
                className="export-action" 
                onClick={exportData}
                disabled={filteredReviews.length === 0}
              >
                EXPORT CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="controls-section">
        {/* Search Bar */}
        <div className="search-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search reviews, candidates, content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="controls-group">
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`control-btn ${showFilters ? 'active' : ''}`}
          >
            <Filter size={16} />
            Filters
          </button>

          {/* Clear All */}
          <button onClick={clearFilters} className="control-btn">
            <RefreshCw size={16} />
            Clear
          </button>

          {/* Refresh Button */}
          <button onClick={fetchReviews} className="control-btn primary">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Results Count */}
        <div className="results-count">
          {filteredReviews.length} of {reviews.length} reviews
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filters-panel">
          {/* Status Filter */}
          <div className="filter-group">
            <label className="filter-label">STATUS</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="review_received">Review Received</option>
              <option value="closed">Closed</option>
              <option value="has_comments">Has Comments</option>
            </select>
          </div>

          {/* Rating Filter */}
          <div className="filter-group">
            <label className="filter-label">RATING</label>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
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

          {/* Platform Filter */}
          <div className="filter-group">
            <label className="filter-label">PLATFORM</label>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Platforms</option>
              {uniquePlatforms.map(platform => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="data-table-container">
        <div className="table-wrapper">
          <div className="table-header">
            <div className="col-candidate" onClick={() => handleSort('candidate_full_name')}>
              <i className="fas fa-user"></i>
              Candidate
              {getSortIcon('candidate_full_name')}
            </div>
            <div className="col-review" onClick={() => handleSort('review_stars')}>
              <i className="fas fa-star"></i>
              Review
              {getSortIcon('review_stars')}
            </div>
            <div className="col-job" onClick={() => handleSort('job_title')}>
              <i className="fas fa-briefcase"></i>
              Job Title
              {getSortIcon('job_title')}
            </div>
            <div className="col-platform" onClick={() => handleSort('review_platform')}>
              <i className="fas fa-globe"></i>
              Platform
              {getSortIcon('review_platform')}
            </div>
            <div className="col-date" onClick={() => handleSort('review_received_date')}>
              <i className="fas fa-calendar-alt"></i>
              Date
              {getSortIcon('review_received_date')}
            </div>
            <div className="col-actions">
              <i className="fas fa-cogs"></i>
              Actions
            </div>
          </div>

          {filteredReviews.length === 0 ? (
            <div className="empty-state">
              <div className="empty-animation">
                <i className="fas fa-star fa-4x"></i>
                <div className="pulse-ring"></div>
              </div>
              <h3>{searchTerm || statusFilter !== 'all' || ratingFilter !== 'all' || platformFilter !== 'all' ? 'No Results Found' : 'No Reviews Found'}</h3>
              <p>
                {searchTerm || statusFilter !== 'all' || ratingFilter !== 'all' || platformFilter !== 'all'
                  ? 'Try adjusting your search or filters to find reviews.'
                  : 'You haven\'t collected any reviews yet.'
                }
              </p>
            </div>
          ) : (
            <div className="table-body">
              {filteredReviews.map((review, index) => {
                const reviewHasComments = hasComments(review);
                const comments = reviewComments[review.candidate_id] || [];

                return (
                  <div key={review.ticket_id} className="table-row-container">
                    <div className="table-row" style={{ animationDelay: `${index * 100}ms` }}>
                      <div className="col-candidate">
                        <div className="candidate-avatar">
                          <i className="fas fa-user-circle"></i>
                        </div>
                        <div className="candidate-info">
                          <div className="name">
                            {review.candidate_full_name || `${review.cfirstname || ''} ${review.clastname || ''}`.trim()}
                            {reviewHasComments && (
                              <span className="comment-indicator" title="Has comments">
                                <MessageSquare className="w-3 h-3 text-blue-600" />
                              </span>
                            )}
                          </div>
                          <div className="email">{review.cemail}</div>
                        </div>
                      </div>
                      
                      <div className="col-review">
                        <div className="review-rating">
                          <div className="stars-display">
                            {getStarRating(review.review_stars)}
                          </div>
                          <span className="rating-number">({review.review_stars}/5)</span>
                        </div>
                        <div className="review-preview">
                          {review.review_message?.length > 60 
                            ? `${review.review_message.substring(0, 60)}...`
                            : review.review_message
                          }
                        </div>
                      </div>
                      
                      <div className="col-job">
                        <i className="fas fa-briefcase text-muted"></i>
                        <span>{review.job_title || 'N/A'}</span>
                      </div>
                      
                      <div className="col-platform">
                        <i className="fas fa-globe text-muted"></i>
                        <span>{review.review_platform || 'Google'}</span>
                      </div>
                      
                      <div className="col-date">
                        <i className="fas fa-calendar-alt text-muted"></i>
                        <span>{formatDate(review.review_received_date)}</span>
                      </div>
                      
                      <div className="col-actions">
                        <button
                          className="action-btn view"
                          onClick={() => {
                            setSelectedReview(review);
                            setShowDetailModal(true);
                          }}
                          title="View Full Review"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        
                        {review.review_url && (
                          <a 
                            href={review.review_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="action-btn link"
                            title="View Online"
                          >
                            <i className="fas fa-external-link-alt"></i>
                          </a>
                        )}

                        <button
                          className={`action-btn comment ${reviewHasComments ? 'has-comments' : ''}`}
                          onClick={() => handleAddComment(review)}
                          title={reviewHasComments ? `Add Comment (${comments.length} existing)` : "Add Comment"}
                        >
                          <i className="fas fa-comment-alt"></i>
                          {reviewHasComments && (
                            <span className="comment-count">{comments.length}</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Comment Modal */}
      {showCommentModal && commentReview && (
        <div className="modal-overlay">
          <div className="comment-modal">
            <div className="modal-header">
              <h3>
                <i className="fas fa-comment-alt"></i>
                Add Comment for Review
              </h3>
              <button className="close-btn" onClick={() => setShowCommentModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="review-info">
                <div className="info-card">
                  <h4>{commentReview.candidate_full_name || `${commentReview.cfirstname} ${commentReview.clastname}`}</h4>
                  <p>{commentReview.cemail}</p>
                  <div className="review-summary">
                    <span className="rating">{getStarRating(commentReview.review_stars)} ({commentReview.review_stars}/5)</span>
                    <span className="platform">{commentReview.review_platform || 'Google'}</span>
                  </div>
                </div>
              </div>

              <div className="comment-form">
                <div className="form-section">
                  <label>
                    Reason for comment *
                    <select 
                      value={commentReason} 
                      onChange={(e) => setCommentReason(e.target.value)}
                      required
                    >
                      <option value="">Select a reason</option>
                      {commentReasons.map(reason => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Comment Details *
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add notes about this review, follow-up actions needed, or any observations..."
                      rows="4"
                      required
                    />
                  </label>

                  <div className="comment-info">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <p>This comment will be associated with the candidate's review record and help track follow-up actions.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowCommentModal(false)}
                disabled={isAddingComment}
              >
                <i className="fas fa-times"></i>
                Cancel
              </button>
              <button 
                className={`btn-primary ${isAddingComment || !commentText.trim() || !commentReason ? 'disabled' : ''}`}
                onClick={handleSubmitComment}
                disabled={isAddingComment || !commentText.trim() || !commentReason}
              >
                {isAddingComment ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Adding...
                  </>
                ) : (
                  <>
                    <i className="fas fa-comment-alt"></i>
                    Add Comment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Review Detail Modal */}
      {showDetailModal && selectedReview && (
        <div className="modal-overlay">
          <div className="review-detail-modal">
            <div className="modal-header">
              <h3>
                <i className="fas fa-star"></i>
                Review Details
              </h3>
              <button 
                className="close-btn"
                onClick={() => setShowDetailModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="review-full-info">
                {/* Candidate Information */}
                <div className="info-section candidate-info">
                  <h4>
                    <i className="fas fa-user"></i>
                    Candidate Information
                  </h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Name:</span>
                      <span className="info-value">{selectedReview.candidate_full_name}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{selectedReview.cemail}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Job Title:</span>
                      <span className="info-value">{selectedReview.job_title}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Start Date:</span>
                      <span className="info-value">{formatDate(selectedReview.start_date)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Client:</span>
                      <span className="info-value">{selectedReview.client_name || selectedReview.client}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Location:</span>
                      <span className="info-value">{selectedReview.geo_name || selectedReview.geo_location}</span>
                    </div>
                  </div>
                </div>

                {/* Review Information */}
                <div className="info-section review-info">
                  <h4>
                    <i className="fas fa-star"></i>
                    Review Information
                  </h4>
                  <div className="rating-display">
                    <div className="large-stars">
                      {getStarRating(selectedReview.review_stars)}
                    </div>
                    <span className="rating-text">
                      {selectedReview.review_stars} out of 5 stars
                    </span>
                    <div className="platform-info">
                      Platform: {selectedReview.review_platform || 'Google'}
                    </div>
                  </div>
                  
                  <div className="review-message-full">
                    <h5>Review Message:</h5>
                    <div className="message-content">
                      {selectedReview.review_message}
                    </div>
                  </div>

                  <div className="review-dates">
                    <div className="date-item">
                      <Clock size={16} />
                      <span>Received: {formatDate(selectedReview.review_received_date)}</span>
                    </div>
                    <div className="date-item">
                      <Calendar size={16} />
                      <span>Request Sent: {formatDate(selectedReview.email_sent_at)}</span>
                    </div>
                  </div>

                  {selectedReview.review_url && (
                    <div className="review-links">
                      <a 
                        href={selectedReview.review_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="review-url"
                      >
                        <ExternalLink size={16} />
                        View Original Review
                      </a>
                    </div>
                  )}

                  {selectedReview.review_screenshot_path && (
                    <div className="review-screenshot">
                      <h5>Screenshot:</h5>
                      <img 
                        src={selectedReview.review_screenshot_path} 
                        alt="Review screenshot"
                        className="screenshot-image"
                      />
                    </div>
                  )}
                </div>

                {/* Ticket Information */}
                <div className="info-section ticket-info">
                  <h4>
                    <i className="fas fa-ticket-alt"></i>
                    Ticket Information
                  </h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Ticket ID:</span>
                      <span className="info-value">{selectedReview.ticket_number}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Status:</span>
                      <span className="info-value">{getStatusBadge(selectedReview.ticket_status)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email Template:</span>
                      <span className="info-value">{selectedReview.email_template_used}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Request Date:</span>
                      <span className="info-value">{formatDate(selectedReview.review_request_date)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Due Date:</span>
                      <span className="info-value">{formatDate(selectedReview.review_due_date)}</span>
                    </div>
                    {selectedReview.reminder_sent_count > 0 && (
                      <div className="info-item">
                        <span className="info-label">Reminders Sent:</span>
                        <span className="info-value">{selectedReview.reminder_sent_count}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Comments Section */}
                {hasComments(selectedReview) && (
                  <div className="info-section comments-info">
                    <h4>
                      <i className="fas fa-comments"></i>
                      Comments ({reviewComments[selectedReview.candidate_id]?.length || 0})
                    </h4>
                    <div className="comments-list">
                      {(reviewComments[selectedReview.candidate_id] || []).map((comment, idx) => (
                        <div key={comment.comment_id || idx} className="comment-item">
                          <div className="comment-header">
                            <div className="comment-reason">
                              <i className="fas fa-tag"></i>
                              <span>{commentReasons.find(r => r.value === comment.comment_reason)?.label || comment.comment_reason}</span>
                            </div>
                            <div className="comment-date">
                              {formatDate(comment.created_at)}
                            </div>
                          </div>
                          <div className="comment-text">
                            {comment.comment_text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewHistory;