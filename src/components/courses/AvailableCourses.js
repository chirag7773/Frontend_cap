import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Spinner, Alert, Modal, Badge } from 'react-bootstrap';
import { FaChalkboardTeacher, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AvailableCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  
  const auth = useAuth();
  const navigate = useNavigate();
  const { user } = auth;
  const token = user?.token;

  const fetchEnrolledCourses = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('http://localhost:5109/api/Courses/MyCourses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setEnrolledCourses(data.map(course => course.courseId));
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
    }
  };

  const fetchAvailableCourses = async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('http://localhost:5109/api/Courses', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch available courses');
      }

      const data = await response.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(`Failed to load courses: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAvailableCourses();
      fetchEnrolledCourses();
    } else {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleEnroll = async (courseId) => {
    if (enrolledCourses.includes(courseId)) {
      setModalMessage('You are already enrolled in this course');
      setIsSuccess(false);
      setShowEnrollModal(true);
      return;
    }

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setEnrolling(true);
      console.log('Attempting to enroll in course ID:', courseId);
      
      const response = await fetch(`http://localhost:5109/api/Courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors'
      });
      
      console.log('Enrollment response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Failed to enroll in course';
        try {
          const errorData = await response.json();
          console.error('Enrollment error details:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json().catch(() => ({}));
      console.log('Enrollment successful:', result);
      
      setEnrolledCourses(prev => [...prev, courseId]);
      setModalMessage('Successfully enrolled in the course!');
      setIsSuccess(true);
      setShowEnrollModal(true);
      
    } catch (error) {
      console.error('Enrollment error:', error);
      setModalMessage(error.message || 'An error occurred while enrolling in the course');
      setIsSuccess(false);
      setShowEnrollModal(true);
    } finally {
      setEnrolling(false);
    }
  };

  const handleCloseModal = () => {
    setShowEnrollModal(false);
    setModalMessage('');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Available Courses</h2>
          <p className="text-muted">Browse and enroll in new courses to expand your knowledge</p>
        </div>
      </div>

      {/* Enrollment Status Modal */}
      <Modal show={showEnrollModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton className={isSuccess ? 'bg-success text-white' : 'bg-danger text-white'}>
          <Modal.Title>
            {isSuccess ? (
              <FaCheckCircle className="me-2" />
            ) : (
              <FaExclamationCircle className="me-2" />
            )}
            {isSuccess ? 'Success' : 'Error'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          {isSuccess ? (
            <FaCheckCircle size={48} className="text-success mb-3" />
          ) : (
            <FaExclamationCircle size={48} className="text-danger mb-3" />
          )}
          <p className="lead">{modalMessage}</p>
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button variant={isSuccess ? 'success' : 'danger'} onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {courses.length === 0 ? (
        <Alert variant="info">
          No courses available at the moment. Please check back later.
        </Alert>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {courses.map((course) => (
            <Col key={course.courseId || course.id}>
              <Card className="h-100 shadow-sm">
                <div 
                  className="bg-light" 
                  style={{ 
                    height: '160px', 
                    backgroundImage: `url(${course.mediaUrl || 'https://placehold.co/600x400?text=Course'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {course.isNew && (
                    <span className="position-absolute top-0 end-0 m-2">
                      <Badge bg="success">New</Badge>
                    </span>
                  )}
                </div>
                <Card.Body>
                  <h5 className="card-title mb-3">{course.title}</h5>
                  <p className="card-text text-muted small mb-3">
                    <FaChalkboardTeacher className="me-1" />
                    {course.instructor}
                  </p>
                  
                  <p className="card-text small text-muted mb-3">
                    {course.description?.substring(0, 100)}{course.description?.length > 100 ? '...' : ''}
                  </p>
                  
                  <div className="d-grid">
                    {enrolledCourses.includes(course.id) ? (
                      <Button 
                        variant="outline-secondary" 
                        className="w-100"
                        disabled
                      >
                        Already Enrolled
                      </Button>
                    ) : (
                      <Button 
                        variant="primary" 
                        className="w-100"
                        onClick={() => handleEnroll(course.courseId || course.id)}
                        disabled={enrolling}
                      >
                        {enrolling ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Enrolling...
                          </>
                        ) : (
                          'Enroll Now'
                        )}
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default AvailableCourses;
