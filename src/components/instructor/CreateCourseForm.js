import React, { useState } from 'react';
import { Form, Button, Modal, Alert, Spinner } from 'react-bootstrap';
import api from '../../services/api';

const CreateCourseForm = ({ show, onClose, onCourseCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mediaUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    console.log('User data from storage:', userData ? 'Found' : 'Not found');
    
    if (!userData) {
      console.error('No user data found in storage');
      setError('You need to be logged in to create a course. Please log in and try again.');
      setLoading(false);
      return;
    }

    let user;
    try {
      user = JSON.parse(userData);
      console.log('Parsed user data:', user);
    } catch (err) {
      console.error('Error parsing user data:', err);
      setError('Error reading user data. Please log in again.');
      setLoading(false);
      return;
    }

    const token = user?.token;
    if (!token) {
      console.error('No token found in user data');
      setError('Authentication token not found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      // Debug: Log the token to see its structure
      console.log('Token:', token);
      
      // Get token payload (second part of the JWT)
      const payload = token.split('.')[1];
      if (!payload) {
        throw new Error('Invalid token format');
      }
      
      // Decode base64 URL and parse JSON
      const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      console.log('Decoded token payload:', decodedPayload);
      
      // Get user ID from the 'sub' claim (standard JWT claim for subject)
      const userId = decodedPayload.sub;
      console.log('User ID from token sub claim:', userId);
      console.log('All token claims:', decodedPayload);
      
      if (!userId) {
        console.error('No user ID found in token claims');
        throw new Error('Could not find user ID in token claims. Available claims: ' + Object.keys(decodedPayload).join(', '));
      }

      // Ensure required fields are provided
      if (!formData.title || !formData.description) {
        throw new Error('Title and description are required');
      }

      const courseData = {
        title: formData.title,
        description: formData.description,
        mediaUrl: formData.mediaUrl || 'https://via.placeholder.com/300x200?text=Course+Image',
        instructorId: userId
      };

      console.log('Sending course data:', courseData);

      // Log the request details
      console.log('Sending request to /Courses with data:', JSON.stringify(courseData, null, 2));
      
      // Make the API request
      const response = await api.post('/Courses', courseData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Course created successfully:', response.data);
      onCourseCreated(response.data);
      onClose();
    } catch (err) {
      console.error('Error creating course:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText
      });
      
      // Parse error message from response if available
      let errorMessage = 'Failed to create course. Please try again.';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.errors) {
          // Handle validation errors
          const errors = Object.values(err.response.data.errors).flat();
          errorMessage = errors.join('\n');
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Create New Course</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form.Group className="mb-3">
            <Form.Label>Course Title</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter course title"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter course description"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Media URL</Form.Label>
            <Form.Control
              type="text"
              name="mediaUrl"
              value={formData.mediaUrl}
              onChange={handleInputChange}
              placeholder="Enter media URL (e.g., YouTube link) - Optional"
            />
            <Form.Text className="text-muted">
              Enter a URL to the course media (e.g., YouTube video)
            </Form.Text>
          </Form.Group>


        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Creating...
              </>
            ) : (
              'Create Course'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreateCourseForm;
