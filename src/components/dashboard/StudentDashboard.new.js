import React from 'react';
import { Container, Row, Col, Nav, Card, Badge } from 'react-bootstrap';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { FaBook, FaClipboardCheck, FaHome, FaCalendarAlt, FaBell } from 'react-icons/fa';
import EnrolledCourses from './EnrolledCourses';
import AssessmentResults from './AssessmentResults';

const StudentDashboard = () => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'Student' };
  const userName = user.name || 'Student';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <Container fluid className="p-0">
      {/* Header */}
      <div className="bg-primary text-white p-4">
        <Row className="align-items-center">
          <Col md={6}>
            <h2 className="mb-0">{getGreeting()}, {userName}!</h2>
            <p className="mb-0">Welcome back to your learning dashboard</p>
          </Col>
          <Col md={6} className="text-md-end mt-3 mt-md-0">
            <Badge bg="light" text="primary" className="p-2 me-2">
              <FaCalendarAlt className="me-1" /> {new Date().toLocaleDateString()}
            </Badge>
            <Badge bg="light" text="primary" className="p-2">
              <FaBell />
            </Badge>
          </Col>
        </Row>
      </div>

      <Container className="mt-4">
        <Row>
          {/* Sidebar */}
          <Col lg={3} className="mb-4">
            <Card className="shadow-sm border-0 rounded-3">
              <Card.Body className="p-0">
                <div className="text-center p-4 bg-light rounded-top-3">
                  <div className="mb-3">
                    <div 
                      className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center" 
                      style={{ width: '80px', height: '80px', fontSize: '2rem' }}
                    >
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <h5 className="mb-1">{userName}</h5>
                  <p className="text-muted mb-0">Student</p>
                </div>
                <Nav variant="pills" className="flex-column p-3">
                  <Nav.Item className="mb-2">
                    <Nav.Link 
                      as={Link} 
                      to="/student"
                      className="d-flex align-items-center rounded-pill px-3 py-2"
                      active={location.pathname === '/student'}
                    >
                      <FaHome className="me-2" /> Home
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item className="mb-2">
                    <Nav.Link 
                      as={Link} 
                      to="/student/courses"
                      className="d-flex align-items-center rounded-pill px-3 py-2"
                      active={location.pathname.startsWith('/student/courses')}
                    >
                      <FaBook className="me-2" /> My Courses
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item className="mb-2">
                    <Nav.Link 
                      as={Link} 
                      to="/student/results"
                      className="d-flex align-items-center rounded-pill px-3 py-2"
                      active={location.pathname === '/student/results'}
                    >
                      <FaClipboardCheck className="me-2" /> Results
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Body>
            </Card>
          </Col>

          {/* Main Content */}
          <Col lg={9}>
            <Routes>
              <Route 
                path="/" 
                element={
                  <div>
                    <h4 className="mb-4">Dashboard Overview</h4>
                    <Card className="border-0 shadow-sm">
                      <Card.Body>
                        <p className="mb-0">Welcome to your student dashboard. Here you can view your courses, track your progress, and see your results.</p>
                      </Card.Body>
                    </Card>
                  </div>
                } 
              />
              <Route path="courses/*" element={<EnrolledCourses />} />
              <Route path="results" element={<AssessmentResults />} />
              <Route path="*" element={<div>Page not found</div>} />
            </Routes>
          </Col>
        </Row>
      </Container>
    </Container>
  );
};

export default StudentDashboard;
