import React, { useState, useEffect } from 'react';
import { 
  Users, Ticket, BarChart3, TrendingUp, AlertTriangle, 
  CheckCircle, Clock, Mail, Download, RefreshCw, Eye
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer
} from 'recharts';
import './adminDashboard.css';
import { 
  getAdminDashboardStats, 
  getAllUsers, 
  getAllTickets 
} from '../../services/api';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [dashStats, usersData, ticketsData] = await Promise.all([
        getAdminDashboardStats(),
        getAllUsers(),
        getAllTickets()
      ]);

      if (dashStats.success) {
        setDashboardData(dashStats.data);
      }

      if (usersData.success) {
        setRecentUsers(usersData.data.slice(0, 5));
      }

      if (ticketsData.success) {
        setRecentTickets(ticketsData.data.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data for demonstration (replace with actual API data)
  const stats = dashboardData || {
    total_users: 45,
    active_users: 38,
    total_tickets: 156,
    pending_tickets: 23,
    completed_tickets: 98,
    success_rate: 85.2,
    monthly_growth: 12.5
  };

  const pieColors = ['#667eea', '#4ecdc4', '#ffeaa7', '#fd79a8'];
  
  const pieData = [
    { name: 'Completed', value: stats.completed_tickets, color: '#4ecdc4' },
    { name: 'Pending', value: stats.pending_tickets, color: '#ffeaa7' },
    { name: 'In Progress', value: 35, color: '#667eea' },
    { name: 'Overdue', value: 8, color: '#fd79a8' }
  ];

  const monthlyData = [
    { month: 'Jan', users: 32, tickets: 120, reviews: 89 },
    { month: 'Feb', users: 38, tickets: 135, reviews: 102 },
    { month: 'Mar', users: 42, tickets: 148, reviews: 118 },
    { month: 'Apr', users: 45, tickets: 156, reviews: 133 },
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="loading-spinner large"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-header">
        <div className="header-info">
          <h1>Admin Dashboard</h1>
          <p>System overview and management center</p>
        </div>
        <div className="header-actions">
          <button className="refresh-button" onClick={fetchAdminData}>
            <RefreshCw size={16} />
            Refresh Data
          </button>
          <button className="export-button">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="admin-stats-grid">
        <div className="stat-card users">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <div className="stat-number">{stats.total_users}</div>
            <div className="stat-change positive">
              <TrendingUp size={12} />
              +{stats.monthly_growth}% this month
            </div>
          </div>
        </div>

        <div className="stat-card active-users">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Active Users</h3>
            <div className="stat-number">{stats.active_users}</div>
            <div className="stat-change">
              {Math.round((stats.active_users / stats.total_users) * 100)}% active rate
            </div>
          </div>
        </div>

        <div className="stat-card tickets">
          <div className="stat-icon">
            <Ticket size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Tickets</h3>
            <div className="stat-number">{stats.total_tickets}</div>
            <div className="stat-change">
              {stats.pending_tickets} pending
            </div>
          </div>
        </div>

        <div className="stat-card success-rate">
          <div className="stat-icon">
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
            <h3>Success Rate</h3>
            <div className="stat-number">{stats.success_rate}%</div>
            <div className="stat-change positive">
              <TrendingUp size={12} />
              Excellent performance
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="admin-charts-section">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Ticket Status Distribution</h3>
            <p>Current status breakdown of all tickets</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Monthly Performance Trends</h3>
            <p>Users, tickets, and reviews over time</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#667eea" 
                  strokeWidth={3}
                  name="Users"
                />
                <Line 
                  type="monotone" 
                  dataKey="tickets" 
                  stroke="#4ecdc4" 
                  strokeWidth={3}
                  name="Tickets"
                />
                <Line 
                  type="monotone" 
                  dataKey="reviews" 
                  stroke="#fd79a8" 
                  strokeWidth={3}
                  name="Reviews"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* System Activity */}
      <div className="system-activity-section">
        <div className="activity-card recent-users">
          <div className="activity-header">
            <h3>Recent User Registrations</h3>
            <button className="view-all-btn">
              <Eye size={14} />
              View All Users
            </button>
          </div>
          <div className="activity-list">
            {recentUsers.map((user, index) => (
              <div key={user.user_id || index} className="activity-item">
                <div className="user-avatar">
                  <Users size={16} />
                </div>
                <div className="activity-content">
                  <h4>{user.user_name || `User ${index + 1}`}</h4>
                  <p>{user.user_email || `user${index + 1}@example.com`}</p>
                  <span className="activity-meta">
                    {user.geo_location || 'US'} • {user.business_function || 'IT'}
                  </span>
                </div>
                <div className="activity-time">
                  <span>{user.created_at ? formatDate(user.created_at) : '2 days ago'}</span>
                  <span className={`user-status ${user.is_active !== false ? 'active' : 'inactive'}`}>
                    {user.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="activity-card recent-tickets">
          <div className="activity-header">
            <h3>Recent Ticket Activity</h3>
            <button className="view-all-btn">
              <Eye size={14} />
              View All Tickets
            </button>
          </div>
          <div className="activity-list">
            {recentTickets.map((ticket, index) => (
              <div key={ticket.ticket_id || index} className="activity-item">
                <div className="ticket-icon">
                  <Ticket size={16} />
                </div>
                <div className="activity-content">
                  <h4>Ticket #{ticket.ticket_id || `RT00${index + 1}`}</h4>
                  <p>{ticket.candidate_full_name || `Candidate ${index + 1}`}</p>
                  <span className="activity-meta">
                    {ticket.geo_location || 'US'} • {ticket.job_title || 'Software Developer'}
                  </span>
                </div>
                <div className="activity-time">
                  <span>{ticket.created_at ? formatDate(ticket.created_at) : '1 day ago'}</span>
                  <span className={`ticket-status ${ticket.ticket_status || 'in_progress'}`}>
                    {ticket.ticket_status || 'In Progress'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Alerts */}
      <div className="system-alerts">
        <div className="alert-card warning">
          <AlertTriangle size={20} />
          <div className="alert-content">
            <h4>Overdue Tickets</h4>
            <p>8 tickets are overdue and require immediate attention</p>
          </div>
          <button className="alert-action">View Details</button>
        </div>

        <div className="alert-card info">
          <Clock size={20} />
          <div className="alert-content">
            <h4>System Maintenance</h4>
            <p>Scheduled maintenance on Sunday, 2 AM - 4 AM EST</p>
          </div>
          <button className="alert-action">Schedule</button>
        </div>

        <div className="alert-card success">
          <CheckCircle size={20} />
          <div className="alert-content">
            <h4>Performance Update</h4>
            <p>System performance improved by 15% this month</p>
          </div>
          <button className="alert-action">View Report</button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="admin-quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-card">
            <Users size={24} />
            <h4>Manage Users</h4>
            <p>Add, edit, or deactivate user accounts</p>
          </button>
          
          <button className="action-card">
            <Ticket size={24} />
            <h4>Review Tickets</h4>
            <p>Monitor and manage all review tickets</p>
          </button>
          
          <button className="action-card">
            <BarChart3 size={24} />
            <h4>Generate Reports</h4>
            <p>Create detailed analytics reports</p>
          </button>
          
          <button className="action-card">
            <Mail size={24} />
            <h4>Email Templates</h4>
            <p>Manage email templates and settings</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;