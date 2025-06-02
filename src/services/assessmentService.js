import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5109/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const createAssessment = async (assessmentData) => {
  try {
    const response = await api.post('/Assessments', assessmentData);
    return response.data;
  } catch (error) {
    console.error('Error creating assessment:', error);
    throw error.response?.data || error.message;
  }
};

export const getAssessmentsByCourse = async (courseId) => {
  try {
    const response = await api.get(`/Assessments/Course/${courseId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching assessments:', error);
    throw error.response?.data || error.message;
  }
};

export const getAssessmentById = async (assessmentId) => {
  try {
    const response = await api.get(`/Assessments/${assessmentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching assessment:', error);
    throw error.response?.data || error.message;
  }
};
