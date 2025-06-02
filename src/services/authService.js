import axios from 'axios';

const API_URL = 'http://localhost:5109/api/auth';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't tried to refresh yet
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user?.refreshToken) {
          const response = await axios.post(`${API_URL}/refresh-token`, {
            token: user.token,
            refreshToken: user.refreshToken
          });
          
          const newUser = {
            ...user,
            token: response.data.token,
            refreshToken: response.data.refreshToken
          };
          
          localStorage.setItem('user', JSON.stringify(newUser));
          originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
          return api(originalRequest);
        }
      } catch (error) {
        // If refresh token fails, logout the user
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export const login = async (email, password) => {
  console.log('=== AuthService: Login Request ===');
  console.log('Email:', email);
  
  try {
    const response = await api.post('/login', { email, password });
    
    console.log('=== AuthService: Raw Login Response ===');
    console.log('Status:', response.status, response.statusText);
    console.log('Response data:', response.data);
    
    if (!response.data) {
      throw new Error('No data received in login response');
    }
    
    // Log all response headers for debugging
    console.log('Response headers:');
    Object.entries(response.headers).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    // Ensure we have all required fields
    const requiredFields = ['token', 'userId'];
    const missingFields = requiredFields.filter(field => !response.data[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields in response:', missingFields);
      throw new Error(`Server response missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Normalize response data
    const responseData = {
      ...response.data,
      role: (response.data.role || 'student').toLowerCase(),
      // Ensure we have email in the response
      email: response.data.email || email
    };
    
    console.log('=== AuthService: Processed Login Data ===');
    console.log(JSON.stringify(responseData, null, 2));
    
    return responseData;
  } catch (error) {
    console.error('Login error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

export const register = async (userData) => {
  const response = await api.post('/register', userData);
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await api.post('/reset-password', { token, newPassword });
  return response.data;
};

export const refreshToken = async (token, refreshToken) => {
  const response = await api.post('/refresh-token', { token, refreshToken });
  return response.data;
};
