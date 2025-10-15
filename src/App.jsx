import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { isAuthenticated, getCurrentUser, checkAdminRole, isAdminAuthenticated } from './services/api';

// User Components
import Landing from './components/landing/landing';
import Login from './components/login/login';
import Register from './components/register/register';
import Dashboard from './components/dashboard/dashboard';
import RaiseReview from './components/raiseReview/raiseReview';
import TrackTickets from './components/trackTickets/trackTickets';
import ReviewHistory from './components/reviewHistory/reviewHistory';
import Profile from './components/profile/profile';
import Layout from './components/layout/layout';
import UserIncentives from './components/UserIncentives/UserIncentives';


// Admin Components
import AdminLayout from './components/admin/layout/AdminLayout';
import AdminDashboard from './components/admin/dashboard/AdminDashboard';
import AdminUserManagement from './components/admin/userManagement/AdminUserManagement';
import AdminTicketTracking from './components/admin/ticketTracking/AdminTicketTracking';
import AdminReviewHistory from './components/admin/reviewHistory/AdminReviewHistory';
import AdminExportData from './components/admin/exportData/AdminExportData';
import AdminIncentives from './components/admin/AdminIncentives/AdminIncentives';




// CRITICAL: Import App.css AFTER components to ensure our styles override
import './App.css';

// Protected Route Component for Users
const ProtectedRoute = ({ children }) => {
  const isAuth = isAuthenticated();
  
  console.log('ProtectedRoute - Authentication check:', isAuth);
  
  if (!isAuth) {
    console.log('ProtectedRoute - Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Protected Route Component for Admins
const AdminProtectedRoute = ({ children }) => {
  const isAuth = isAuthenticated();
  const user = getCurrentUser();
  const isAdmin = checkAdminRole();
  
  console.log('AdminProtectedRoute - Auth:', isAuth, 'User:', user, 'IsAdmin:', isAdmin);
  
  if (!isAuth) {
    console.log('AdminProtectedRoute - Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    console.log('AdminProtectedRoute - Not admin, redirecting to user dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  console.log('AdminProtectedRoute - Admin access granted');
  return children;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const isAuth = isAuthenticated();
  
  if (isAuth) {
    const user = getCurrentUser();
    const isAdmin = checkAdminRole();
    
    console.log('PublicRoute - Already authenticated. User:', user, 'IsAdmin:', isAdmin);
    
    if (isAdmin) {
      console.log('PublicRoute - Redirecting admin to admin dashboard');
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      console.log('PublicRoute - Redirecting user to user dashboard');
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  console.log('PublicRoute - Not authenticated, showing public content');
  return children;
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h1>Something went wrong</h1>
          <p>We're sorry, but something unexpected happened.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Helper function to determine redirect path based on user role
const getRedirectPath = () => {
  const isAuth = isAuthenticated();
  
  if (!isAuth) {
    console.log('getRedirectPath - Not authenticated, redirecting to landing');
    return '/';
  }
  
  const isAdmin = checkAdminRole();
  const redirectPath = isAdmin ? '/admin/dashboard' : '/dashboard';
  
  console.log('getRedirectPath - Authenticated. IsAdmin:', isAdmin, 'Redirecting to:', redirectPath);
  return redirectPath;
};

function App() {
  // Log app initialization
  React.useEffect(() => {
    console.log('App initialized');
    console.log('Current authentication status:', isAuthenticated());
    console.log('Current user:', getCurrentUser());
    console.log('Is admin:', checkAdminRole());
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#2d3748',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: "'Proxima Nova', sans-serif",
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                maxWidth: '400px',
              },
              success: {
                style: {
                  borderColor: '#4ecdc4',
                },
              },
              error: {
                style: {
                  borderColor: '#fd79a8',
                },
              },
            }}
          />
          
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/" 
              element={
                <PublicRoute>
                  <Landing />
                </PublicRoute>
              } 
            />
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />

            {/* Protected User Routes with Layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/raise-review"
              element={
                <ProtectedRoute>
                  <Layout>
                    <RaiseReview />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/track-tickets"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TrackTickets />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/review-history"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ReviewHistory />
                  </Layout>
                </ProtectedRoute>
              }
              
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Routes with Admin Layout */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminProtectedRoute>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminProtectedRoute>
                  <AdminLayout>
                    <AdminUserManagement />
                  </AdminLayout>
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/tickets"
              element={
                <AdminProtectedRoute>
                  <AdminLayout>
                    <AdminTicketTracking />
                  </AdminLayout>
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/reviews"
              element={
                <AdminProtectedRoute>
                  <AdminLayout>
                    <AdminReviewHistory />
                  </AdminLayout>
                </AdminProtectedRoute>
              }
            />
            <Route
                path="/admin/incentives"
                element={
                  <AdminProtectedRoute>
                    <AdminLayout>
                      <AdminIncentives />
                  </AdminLayout>
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/exports"
              element={
                <AdminProtectedRoute>
                  <AdminLayout>
                    <AdminExportData />
                  </AdminLayout>
                </AdminProtectedRoute>
              }
            />

            {/* Admin wildcard - catch all admin routes */}
            <Route 
              path="/admin/*" 
              element={
                <Navigate to={checkAdminRole() ? "/admin/dashboard" : "/dashboard"} replace />
              } 
            />

            {/* Catch all route - redirect based on authentication and role */}
            <Route 
              path="*" 
              element={
                <Navigate to={getRedirectPath()} replace />
              } 
            />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;