import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in on initial load
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          console.log('No user data found in localStorage');
          setLoading(false);
          return;
        }

        const currentUser = JSON.parse(storedUser);
        console.log('Found user in localStorage:', currentUser);
        
        if (currentUser?.token) {
          // Verify the token is still valid
          try {
            // Add a simple token validation (you might want to add actual token validation)
            const tokenParts = currentUser.token.split('.');
            if (tokenParts.length !== 3) {
              throw new Error('Invalid token format');
            }
            
            // Set the user in context
            setUser(currentUser);
            console.log('User authenticated successfully');
          } catch (err) {
            console.error('Invalid token:', err);
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
        // Clear invalid user data
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
    
    // Set up storage event listener to sync auth state across tabs
    const handleStorageChange = (event) => {
      if (event.key === 'user') {
        if (!event.newValue) {
          // User logged out in another tab
          setUser(null);
        } else {
          // User data updated in another tab
          try {
            const updatedUser = JSON.parse(event.newValue);
            setUser(updatedUser);
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (email, password) => {
    try {
      setError('');
      console.log('=== AuthContext: Login Attempt ===');
      console.log('Email:', email);
      
      // Call the login service
      console.log('Calling authService.login()...');
      const response = await authService.login(email, password);
      
      if (!response) {
        const error = new Error('No response received from server');
        console.error('Login error:', error);
        throw error;
      }
      
      console.log('=== Login Response ===');
      console.log('Response keys:', Object.keys(response));
      console.log('Has token:', !!response.token);
      console.log('Has refresh token:', !!response.refreshToken);
      console.log('User ID:', response.userId);
      console.log('Role:', response.role);
      
      // Validate response structure
      if (!response.token) {
        throw new Error('No authentication token received');
      }
      
      if (!response.userId) {
        console.warn('No user ID in login response');
      }
      
      // Normalize role
      const normalizedRole = response.role?.toLowerCase();
      console.log('Normalized role:', normalizedRole);
      
      if (!normalizedRole) {
        console.warn('No role specified in login response');
      }
      
      // Normalize the role with proper validation
      let role = 'student'; // Default role
      if (response.role) {
        role = response.role.toString().toLowerCase().trim();
        if (!['student', 'instructor'].includes(role)) {
          console.warn('AuthContext: Unexpected role value, defaulting to student:', role);
          role = 'student';
        }
      } else {
        console.warn('AuthContext: No role in response, using default');
      }
      
      console.log('AuthContext: Final role after processing:', role);
      
      // Create user object with all necessary fields
      const user = {
        email: response.email || email,
        token: response.token,
        refreshToken: response.refreshToken,
        role: role,
        userId: response.userId,
        name: response.name || email.split('@')[0] // Default name from email if not provided
      };

      console.log('=== Storing User Data ===');
      console.log('User object to store:', JSON.stringify(user, null, 2));
      
      // Save user to state and localStorage
      try {
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Verify storage
        const storedUser = localStorage.getItem('user');
        console.log('Stored user data:', storedUser);
        
        if (!storedUser) {
          throw new Error('Failed to store user data in localStorage');
        }
        
        console.log('User data stored successfully');
        
        // Navigate based on role
        const redirectPath = role === 'instructor' ? '/instructor' : '/student';
        console.log('Navigating to:', redirectPath);
        navigate(redirectPath);
        
      } catch (storageError) {
        console.error('Error storing user data:', storageError);
        throw new Error('Failed to save authentication data. Please try again.');
      }
      return { success: true, user: user };
    } catch (err) {
      console.error('AuthContext: Login error:', err);
      const errorMessage = err.response?.data || err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      setError('');
      // Ensure the role is set to student for registration
      const registrationData = {
        ...userData,
        role: 'student' // Force role to be student for registration
      };
      await authService.register(registrationData);
      return { success: true };
    } catch (err) {
      console.error('Registration error:', err);
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      // Optionally call logout API if you have one
      // await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      setUser(null);
      navigate('/login');
    }
  };

  const value = {
    user,
    setUser, // Expose setUser in the context
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user?.token,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
