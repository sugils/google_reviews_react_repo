import React, { useState, useEffect } from 'react';
import { 
  getAllTicketsAdmin,
  getTicketDetailsAdmin,
  getOverdueTicketsAdmin,
  updateTicketStatusAdmin,
  bulkUpdateTicketStatusAdmin,
  bulkSendRemindersAdmin,
  getAllUsersAdmin,
  handleAdminApiError 
} from '../../../services/api';
import toast from 'react-hot-toast';
import './AdminTicketTracking.css';

const AdminTicketTracking = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    recruiter_id: '',
    date_from: '',
    date_to: '',
    overdue_only: false
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total_count: 0,
    total_pages: 0
  });
  const [recruiters, setRecruiters] = useState([]);
  const [selectedTicketDetails, setSelectedTicketDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    loadTickets();
    loadRecruiters();
  }, [filters, pagination.page, selectedTab]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      let response;
      
      if (selectedTab === 'overdue') {
        response = await getOverdueTicketsAdmin(0);
        setTickets(response.success ? response.data : []);
        setPagination(prev => ({ ...prev, total_count: response.data?.length || 0 }));
      } else {
        const params = {
          ...filters,
          page: pagination.page,
          limit: pagination.limit
        };
        response = await getAllTicketsAdmin(params);
        if (response.success) {
          setTickets(response.data.tickets);
          setPagination(prev => ({ ...prev, ...response.data.pagination }));
        }
      }
    } catch (error) {
      const errorMessage = handleAdminApiError(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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

  const handleViewDetails = async (ticketId) => {
    try {
      const response = await getTicketDetailsAdmin(ticketId);
      if (response.success) {
        setSelectedTicketDetails(response.data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      const errorMessage = handleAdminApiError(error);
      toast.error(errorMessage);
    }
  };

  const handleUpdateTicketStatus = async (ticketId, newStatus, notes = '') => {
    try {
      const response = await updateTicketStatusAdmin(ticketId, {
        ticket_status: newStatus,
        admin_notes: notes
      });
      
      if (response.success) {
        toast.success('Ticket status updated successfully');
        loadTickets();
        setShowDetailsModal(false);
      }
    } catch (error) {
      const errorMessage = handleAdminApiError(error);
      toast.error(errorMessage);
    }
  };

  const handleBulkStatusUpdate = async (status, notes) => {
    if (selectedTickets.length === 0) {
      toast.error('Please select tickets to update');
      return;
    }

    try {
      const response = await bulkUpdateTicketStatusAdmin(selectedTickets, status, notes);
      if (response.success) {
        toast.success(`Updated ${response.data.updated_count} tickets successfully`);
        setSelectedTickets([]);
        setShowBulkModal(false);
        loadTickets();
      }
    } catch (error) {
      const errorMessage = handleAdminApiError(error);
      toast.error(errorMessage);
    }
  };

  const handleBulkReminders = async () => {
    if (selectedTickets.length === 0) {
      toast.error('Please select tickets to send reminders');
      return;
    }

    try {
      const response = await bulkSendRemindersAdmin(selectedTickets);
      if (response.success) {
        toast.success(`Sent reminders for ${response.data.sent_count} tickets`);
        setSelectedTickets([]);
        loadTickets();
      }
    } catch (error) {
      const errorMessage = handleAdminApiError(error);
      toast.error(errorMessage);
    }
  };

  const handleTicketSelection = (ticketId) => {
    if (selectedTickets.includes(ticketId)) {
      setSelectedTickets(selectedTickets.filter(id => id !== ticketId));
    } else {
      setSelectedTickets([...selectedTickets, ticketId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedTickets.length === tickets.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(tickets.map(ticket => ticket.ticket_id));
    }
  };

  const openBulkModal = (action) => {
    setBulkAction(action);
    setShowBulkModal(true);
  };

  const getStatusIcon = (status) => {
    const icons = {
      'email_sent': 'fa-envelope',
      'in_progress': 'fa-spinner',
      'reminder_sent': 'fa-bell',
      'review_received': 'fa-star',
      'closed': 'fa-check-circle',
      'expired': 'fa-clock',
      'cancelled': 'fa-times-circle'
    };
    return icons[status] || 'fa-ticket-alt';
  };

  const getStatusColor = (status) => {
    const colors = {
      'email_sent': '#3b82f6',
      'in_progress': '#f59e0b',
      'reminder_sent': '#8b5cf6',
      'review_received': '#10b981',
      'closed': '#6b7280',
      'expired': '#ef4444',
      'cancelled': '#dc2626'
    };
    return colors[status] || '#6b7280';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'high': '#ef4444',
      'medium': '#f59e0b',
      'low': '#10b981'
    };
    return colors[priority] || '#6b7280';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredTickets = tickets.filter(ticket => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      ticket.ticket_number?.toLowerCase().includes(search) ||
      ticket.cfirstname?.toLowerCase().includes(search) ||
      ticket.clastname?.toLowerCase().includes(search) ||
      ticket.cemail?.toLowerCase().includes(search) ||
      ticket.recruiter_name?.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: pagination.total_count,
    overdue: tickets.filter(t => t.is_overdue).length,
    inProgress: tickets.filter(t => t.ticket_status === 'in_progress').length,
    completed: tickets.filter(t => t.ticket_status === 'review_received').length
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="ticket-loading">
        <div className="loading-spinner"></div>
        <p>Loading tickets...</p>
      </div>
    );
  }

  return (
    <div className="ticket-tracking-container">
      {/* Header */}
      <div className="module-header">
       
        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#3B82F6' }}>
              <i className="fas fa-ticket"></i>
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Review Tickets</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#EF4444' }}>
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.overdue}</span>
              <span className="stat-label">Overdue Tickets</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#F59E0B' }}>
              <i className="fas fa-spinner"></i>
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.inProgress}</span>
              <span className="stat-label">In Progress Tickets</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#10B981' }}>
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.completed}</span>
              <span className="stat-label">Completed Tickets</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="filters-left">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-tabs">
            <button
              className={`filter-tab ${selectedTab === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedTab('all')}
            >
              All Tickets
            </button>
            <button
              className={`filter-tab ${selectedTab === 'overdue' ? 'active' : ''}`}
              onClick={() => setSelectedTab('overdue')}
            >
              <i className="fas fa-exclamation-circle"></i>
              Overdue
            </button>
          </div>
        </div>

        <div className="filters-right">
          <select
            className="filter-select"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Status</option>
            <option value="email_sent">Email Sent</option>
            <option value="in_progress">In Progress</option>
            <option value="reminder_sent">Reminder Sent</option>
            <option value="review_received">Review Received</option>
            <option value="closed">Closed</option>
            <option value="expired">Expired</option>
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
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTickets.length > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-info">
            <span className="bulk-count">{selectedTickets.length}</span>
            <span>tickets selected</span>
          </div>
          <div className="bulk-actions">
            <button 
              className="bulk-btn"
              onClick={() => openBulkModal('in_progress')}
            >
              <i className="fas fa-play"></i>
              Mark In Progress
            </button>
            <button 
              className="bulk-btn primary"
              onClick={handleBulkReminders}
            >
              <i className="fas fa-bell"></i>
              Send Reminders
            </button>
            <button 
              className="bulk-btn success"
              onClick={() => openBulkModal('closed')}
            >
              <i className="fas fa-check"></i>
              Close Tickets
            </button>
            <button 
              className="bulk-btn danger"
              onClick={() => openBulkModal('expired')}
            >
              <i className="fas fa-times"></i>
              Mark Expired
            </button>
          </div>
        </div>
      )}

      {/* Tickets Table */}
      <div className="tickets-table-container">
        <table className="tickets-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <label className="custom-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedTickets.length === tickets.length && tickets.length > 0}
                    onChange={handleSelectAll}
                  />
                  <span className="checkbox-mark"></span>
                </label>
              </th>
              <th>Ticket</th>
              <th>Candidate</th>
              <th>Recruiter</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Dates</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map(ticket => (
              <tr key={ticket.ticket_id} className={ticket.is_overdue ? 'overdue-row' : ''}>
                <td className="checkbox-col">
                  <label className="custom-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedTickets.includes(ticket.ticket_id)}
                      onChange={() => handleTicketSelection(ticket.ticket_id)}
                    />
                    <span className="checkbox-mark"></span>
                  </label>
                </td>
                <td>
                  <div className="ticket-info">
                    <span className="ticket-number">#{ticket.ticket_number}</span>
                    <span className="ticket-id">ID: {ticket.ticket_id}</span>
                    {ticket.is_overdue && (
                      <span className="overdue-indicator">
                        <i className="fas fa-exclamation-triangle"></i>
                        Overdue
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="person-info">
                    <span className="person-name">
                      {ticket.cfirstname} {ticket.clastname}
                    </span>
                    <span className="person-email">{ticket.cemail}</span>
                    <span className="person-meta">
                      {ticket.job_title} at {ticket.client_name}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="person-info">
                    <span className="person-name">{ticket.recruiter_name}</span>
                    <span className="person-meta">ID: {ticket.recruiter_employee_id}</span>
                  </div>
                </td>
                <td>
                  <span 
                    className="status-badge"
                    style={{ 
                      backgroundColor: `${getStatusColor(ticket.ticket_status)}20`,
                      color: getStatusColor(ticket.ticket_status)
                    }}
                  >
                    <i className={`fas ${getStatusIcon(ticket.ticket_status)}`}></i>
                    {ticket.ticket_status.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <span 
                    className="priority-badge"
                    style={{
                      backgroundColor: `${getPriorityColor(ticket.priority)}20`,
                      color: getPriorityColor(ticket.priority)
                    }}
                  >
                    {ticket.priority || 'Normal'}
                  </span>
                </td>
                <td>
                  <div className="dates-info">
                    <span className="date-item">
                      <i className="fas fa-calendar-plus"></i>
                      {formatDate(ticket.review_request_date)}
                    </span>
                    <span className="date-item">
                      <i className="fas fa-calendar-check"></i>
                      {formatDate(ticket.review_due_date)}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="action-btn view"
                      onClick={() => handleViewDetails(ticket.ticket_id)}
                      title="View Details"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <select
                      className="action-select"
                      value={ticket.ticket_status}
                      onChange={(e) => handleUpdateTicketStatus(ticket.ticket_id, e.target.value)}
                      title="Change Status"
                    >
                      <option value="email_sent">Email Sent</option>
                      <option value="in_progress">In Progress</option>
                      <option value="reminder_sent">Reminder Sent</option>
                      <option value="review_received">Review Received</option>
                      <option value="closed">Closed</option>
                      <option value="expired">Expired</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTickets.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <h3>No tickets found</h3>
            <p>Try adjusting your filters or search criteria</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="pagination-bar">
          <div className="pagination-info">
            Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total_count)} - {Math.min(pagination.page * pagination.limit, pagination.total_count)} of {pagination.total_count} tickets
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

      {/* Ticket Details Modal */}
      {showDetailsModal && selectedTicketDetails && (
        <TicketDetailsModal
          ticket={selectedTicketDetails}
          onClose={() => setShowDetailsModal(false)}
          onStatusUpdate={handleUpdateTicketStatus}
        />
      )}

      {/* Bulk Action Modal */}
      {showBulkModal && (
        <BulkActionModal
          action={bulkAction}
          ticketCount={selectedTickets.length}
          onConfirm={(notes) => handleBulkStatusUpdate(bulkAction, notes)}
          onClose={() => setShowBulkModal(false)}
        />
      )}
    </div>
  );
};

// Ticket Details Modal Component
const TicketDetailsModal = ({ ticket, onClose, onStatusUpdate }) => {
  const [newStatus, setNewStatus] = useState(ticket.ticket_status);
  const [notes, setNotes] = useState('');

  const handleStatusUpdate = () => {
    onStatusUpdate(ticket.ticket_id, newStatus, notes);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ticket-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <i className="fas fa-ticket-alt"></i>
            <h2>Ticket #{ticket.ticket_number}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="modal-body">
          <div className="detail-sections">
            <div className="detail-card">
              <div className="detail-card-header">
                <i className="fas fa-user"></i>
                <h3>Candidate Information</h3>
              </div>
              <div className="detail-items">
                <div className="detail-item">
                  <label>Name</label>
                  <span>{ticket.cfirstname} {ticket.clastname}</span>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <span>{ticket.cemail}</span>
                </div>
                <div className="detail-item">
                  <label>Position</label>
                  <span>{ticket.job_title}</span>
                </div>
                <div className="detail-item">
                  <label>Company</label>
                  <span>{ticket.client_name}</span>
                </div>
                <div className="detail-item">
                  <label>Start Date</label>
                  <span>{ticket.start_date || 'Not specified'}</span>
                </div>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-card-header">
                <i className="fas fa-user-tie"></i>
                <h3>Recruiter Information</h3>
              </div>
              <div className="detail-items">
                <div className="detail-item">
                  <label>Name</label>
                  <span>{ticket.recruiter_full_name}</span>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <span>{ticket.recruiter_email}</span>
                </div>
                <div className="detail-item">
                  <label>Employee ID</label>
                  <span>{ticket.recruiter_employee_id}</span>
                </div>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-card-header">
                <i className="fas fa-info-circle"></i>
                <h3>Ticket Status</h3>
              </div>
              <div className="detail-items">
                <div className="detail-item">
                  <label>Current Status</label>
                  <span className="status-badge">{ticket.ticket_status.replace('_', ' ')}</span>
                </div>
                <div className="detail-item">
                  <label>Priority</label>
                  <span className="priority-badge">{ticket.priority || 'Normal'}</span>
                </div>
                <div className="detail-item">
                  <label>Request Date</label>
                  <span>{new Date(ticket.review_request_date).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <label>Due Date</label>
                  <span>{new Date(ticket.review_due_date).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <label>Reminders Sent</label>
                  <span>{ticket.reminder_sent_count || 0}</span>
                </div>
              </div>
            </div>

            {ticket.review_stars && (
              <div className="detail-card full-width">
                <div className="detail-card-header">
                  <i className="fas fa-star"></i>
                  <h3>Review Details</h3>
                </div>
                <div className="detail-items">
                  <div className="detail-item">
                    <label>Rating</label>
                    <span className="star-rating">
                      {[...Array(5)].map((_, i) => (
                        <i 
                          key={i} 
                          className={`fas fa-star ${i < ticket.review_stars ? 'filled' : ''}`}
                        ></i>
                      ))}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Received Date</label>
                    <span>{new Date(ticket.review_received_date).toLocaleDateString()}</span>
                  </div>
                  {ticket.review_message && (
                    <div className="detail-item full-width">
                      <label>Review Message</label>
                      <p className="review-text">{ticket.review_message}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="detail-card full-width">
              <div className="detail-card-header">
                <i className="fas fa-edit"></i>
                <h3>Update Status</h3>
              </div>
              <div className="update-form">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="status-select"
                >
                  <option value="email_sent">Email Sent</option>
                  <option value="in_progress">In Progress</option>
                  <option value="reminder_sent">Reminder Sent</option>
                  <option value="review_received">Review Received</option>
                  <option value="closed">Closed</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <textarea
                  placeholder="Add notes for this status update..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="notes-input"
                  rows="3"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn-primary"
            onClick={handleStatusUpdate}
            disabled={newStatus === ticket.ticket_status && !notes}
          >
            <i className="fas fa-save"></i>
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
};

// Bulk Action Modal Component
const BulkActionModal = ({ action, ticketCount, onConfirm, onClose }) => {
  const [notes, setNotes] = useState('');

  const actionLabels = {
    'in_progress': 'Mark as In Progress',
    'closed': 'Close Tickets',
    'expired': 'Mark as Expired'
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content bulk-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <i className="fas fa-tasks"></i>
            <h2>Bulk Action Confirmation</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="modal-body">
          <div className="bulk-confirm-message">
            <p>You are about to <strong>{actionLabels[action]}</strong> for <strong>{ticketCount} tickets</strong>.</p>
            <p>This action cannot be undone.</p>
          </div>
          
          <div className="bulk-notes">
            <label>Add notes (optional)</label>
            <textarea
              placeholder="Enter any notes for this bulk action..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="4"
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn-primary"
            onClick={() => onConfirm(notes)}
          >
            <i className="fas fa-check"></i>
            Confirm Action
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminTicketTracking;