import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  FaUsers, 
  FaBookOpen,
  FaCalendarAlt,
  FaPlus
} from 'react-icons/fa';
import CreateCourseForm from './CreateCourseForm';

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0
  });
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get the current user from localStorage
      const userJson = localStorage.getItem('user');
      if (!userJson) {
        throw new Error('User not authenticated');
      }
      
      const user = JSON.parse(userJson);
      const token = user?.token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Fetch all courses for the instructor
      const [activeCoursesResponse, allCoursesResponse] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5109/api'}/Courses/ByInstructor/${user.userId}?activeOnly=true`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5109/api'}/Courses/ByInstructor/${user.userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);
      
      if (!activeCoursesResponse.ok || !allCoursesResponse.ok) {
        throw new Error('Failed to fetch courses data');
      }
      
      const [activeCourses, allCourses] = await Promise.all([
        activeCoursesResponse.json(),
        allCoursesResponse.json()
      ]);
      
      setStats({
        totalStudents: 0, // We'll implement this later
        activeCourses: activeCourses.length || 0
      });
      
      setCourses(allCourses);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Dashboard</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="mb-4">Instructor Dashboard</h1>
      
      {/* Stats Overview */}
      <Row className="g-4 mb-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-uppercase text-muted small mb-1">Total Students</h6>
                  {loading ? (
                    <div className="d-flex align-items-center">
                      <Spinner animation="border" size="sm" className="me-2" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <h2 className="mb-0">{stats.totalStudents}</h2>
                  )}
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
                  <FaUsers size={24} className="text-primary" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-uppercase text-muted small mb-1">Active Courses</h6>
                  {loading ? (
                    <div className="d-flex align-items-center">
                      <Spinner animation="border" size="sm" className="me-2" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <h2 className="mb-0">{stats.activeCourses}</h2>
                  )}
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded-circle">
                  <FaBookOpen size={24} className="text-success" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Stats */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Quick Stats</h5>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col md={6}>
              <div className="d-flex align-items-center p-3 bg-light rounded">
                <FaUsers size={24} className="text-primary me-3" />
                <div>
                  <div className="text-muted small">Total Students</div>
                  <div className="h4 mb-0">{stats.totalStudents}</div>
                </div>
              </div>
            </Col>
            <Col md={6}>
              <div className="d-flex align-items-center p-3 bg-light rounded">
                <FaBookOpen size={24} className="text-success me-3" />
                <div>
                  <div className="text-muted small">Active Courses</div>
                  <div className="h4 mb-0">{stats.activeCourses}</div>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* My Courses */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">My Courses</h5>
          <div className="d-flex align-items-center">
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={() => setShowCreateCourse(true)}
              className="me-2"
            >
              <FaPlus className="me-1" /> Create Course
            </Button>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={fetchDashboardData}
              title="Refresh courses"
            >
              <i className="bi bi-arrow-clockwise"></i>
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-2">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-5">
              <FaBookOpen size={48} className="text-muted mb-3" />
              <h5>No courses found</h5>
              <p className="text-muted mb-4">You haven't created any courses yet.</p>
              <Button variant="primary" onClick={() => setShowCreateCourse(true)}>
                Create Your First Course
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Course Title</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.courseId}>
                      <td className="align-middle">
                        {course.title}
                      </td>
                      <td className="text-end">
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          onClick={() => navigate(`/instructor/courses/${course.courseId}/assessments`)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Create Course Modal */}
      <CreateCourseForm 
        show={showCreateCourse}
        onClose={() => setShowCreateCourse(false)}
        onCourseCreated={(newCourse) => {
          console.log('New course created:', newCourse);
          // Refresh the dashboard data to get the latest counts
          fetchDashboardData();
          setShowCreateCourse(false);
          // Show success message or navigate to the new course
          // navigate(`/instructor/courses/${newCourse.courseId}`);
        }}
      />

      {/* Course Details Modal */}
      <Modal show={showCourseModal} onHide={() => setShowCourseModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Course Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCourse && (
            <div>
              <h4>{selectedCourse.title || 'Untitled Course'}</h4>
              <div className="mb-3">
                <h6>Description:</h6>
                <p>{selectedCourse.description || 'No description available.'}</p>
              </div>
              {selectedCourse.mediaUrl && (
                <div className="ratio ratio-16x9 mb-3">
                  <iframe 
                    src={selectedCourse.mediaUrl}
                    title={selectedCourse.title || 'Course Media'}
                    allowFullScreen
                    className="rounded"
                  />
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="primary"
            onClick={() => {
              if (selectedCourse) {
                navigate(`/instructor/courses/${selectedCourse.courseId}`);
              }
            }}
          >
            View Full Details
          </Button>
          <Button 
            variant="outline-primary"
            onClick={() => {
              if (selectedCourse) {
                navigate(`/instructor/courses/${selectedCourse.courseId}/assessments`);
              }
            }}
          >
            View Assessments
          </Button>
          <Button variant="secondary" onClick={() => setShowCourseModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default InstructorDashboard;
