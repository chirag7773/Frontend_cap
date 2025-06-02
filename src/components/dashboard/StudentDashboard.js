import React from 'react';
import { Container, Row, Col, Nav, Card, Button } from 'react-bootstrap';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  FaHome,
  FaBook,
  FaClipboardCheck,
  FaSearch,
  FaSignOutAlt
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

// REMOVED: All component imports since we're using nested routing
// import EnrolledCourses from './EnrolledCourses';
// import AssessmentResults from './AssessmentResults';
// import AssessmentView from '../assessments/AssessmentView';
// import AvailableCourses from '../courses/AvailableCourses';

const StudentDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const userName = currentUser?.name || 'Student';

  console.log('🎯 StudentDashboard rendered, current path:', location.pathname);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <Container fluid className="vh-100 bg-light p-0">
      {/* Header */}
      <div className="bg-primary text-white p-3">
        <Container>
          <Row className="align-items-center">
            <Col>
              <h2 className="mb-0">{getGreeting()}, {userName}!</h2>
              <p className="mb-0 opacity-75">Welcome back to your learning dashboard</p>
            </Col>
            <Col xs="auto" className="d-flex align-items-center">
              <Button 
                variant="outline-light" 
                size="sm" 
                className="me-3"
                as={Link}
                to="/student/available-courses"
              >
                <FaSearch className="me-1" />
                Browse Courses
              </Button>
              <small>{new Date().toLocaleDateString()}</small>
            </Col>
          </Row>
        </Container>
      </div>

      <Container fluid className="h-100 p-0">
        <Row className="h-100 m-0">
          {/* Sidebar */}
          <Col md={3} className="bg-white shadow-sm p-0">
            <div className="p-3">
              <div className="text-center mb-4">
                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center" 
                     style={{width: '60px', height: '60px', fontSize: '24px'}}>
                  {userName.charAt(0).toUpperCase()}
                </div>
                <h6 className="mt-2 mb-0">{userName}</h6>
                <small className="text-muted">● Online</small>
              </div>
              
              <Nav variant="pills" className="flex-column">
                <Nav.Item className="mb-2">
                  <Nav.Link 
                    as={Link} 
                    to="/student" 
                    className={`d-flex align-items-center ${location.pathname === '/student' ? 'active' : ''}`}
                  >
                    <FaHome className="me-2" /> Home
                  </Nav.Link>
                </Nav.Item>
                
                <Nav.Item className="mb-2">
                  <Nav.Link 
                    as={Link} 
                    to="/student/courses"
                    className={`d-flex align-items-center ${location.pathname.startsWith('/student/courses') ? 'active' : ''}`}
                  >
                    <FaBook className="me-2" /> My Courses
                  </Nav.Link>
                </Nav.Item>
                
                <Nav.Item className="mb-2">
                  <Nav.Link 
                    as={Link} 
                    to="/student/available-courses"
                    className={`d-flex align-items-center ${location.pathname === '/student/available-courses' ? 'active' : ''}`}
                  >
                    <FaSearch className="me-2" /> Browse Courses
                  </Nav.Link>
                </Nav.Item>
                
                <Nav.Item className="mb-2">
                  <Nav.Link 
                    as={Link} 
                    to="/student/results"
                    className={`d-flex align-items-center ${location.pathname === '/student/results' ? 'active' : ''}`}
                  >
                    <FaClipboardCheck className="me-2" /> Results
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              <div className="mt-4 pt-3 border-top">
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  className="w-100"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt className="me-2" />
                  Logout
                </Button>
              </div>
            </div>
          </Col>

          {/* Main Content - This is where nested routes render */}
          <Col md={9} className="p-4">
            <Card className="h-100">
              <Card.Body className="p-4">
                <Outlet />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Container>
  );
};

export default StudentDashboard;
