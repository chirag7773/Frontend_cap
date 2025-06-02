import axios from 'axios';

// Use environment variable if available, otherwise fall back to localhost
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5109/api';

console.log('API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  (config) => {
    console.log('=== API Request Interceptor ===');
    console.log(`[${new Date().toISOString()}] ${config.method.toUpperCase()} ${config.url}`);
    
    try {
      // Get user from localStorage
      const userJson = localStorage.getItem('user');
      console.log('Raw user data from localStorage:', userJson ? 'exists' : 'not found');
      
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          console.log('User ID from localStorage:', user?.userId);
          console.log('User role:', user?.role);
          
          if (user?.token) {
            console.log('JWT token found, adding to Authorization header');
            config.headers.Authorization = `Bearer ${user.token}`;
            
            // Log token details (first part only for security)
            const tokenParts = user.token.split('.');
            if (tokenParts.length >= 2) {
              try {
                const payload = JSON.parse(atob(tokenParts[1]));
                console.log('Token payload:', {
                  userId: payload.nameid,
                  email: payload.email,
                  roles: payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
                  exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'N/A',
                  iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'N/A'
                });
              } catch (e) {
                console.warn('Could not parse token payload:', e.message);
              }
            }
          } else {
            console.warn('No token found in user object');
          }
        } catch (parseError) {
          console.error('Error parsing user data from localStorage:', parseError);
        }
      } else {
        console.warn('No user data found in localStorage');
      }
      
      // Log request details
      console.log('Request details:', {
        method: config.method.toUpperCase(),
        url: config.url,
        headers: Object.keys(config.headers).reduce((acc, key) => {
          if (key.toLowerCase() === 'authorization') {
            acc[key] = 'Bearer [REDACTED]';
          } else {
            acc[key] = config.headers[key];
          }
          return acc;
        }, {})
      });
      
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Response error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      responseData: error.response?.data
    });
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.warn('Authentication error - redirecting to login');
      // Clear invalid user data
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Get enrolled courses for the current student
export const getEnrolledCourses = async () => {
  console.log('=== [API] getEnrolledCourses called ===');
  
  // Get user from localStorage
  const userJson = localStorage.getItem('user');
  if (!userJson) {
    console.error('[API] No user data found in localStorage');
    throw new Error('User not authenticated');
  }

  let user;
  try {
    user = JSON.parse(userJson);
    console.log('[API] Current user:', {
      userId: user.userId,
      email: user.email,
      role: user.role,
      hasToken: !!user.token,
      tokenPrefix: user.token ? `${user.token.substring(0, 10)}...` : 'No token'
    });
  } catch (e) {
    console.error('[API] Error parsing user data:', e);
    throw new Error('Invalid user data');
  }

  // Validate required fields
  if (!user.token) {
    console.error('[API] No authentication token found');
    throw new Error('Authentication token missing');
  }
  
  try {
    console.log('[API] Sending GET request to /api/Courses/MyCourses');
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:5109/api/Courses/MyCourses', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      credentials: 'include' // Important for cookies/auth
    });
    
    const endTime = Date.now();
    console.log(`[API] Request completed in ${endTime - startTime}ms`);
    
    // Log response details
    console.log('[API] Response status:', response.status, response.statusText);
    
    const responseData = await response.json().catch(e => ({}));
    
    if (!response.ok) {
      console.error('[API] Error response:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });
      throw new Error(responseData.message || 'Failed to fetch courses');
    }
    
    console.log('[API] Response data:', responseData);
    
    if (!Array.isArray(responseData)) {
      console.error('[API] Invalid response format, expected array:', responseData);
      return [];
    }
    
    return responseData;
  } catch (error) {
    console.error('[API] Error in getEnrolledCourses:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Get user stats
export const getUserStats = async () => {
  try {
    const response = await api.get('/users/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
};

// Get course by ID
export const getCourseById = async (id) => {
  try {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching course ${id}:`, error);
    throw error;
  }
};

// Get all available courses
export const getAllCourses = async () => {
  try {
    const response = await api.get('/courses');
    return response.data;
  } catch (error) {
    console.error('Error fetching all courses:', error);
    throw error;
  }
};

// Enroll in a course
export const enrollInCourse = async (courseId) => {
  try {
    const response = await api.post(`/courses/${courseId}/enroll`);
    return response.data;
  } catch (error) {
    console.error(`Error enrolling in course ${courseId}:`, error);
    throw error;
  }
};


