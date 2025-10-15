import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Calendar, User, Mail, Clock, 
  CheckCircle, AlertTriangle, Star, Eye, Edit, 
  Upload, ExternalLink, RefreshCw, Send, X,
  MapPin, Building, Briefcase, ChevronRight, ChevronDown, ChevronUp,
  SortAsc, SortDesc, RotateCcw, MessageSquare
} from 'lucide-react';
import './trackTickets.css';
import { 
  getReviewTickets, 
  updateTicket, 
  submitReview, 
  uploadFile,
  sendReminder,
  addCandidateComment,
  getCandidateComments,
  updateReviewStatus
} from '../../services/api';
import { toast } from 'react-hot-toast';

const TrackTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);

  // Comment Modal States
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentTicket, setCommentTicket] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentReason, setCommentReason] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [ticketComments, setTicketComments] = useState({});

  // Status Update Modal States
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTicket, setStatusTicket] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [reviewData, setReviewData] = useState({
    review_received_date: '',
    review_message: '',
    review_stars: 5,
    review_platform: 'google',
    review_screenshot: null,
    review_url: ''
  });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Comment reasons for dropdown
  const commentReasons = [
    { value: 'follow_up_needed', label: 'Follow-up required' },
    { value: 'client_feedback', label: 'Client provided feedback' },
    { value: 'candidate_issue', label: 'Candidate reported issue' },
    { value: 'review_quality', label: 'Review quality concern' },
    { value: 'technical_issue', label: 'Technical/system issue' },
    { value: 'process_deviation', label: 'Process deviation noted' },
    { value: 'other', label: 'Other reason' }
  ];

  // Status update options for dropdown
  const statusUpdateOptions = [
    { value: 'email_sent', label: 'Email Sent', description: 'Review request email has been sent' },
    { value: 'in_progress', label: 'In Progress', description: 'Review email sent, waiting for response' },
    { value: 'reminder_sent', label: 'Reminder Sent', description: 'Follow-up reminder has been sent' },
    { value: 'review_received', label: 'Review Received', description: 'Customer has submitted their review' },
    { value: 'closed', label: 'Completed', description: 'Review process completed successfully' },
    { value: 'expired', label: 'Expired', description: 'Review request has expired without response' },
    { value: 'cancelled', label: 'Cancelled', description: 'Review request was cancelled' }
  ];

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, statusFilter, priorityFilter, sortConfig]);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const response = await getReviewTickets();
      if (response.success) {
        const ticketsData = response.data;
        setTickets(ticketsData);
        
        // Fetch comments for each ticket
        const commentsPromises = ticketsData.map(async (ticket) => {
          try {
            const candidateId = ticket.candidate_id;
            const commentsResponse = await getCandidateComments(candidateId);
            return {
              candidateId,
              comments: commentsResponse.success ? commentsResponse.data : []
            };
          } catch (error) {
            return { candidateId: ticket.candidate_id, comments: [] };
          }
        });
        
        const commentsResults = await Promise.all(commentsPromises);
        const commentsMap = {};
        commentsResults.forEach(({ candidateId, comments }) => {
          commentsMap[candidateId] = comments;
        });
        setTicketComments(commentsMap);
      } else {
        toast.error('Failed to load tickets');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    if (searchTerm) {
      filtered = filtered.filter(ticket => 
        ticket.candidate_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.cemail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'commented') {
        filtered = filtered.filter(ticket => hasComments(ticket));
      } else {
        filtered = filtered.filter(ticket => ticket.ticket_status === statusFilter);
      }
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    // Sort tickets
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'candidate_full_name') {
          aValue = aValue || `${a.cfirstname || ''} ${a.clastname || ''}`.trim();
          bValue = bValue || `${b.cfirstname || ''} ${b.clastname || ''}`.trim();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredTickets(filtered);
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
    setPriorityFilter('all');
    setSortConfig({ key: 'created_at', direction: 'desc' });
  };

  const hasActiveFilters = () => {
    return searchTerm || statusFilter !== 'all' || priorityFilter !== 'all';
  };

  // Check if ticket has comments
  const hasComments = (ticket) => {
    const candidateId = ticket.candidate_id;
    const comments = ticketComments[candidateId] || [];
    return comments.length > 0;
  };

  // Comment Modal Functions
  const handleAddComment = (ticket) => {
    setCommentTicket(ticket);
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
        candidate_id: commentTicket.candidate_id,
        comment_text: commentText.trim(),
        comment_reason: commentReason,
        comment_type: 'ticket_comment',
        ticket_id: commentTicket.ticket_id
      };

      const response = await addCandidateComment(commentData);

      if (response.success) {
        toast.success('Comment added successfully');
        
        // Update local comments state
        const candidateId = commentTicket.candidate_id;
        setTicketComments(prev => ({
          ...prev,
          [candidateId]: [...(prev[candidateId] || []), response.data]
        }));
        
        setShowCommentModal(false);
        setCommentTicket(null);
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

  // Status Update Modal Functions
  const handleUpdateStatus = (ticket) => {
    setStatusTicket(ticket);
    setNewStatus(ticket.ticket_status || '');
    setStatusNotes('');
    setShowStatusModal(true);
  };

  const handleSubmitStatusUpdate = async () => {
    if (!newStatus) {
      toast.error('Please select a new status');
      return;
    }

    if (newStatus === statusTicket.ticket_status) {
      toast.error('Please select a different status than the current one');
      return;
    }

    setIsUpdatingStatus(true);

    try {
      const updateData = {
        ticket_id: statusTicket.ticket_id,
        ticket_status: newStatus,
        notes: statusNotes.trim() || `Status updated from ${statusTicket.ticket_status} to ${newStatus}`,
        updated_by: currentUser.user_id || currentUser.id
      };

      const response = await updateReviewStatus(updateData);

      if (response.success) {
        toast.success('Review status updated successfully');
        
        // Update local tickets state
        setTickets(prev => prev.map(ticket => 
          ticket.ticket_id === statusTicket.ticket_id 
            ? { ...ticket, ticket_status: newStatus, updated_at: new Date().toISOString() }
            : ticket
        ));
        
        setShowStatusModal(false);
        setStatusTicket(null);
        setNewStatus('');
        setStatusNotes('');
      } else {
        toast.error(response.message || 'Failed to update review status');
      }
    } catch (error) {
      console.error('Error updating review status:', error);
      toast.error('Failed to update review status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendReminder = async (ticketId) => {
    try {
      const response = await sendReminder(ticketId);
      
      if (response.success) {
        toast.success('Reminder sent successfully');
        fetchTickets();
      } else {
        toast.error(response.message || 'Failed to send reminder');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Failed to send reminder');
    }
  };

  const handleTicketView = (ticket) => {
    setExpandedTicket(expandedTicket === ticket.ticket_id ? null : ticket.ticket_id);
  };

  const handleReviewSubmit = async () => {
    if (!reviewData.review_received_date || !reviewData.review_message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      let screenshotPath = null;

      if (reviewData.review_screenshot) {
        const uploadResponse = await uploadFile(reviewData.review_screenshot);
        if (uploadResponse.success) {
          screenshotPath = uploadResponse.data.filepath;
        }
      }

      const submitData = {
        ticket_id: selectedTicket.ticket_id,
        review_received_date: reviewData.review_received_date,
        review_message: reviewData.review_message,
        review_stars: parseInt(reviewData.review_stars),
        review_platform: reviewData.review_platform,
        review_screenshot_path: screenshotPath,
        review_url: reviewData.review_url
      };

      const response = await submitReview(submitData);

      if (response.success) {
        toast.success('Review submitted successfully!');
        setShowReviewModal(false);
        setSelectedTicket(null);
        setReviewData({
          review_received_date: '',
          review_message: '',
          review_stars: 5,
          review_platform: 'google',
          review_screenshot: null,
          review_url: ''
        });
        fetchTickets();
      } else {
        toast.error(response.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusInfo = (status, isOverdue = false) => {
    const statusConfig = {
      'email_sent': { label: 'Email Sent', class: 'sent', icon: 'fa-paper-plane' },
      'in_progress': { label: 'In Progress', class: 'progress', icon: 'fa-clock' },
      'reminder_sent': { label: 'Reminder Sent', class: 'reminder', icon: 'fa-bell' },
      'review_received': { label: 'Review Received', class: 'received', icon: 'fa-star' },
      'closed': { label: 'Completed', class: 'completed', icon: 'fa-check-circle' },
      'expired': { label: 'Expired', class: 'expired', icon: 'fa-times-circle' }
    };

    return statusConfig[status] || statusConfig['email_sent'];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return 0;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const canSendReminder = (ticket) => {
    const allowedStatuses = ['email_sent', 'reminder_sent'];
    return allowedStatuses.includes(ticket.ticket_status) && 
           (ticket.reminder_sent_count || 0) < 2;
  };

  const canSubmitReview = (ticket) => {
    return ['email_sent', 'reminder_sent'].includes(ticket.ticket_status);
  };

  const canUpdateStatus = (ticket) => {
    const allowedStatuses = ['email_sent', 'in_progress', 'reminder_sent', 'review_received'];
    return allowedStatuses.includes(ticket.ticket_status);
  };

  // Calculate dashboard metrics
  const totalTickets = tickets.length;
  const pendingTickets = tickets.filter(t => ['email_sent', 'reminder_sent'].includes(t.ticket_status)).length;
  const receivedTickets = tickets.filter(t => t.ticket_status === 'review_received').length;
  const completedTickets = tickets.filter(t => t.ticket_status === 'closed').length;
  const overdueTickets = tickets.filter(t => t.is_overdue).length;

  if (isLoading) {
    return (
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
          <span>Loading tickets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fullscreen-container">
      {/* Modern Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>
            <i className="fas fa-ticket-alt"></i>
            Review Tickets Management
          </h1>
        </div>
      </div>

      {/* Dashboard Cards Section */}
      <div className="dashboard-section">
        <div className="dashboard-cards">
          <div className="dashboard-card blue">
            <div className="card-icon">
              <i className="fas fa-ticket-alt"></i>
            </div>
            <div className="card-content">
              <h3>{totalTickets}</h3>
              <p>TOTAL TICKETS</p>
            </div>
          </div>
          
          <div className="dashboard-card yellow">
            <div className="card-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="card-content">
              <h3>{pendingTickets}</h3>
              <p>PENDING</p>
            </div>
          </div>
          
          <div className="dashboard-card green">
            <div className="card-icon">
              <i className="fas fa-star"></i>
            </div>
            <div className="card-content">
              <h3>{receivedTickets}</h3>
              <p>RECEIVED</p>
            </div>
          </div>
          
          <div className="dashboard-card teal">
            <div className="card-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="card-content">
              <h3>{completedTickets}</h3>
              <p>COMPLETED</p>
            </div>
          </div>
          
          <div className="dashboard-card red">
            <div className="card-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className="card-content">
              <h3>{overdueTickets}</h3>
              <p>OVERDUE</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Search and Filter Section */}
      <div className="filter-container">
        <div className="filter-section">
          {/* Global Search - Left side */}
          <div className="global-search">
            <div className="search-input-wrapper">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search tickets, candidates, emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="global-search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter controls - Right side */}
          <div className="filter-header">
            <div className="filter-toggle">
              <button 
                className={`filter-btn ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4" />
                Advanced Filters
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <div className="results-count">
                Showing {filteredTickets.length} of {tickets.length} tickets
              </div>
            </div>
            
            {hasActiveFilters() && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                <RotateCcw className="w-4 h-4" />
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        {/* Advanced filter controls - appears below the main filter section */}
        {showFilters && (
          <div className="advanced-filter-controls">
            <div className="filter-grid">
              {/* Status Filter */}
              <div className="filter-group">
                <label className="filter-label">STATUS</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="email_sent">Email Sent</option>
                  <option value="reminder_sent">Reminder Sent</option>
                  <option value="review_received">Review Received</option>
                  <option value="closed">Completed</option>
                  <option value="expired">Expired</option>
                  <option value="commented">Has Comments</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div className="filter-group">
                <label className="filter-label">PRIORITY</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Refresh Button */}
              <div className="filter-group">
                <label className="filter-label">ACTIONS</label>
                <button onClick={fetchTickets} className="filter-select" style={{cursor: 'pointer', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none'}}>
                  <RefreshCw size={16} style={{marginRight: '8px'}} />
                  Refresh Data
                </button>
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters() && (
              <div className="active-filters">
                <span className="active-filters-label">Active Filters:</span>
                <div className="filter-tags">
                  {searchTerm && (
                    <div className="filter-tag">
                      <Search className="w-3 h-3" />
                      <span>"{searchTerm}"</span>
                      <button onClick={() => setSearchTerm('')}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  
                  {statusFilter !== 'all' && (
                    <div className="filter-tag">
                      <CheckCircle className="w-3 h-3" />
                      <span>Status: {statusFilter}</span>
                      <button onClick={() => setStatusFilter('all')}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  
                  {priorityFilter !== 'all' && (
                    <div className="filter-tag">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Priority: {priorityFilter}</span>
                      <button onClick={() => setPriorityFilter('all')}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="data-table-container">
        <div className="table-wrapper">
          <div className="table-header">
            <div className="col-ticket" onClick={() => handleSort('ticket_number')}>
              <i className="fas fa-ticket-alt"></i>
              Ticket
              {getSortIcon('ticket_number')}
            </div>
            <div className="col-candidate" onClick={() => handleSort('candidate_full_name')}>
              <i className="fas fa-user"></i>
              Candidate
              {getSortIcon('candidate_full_name')}
            </div>
            <div className="col-job" onClick={() => handleSort('job_title')}>
              <i className="fas fa-briefcase"></i>
              Job Title
              {getSortIcon('job_title')}
            </div>
            <div className="col-date" onClick={() => handleSort('created_at')}>
              <i className="fas fa-calendar-alt"></i>
              Created
              {getSortIcon('created_at')}
            </div>
            <div className="col-status" onClick={() => handleSort('ticket_status')}>
              <i className="fas fa-info-circle"></i>
              Status
              {getSortIcon('ticket_status')}
            </div>
            <div className="col-actions">
              <i className="fas fa-cogs"></i>
              Actions
            </div>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-animation">
                <i className="fas fa-ticket-alt fa-4x"></i>
                <div className="pulse-ring"></div>
              </div>
              <h3>{searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' ? 'No Results Found' : 'No Tickets Found'}</h3>
              <p>
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your search or filters to find tickets.'
                  : 'No review tickets have been created yet.'
                }
              </p>
            </div>
          ) : (
            <div className="table-body">
              {filteredTickets.map((ticket, index) => {
                const statusInfo = getStatusInfo(ticket.ticket_status, ticket.is_overdue);
                const isExpanded = expandedTicket === ticket.ticket_id;
                const ticketHasComments = hasComments(ticket);
                const ticketCommentsList = ticketComments[ticket.candidate_id] || [];
                
                return (
                  <div key={ticket.ticket_id} className="table-row-container">
                    <div className={`table-row ${isExpanded ? 'expanded' : ''}`} 
                         style={{ animationDelay: `${index * 100}ms` }}>
                      <div className="col-ticket">
                        <div className="ticket-badge">
                          <i className="fas fa-hashtag"></i>
                          <span>{ticket.ticket_number}</span>
                          {ticketHasComments && (
                            <span className="comment-indicator" title="Has comments">
                              <MessageSquare className="w-3 h-3 text-blue-600" />
                            </span>
                          )}
                        </div>
                        <div className="ticket-meta">
                          <span className="ticket-date">{formatDate(ticket.created_at)}</span>
                          {ticket.priority && (
                            <span className={`priority-badge priority-${ticket.priority}`}>
                              {ticket.priority}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="col-candidate">
                        <div className="candidate-avatar">
                          <i className="fas fa-user-circle"></i>
                        </div>
                        <div className="candidate-info">
                          <div className="name">
                            {ticket.candidate_full_name || `${ticket.cfirstname || ''} ${ticket.clastname || ''}`.trim()}
                          </div>
                          <div className="email">{ticket.cemail}</div>
                        </div>
                      </div>
                      
                      <div className="col-job">
                        <i className="fas fa-briefcase text-muted"></i>
                        <span>{ticket.job_title || 'N/A'}</span>
                      </div>
                      
                      <div className="col-date">
                        <i className="fas fa-calendar-alt text-muted"></i>
                        <span>{formatDate(ticket.created_at)}</span>
                      </div>
                      
                      <div className="col-status">
                        <span className={`status-badge ${statusInfo.class} ${ticket.is_overdue ? 'overdue' : ''}`}>
                          <i className={`fas ${statusInfo.icon}`}></i>
                          <span>{statusInfo.label}</span>
                          {ticket.is_overdue && <i className="fas fa-exclamation-triangle"></i>}
                        </span>
                      </div>
                      
                      <div className="col-actions">
                        <button
                          className="action-btn view"
                          onClick={() => handleTicketView(ticket)}
                          title={isExpanded ? "Hide Details" : "View Details"}
                        >
                          <i className={`fas ${isExpanded ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                        
                        {canSendReminder(ticket) && (
                          <button 
                            className="action-btn reminder"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendReminder(ticket.ticket_id);
                            }}
                            title="Send Reminder"
                          >
                            <i className="fas fa-paper-plane"></i>
                          </button>
                        )}
                        
                        {canSubmitReview(ticket) && (
                          <button 
                            className="action-btn submit"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTicket(ticket);
                              setReviewData({
                                ...reviewData,
                                review_received_date: new Date().toISOString().split('T')[0]
                              });
                              setShowReviewModal(true);
                            }}
                            title="Submit Review"
                          >
                            <i className="fas fa-star"></i>
                          </button>
                        )}

                        <button
                          className={`action-btn comment ${ticketHasComments ? 'has-comments' : ''}`}
                          onClick={() => handleAddComment(ticket)}
                          title={ticketHasComments ? `Add Comment (${ticketCommentsList.length} existing)` : "Add Comment"}
                        >
                          <i className="fas fa-comment-alt"></i>
                          {ticketHasComments && (
                            <span className="comment-count">{ticketCommentsList.length}</span>
                          )}
                        </button>

                        {canUpdateStatus(ticket) && (
                          <button
                            className="action-btn update-status"
                            onClick={() => handleUpdateStatus(ticket)}
                            title={`Update Status (${statusInfo.label})`}
                          >
                            <i className="fas fa-sync-alt"></i>
                          </button>
                        )}

                        {ticket.review_url && (
                          <a
                            href={ticket.review_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="action-btn link"
                            onClick={(e) => e.stopPropagation()}
                            title="View Review"
                          >
                            <i className="fas fa-external-link-alt"></i>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Accordion Expansion */}
                    {isExpanded && (
                      <div className="row-expansion">
                        <div className="expansion-content">
                          <div className="detail-cards">
                            <div className="detail-card">
                              <div className="card-header">
                                <i className="fas fa-ticket-alt"></i>
                                <h4>Ticket Information</h4>
                              </div>
                              <div className="card-body">
                                <div className="info-row">
                                  <i className="fas fa-hashtag info-icon"></i>
                                  <span><strong>Number:</strong> {ticket.ticket_number}</span>
                                </div>
                                <div className="info-row">
                                  <i className="fas fa-calendar info-icon"></i>
                                  <span><strong>Created:</strong> {formatDate(ticket.created_at)}</span>
                                </div>
                                <div className="info-row">
                                  <i className="fas fa-flag info-icon"></i>
                                  <span><strong>Priority:</strong> {ticket.priority || 'Normal'}</span>
                                </div>
                                <div className="info-row">
                                  <i className="fas fa-template info-icon"></i>
                                  <span><strong>Template:</strong> {ticket.email_template_used || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="detail-card">
                              <div className="card-header">
                                <i className="fas fa-clock"></i>
                                <h4>Timeline</h4>
                              </div>
                              <div className="card-body">
                                <div className="info-row">
                                  <i className="fas fa-paper-plane info-icon"></i>
                                  <span><strong>Request:</strong> {formatDate(ticket.review_request_date)}</span>
                                </div>
                                <div className="info-row">
                                  <i className="fas fa-calendar-check info-icon"></i>
                                  <span><strong>Due:</strong> {formatDate(ticket.review_due_date)}</span>
                                </div>
                                {ticket.review_received_date && (
                                  <div className="info-row">
                                    <i className="fas fa-star info-icon"></i>
                                    <span><strong>Received:</strong> {formatDate(ticket.review_received_date)}</span>
                                  </div>
                                )}
                                <div className="info-row">
                                  <i className="fas fa-bell info-icon"></i>
                                  <span><strong>Reminders:</strong> {ticket.reminder_sent_count || 0}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="detail-card">
                              <div className="card-header">
                                <i className="fas fa-envelope"></i>
                                <h4>Communication</h4>
                              </div>
                              <div className="card-body">
                                <div className="info-row">
                                  <i className="fas fa-at info-icon"></i>
                                  <span><strong>To:</strong> {ticket.email_sent_to}</span>
                                </div>
                                <div className="info-row">
                                  <i className="fas fa-copy info-icon"></i>
                                  <span><strong>CC:</strong> {ticket.email_cc}</span>
                                </div>
                                <div className="info-row">
                                  <i className="fas fa-paper-plane info-icon"></i>
                                  <span><strong>Sent At:</strong> {formatDate(ticket.email_sent_at)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Comments Section */}
                            {ticketHasComments && (
                              <div className="detail-card comments-card">
                                <div className="card-header">
                                  <i className="fas fa-comments"></i>
                                  <h4>Comments ({ticketCommentsList.length})</h4>
                                </div>
                                <div className="card-body">
                                  {ticketCommentsList.map((comment, idx) => (
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

                            {ticket.review_message && (
                              <div className="detail-card review-card">
                                <div className="card-header">
                                  <i className="fas fa-star"></i>
                                  <h4>Review Details</h4>
                                </div>
                                <div className="card-body">
                                  <div className="review-stars">
                                    {'★'.repeat(ticket.review_stars || 0)}{'☆'.repeat(5 - (ticket.review_stars || 0))}
                                    <span className="rating-text">({ticket.review_stars}/5)</span>
                                  </div>
                                  <div className="review-message">
                                    <strong>Message:</strong>
                                    <p>"{ticket.review_message}"</p>
                                  </div>
                                  <div className="info-row">
                                    <i className="fas fa-globe info-icon"></i>
                                    <span><strong>Platform:</strong> {ticket.review_platform || 'Google'}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Comment Modal */}
      {showCommentModal && commentTicket && (
        <div className="modal-overlay">
          <div className="comment-modal">
            <div className="modal-header">
              <h3>
                <i className="fas fa-comment-alt"></i>
                Add Comment for Ticket #{commentTicket.ticket_number}
              </h3>
              <button className="close-btn" onClick={() => setShowCommentModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="ticket-info">
                <div className="info-card">
                  <h4>{commentTicket.candidate_full_name || `${commentTicket.cfirstname || ''} ${commentTicket.clastname || ''}`.trim()}</h4>
                  <p>{commentTicket.cemail}</p>
                  <div className="ticket-badge">
                    <i className="fas fa-ticket-alt"></i>
                    Ticket: {commentTicket.ticket_number}
                  </div>
                </div>
              </div>

              <div className="comment-form">
                <div className="form-section">
                  <label>
                    Comment Category *
                    <select 
                      value={commentReason} 
                      onChange={(e) => setCommentReason(e.target.value)}
                      required
                    >
                      <option value="">Select a category</option>
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
                      placeholder="Enter your comment about this ticket..."
                      rows="4"
                      required
                    />
                  </label>

                  <div className="comment-info">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <p>This comment will be associated with the ticket and help track important notes or issues.</p>
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

      {/* Status Update Modal */}
      {showStatusModal && statusTicket && (
        <div className="modal-overlay">
          <div className="status-modal">
            <div className="modal-header">
              <h3>
                <i className="fas fa-sync-alt"></i>
                Update Ticket Status
              </h3>
              <button className="close-btn" onClick={() => setShowStatusModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="status-info">
                <div className="info-card">
                  <h4>{statusTicket.candidate_full_name || `${statusTicket.cfirstname || ''} ${statusTicket.clastname || ''}`.trim()}</h4>
                  <p>{statusTicket.cemail}</p>
                  <div className="ticket-badge">
                    <i className="fas fa-ticket-alt"></i>
                    Ticket: {statusTicket.ticket_number}
                  </div>
                </div>
              </div>

              <div className="status-form">
                <div className="form-section">
                  <div className="current-status">
                    <label>Current Status:</label>
                    <div className="status-display">
                      <span className={`status-badge ${getStatusInfo(statusTicket.ticket_status)?.class || 'pending'}`}>
                        {getStatusInfo(statusTicket.ticket_status)?.label || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <label>
                    New Status *
                    <select 
                      value={newStatus} 
                      onChange={(e) => setNewStatus(e.target.value)}
                      required
                    >
                      <option value="">Select new status</option>
                      {statusUpdateOptions.map(option => (
                        <option 
                          key={option.value} 
                          value={option.value}
                          disabled={option.value === statusTicket.ticket_status}
                        >
                          {option.label} {option.value === statusTicket.ticket_status ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                  </label>

                  {newStatus && (
                    <div className="status-description">
                      <i className="fas fa-info-circle"></i>
                      <p>{statusUpdateOptions.find(opt => opt.value === newStatus)?.description}</p>
                    </div>
                  )}

                  <label>
                    Update Notes (Optional)
                    <textarea
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      placeholder="Add any additional notes about this status update..."
                      rows="3"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowStatusModal(false)}
                disabled={isUpdatingStatus}
              >
                <i className="fas fa-times"></i>
                Cancel
              </button>
              <button 
                className={`btn-primary ${isUpdatingStatus || !newStatus || newStatus === statusTicket.ticket_status ? 'disabled' : ''}`}
                onClick={handleSubmitStatusUpdate}
                disabled={isUpdatingStatus || !newStatus || newStatus === statusTicket.ticket_status}
              >
                {isUpdatingStatus ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sync-alt"></i>
                    Update Status
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedTicket && (
        <div className="modal-overlay">
          <div className="review-modal">
            <div className="modal-header">
              <h3>
                <i className="fas fa-star"></i>
                Submit Review Details
              </h3>
              <button className="close-btn" onClick={() => setShowReviewModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="selected-ticket">
                <div className="ticket-card">
                  <div className="ticket-info">
                    <h4>{selectedTicket.candidate_full_name}</h4>
                    <p>{selectedTicket.cemail}</p>
                    <span className="ticket-number">{selectedTicket.ticket_number}</span>
                  </div>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-section">
                  <h4>
                    <i className="fas fa-info-circle"></i>
                    Review Information
                  </h4>
                  <div className="form-fields">
                    <label>
                      Review Received Date *
                      <input
                        type="date"
                        value={reviewData.review_received_date}
                        onChange={(e) => setReviewData(prev => ({
                          ...prev,
                          review_received_date: e.target.value
                        }))}
                        required
                      />
                    </label>

                    <label>
                      Review Rating *
                      <select
                        value={reviewData.review_stars}
                        onChange={(e) => setReviewData(prev => ({
                          ...prev,
                          review_stars: parseInt(e.target.value)
                        }))}
                        required
                      >
                        <option value={5}>★★★★★ Excellent</option>
                        <option value={4}>★★★★☆ Very Good</option>
                        <option value={3}>★★★☆☆ Good</option>
                        <option value={2}>★★☆☆☆ Fair</option>
                        <option value={1}>★☆☆☆☆ Poor</option>
                      </select>
                    </label>

                    <label>
                      Review Platform
                      <select
                        value={reviewData.review_platform}
                        onChange={(e) => setReviewData(prev => ({
                          ...prev,
                          review_platform: e.target.value
                        }))}
                      >
                        <option value="google">Google</option>
                        <option value="glassdoor">Glassdoor</option>
                        <option value="indeed">Indeed</option>
                        <option value="other">Other</option>
                      </select>
                    </label>

                    <label>
                      Review URL
                      <input
                        type="url"
                        value={reviewData.review_url}
                        onChange={(e) => setReviewData(prev => ({
                          ...prev,
                          review_url: e.target.value
                        }))}
                        placeholder="https://..."
                      />
                    </label>
                  </div>
                </div>

                <div className="form-section">
                  <h4>
                    <i className="fas fa-comment-alt"></i>
                    Review Content
                  </h4>
                  <div className="form-fields">
                    <label>
                      Review Message *
                      <textarea
                        value={reviewData.review_message}
                        onChange={(e) => setReviewData(prev => ({
                          ...prev,
                          review_message: e.target.value
                        }))}
                        placeholder="Enter the review message from the candidate"
                        rows="6"
                        required
                      />
                    </label>

                    <label>
                      Review Screenshot
                      <div className="file-upload">
                        <input
                          type="file"
                          id="screenshot"
                          accept="image/*"
                          onChange={(e) => setReviewData(prev => ({
                            ...prev,
                            review_screenshot: e.target.files[0]
                          }))}
                        />
                        <label htmlFor="screenshot" className="file-label">
                          <i className="fas fa-upload"></i>
                          Choose Screenshot
                        </label>
                        {reviewData.review_screenshot && (
                          <span className="file-name">{reviewData.review_screenshot.name}</span>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowReviewModal(false)}
                disabled={isSubmitting}
              >
                <i className="fas fa-times"></i>
                Cancel
              </button>
              <button 
                className={`btn-primary ${isSubmitting || !reviewData.review_received_date || !reviewData.review_message ? 'disabled' : ''}`}
                onClick={handleReviewSubmit}
                disabled={isSubmitting || !reviewData.review_received_date || !reviewData.review_message}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-star"></i>
                    Submit Review
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackTickets;