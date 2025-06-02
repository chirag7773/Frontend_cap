import React from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Register from './components/auth/Register';
import StudentDashboard from './components/dashboard/StudentDashboard';
import StudentHome from './components/dashboard/StudentHome';
import InstructorDashboard from './components/instructor/InstructorDashboard';
import CourseDetails from './components/instructor/CourseDetails';
import CourseAssessments from './components/instructor/CourseAssessments';
import AssessmentView from './components/assessments/AssessmentView';
import { TakeAssessment } from './components/assessments/TakeAssessment';
import AssessmentResults from './components/assessments/AssessmentResults';
import EnrolledCourses from './components/dashboard/EnrolledCourses';
import AvailableCourses from './components/courses/AvailableCourses';
import ErrorBoundary from './components/common/ErrorBoundary';
import Navbar from './components/layout/Navbar';
import Profile from './pages/Profile';

// Layout components
const AuthLayout = ({ children }) => (
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
    {children}
  </div>
);

const DashboardLayout = ({ hideSidebar = false }) => {
  const { user, loading } = useAuth();
  
  // Don't render anything until we've finished loading the auth state
  if (loading) {
    return <div className="text-center p-5">Loading...</div>;
  }
  
  // If there's no user, we should have been redirected by ProtectedRoute
  if (!user) {
    return null;
  }
  
  return (
    <div className="min-vh-100 bg-light">
      {!hideSidebar && <Navbar />}
      <div className={hideSidebar ? "" : "container py-4"}>
        <Outlet />
      </div>
    </div>
  );
};

// Protected Route component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Add debug logging
  console.log('ProtectedRoute - User:', user, 'Required role:', requiredRole, 'Loading:', loading);

  // Show loading state while checking auth
  if (loading) {
    return <div className="text-center p-5">Loading...</div>;
  }

  // If no user is logged in, redirect to login
  if (!user) {
    console.log('ProtectedRoute - No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Normalize the role for comparison
  const userRole = user.role ? user.role.toString().toLowerCase().trim() : 'student';
  const normalizedRequiredRole = requiredRole ? requiredRole.toString().toLowerCase().trim() : null;

  console.log('ProtectedRoute - Role check:', {
    userRole,
    normalizedRequiredRole,
    rolesMatch: userRole === normalizedRequiredRole
  });

  // If no specific role is required, grant access
  if (!normalizedRequiredRole) {
    console.log('ProtectedRoute - No role required, access granted');
    return children;
  }

  // Check if user has the required role
  if (userRole !== normalizedRequiredRole) {
    console.log('ProtectedRoute - Unauthorized access. User role:', userRole, 'Required role:', normalizedRequiredRole);
    // Redirect to appropriate dashboard based on user's actual role
    const redirectPath = userRole === 'instructor' ? '/instructor' : '/student';
    console.log('ProtectedRoute - Redirecting to:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  console.log('ProtectedRoute - Access granted to:', location.pathname);
  return children;
};

// Home component
const Home = () => (
  <div className="text-center p-4 bg-white rounded shadow">
    <h1>Welcome to EduSync</h1>
    <p>Your learning management system</p>
    <div className="d-grid gap-2">
      <Link to="/login" className="btn btn-primary">Login</Link>
      <Link to="/register" className="btn btn-outline-primary">Register as Student</Link>
    </div>
  </div>
);

// Login component
const Login = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Remove unused 'from' variable

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      console.log('Login: Form submitted with email:', email);
      
      const result = await login(email, password);
      console.log('Login: Login result received:', {
        success: result.success,
        user: result.user ? {
          email: result.user.email,
          role: result.user.role,
          hasToken: !!result.user.token
        } : 'No user data'
      });
      
      if (result.success) {
        // Get the latest user data from localStorage to ensure we have the most recent state
        const userFromStorage = JSON.parse(localStorage.getItem('user'));
        console.log('Login: User data from localStorage:', userFromStorage);
        
        if (!userFromStorage) {
          throw new Error('No user data available in localStorage after login');
        }
        
        // Normalize the role with validation
        const role = (userFromStorage.role || 'student').toString().toLowerCase().trim();
        console.log('Login: Normalized role:', role);
        
        // Determine the dashboard path based on role
        const dashboardPath = role === 'instructor' ? '/instructor' : '/student';
        console.log('Login: Navigating to:', dashboardPath);
        
        // Force a small delay to ensure the auth context is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Navigate to the appropriate dashboard
        navigate(dashboardPath, { 
          replace: true,
          state: { from: location.state?.from || '/' }
        });
      } else {
        console.error('Login failed:', result.error);
        setError(result.error || 'Failed to log in');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4" style={{ width: '100%', maxWidth: '400px' }}>
      <h2 className="text-center mb-4">Login</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input 
            type="email" 
            className="form-control" 
            id="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <div className="input-group">
            <input 
              type={showPassword ? "text" : "password"} 
              className="form-control" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
            <button 
              className="btn btn-outline-secondary d-flex align-items-center justify-content-center" 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{
                width: '42px',
                transition: 'all 0.3s ease',
                borderTopLeftRadius: '0',
                borderBottomLeftRadius: '0',
                borderLeft: 'none'
              }}
            >
              {showPassword ? (
                <i className="bi bi-eye-slash-fill text-primary" style={{ fontSize: '1.1rem' }}></i>
              ) : (
                <i className="bi bi-eye-fill text-primary" style={{ fontSize: '1.1rem' }}></i>
              )}
            </button>
          </div>
        </div>
        <button 
          type="submit" 
          className="btn btn-primary w-100 mb-3"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <div className="text-center">
          <span className="text-muted">Don't have an account? </span>
          <Link to="/register">Register here</Link>
        </div>
      </form>
    </div>
  );
};

// Main App component that wraps everything with AuthProvider
function App() {
  return (
    <>
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        <AuthLayout>
          <Home />
        </AuthLayout>
      } />
      
      <Route path="/login" element={
        <AuthLayout>
          <Login />
        </AuthLayout>
      } />
      
      <Route path="/register" element={
        <AuthLayout>
          <Register />
        </AuthLayout>
      } />
      
      {/* Protected Student Routes */}
      <Route path="/student" element={
        <ProtectedRoute requiredRole="student">
          <DashboardLayout>
            <StudentDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentHome />} />
        <Route path="available-courses" element={<AvailableCourses />} />
        <Route path="courses" element={<EnrolledCourses />} />
        <Route path="courses/:courseId/assessments" element={<AssessmentView />} />
        <Route path="results" element={<AssessmentResults />} />
        <Route path="profile" element={<Profile />} />
        
        {/* Special route for taking assessments with hidden sidebar */}
        <Route path="assessments/:assessmentId/take" element={
          <ProtectedRoute requiredRole="student">
            <DashboardLayout hideSidebar={true}>
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </DashboardLayout>
          </ProtectedRoute>
        }>
          <Route index element={<TakeAssessment />} />
        </Route>
        
        {/* Instructor Profile Route - This should probably be moved to instructor routes */}
        <Route path="instructor/profile" element={
          <ProtectedRoute requiredRole="instructor">
            <DashboardLayout>
              <Profile />
            </DashboardLayout>
          </ProtectedRoute>
        } />
      </Route>
      
      {/* Instructor Routes */}
      <Route path="/instructor" element={
        <ProtectedRoute requiredRole="instructor">
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<InstructorDashboard />} />
        <Route path="courses/:courseId" element={<CourseDetails />} />
        <Route path="courses/:courseId/assessments" element={<CourseAssessments />}>
          <Route index element={<CourseAssessments />} />
          <Route path="create" element={<Navigate to="/instructor/courses/:courseId/assessments" replace />} />
        </Route>
      </Route>
      
      {/* Catch all other routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default App;
