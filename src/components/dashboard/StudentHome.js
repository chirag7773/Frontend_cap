import React from 'react';
import { Card, Button, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaBook, FaClipboardCheck, FaSearch } from 'react-icons/fa';

const StudentHome = () => {
  return (
    <div>
      <h2 className="mb-4">Dashboard Overview</h2>
      
      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{width: '60px', height: '60px'}}>
                <FaBook size={24} />
              </div>
              <h5>My Courses</h5>
              <p className="text-muted small mb-3">View and manage your enrolled courses</p>
              <Button as={Link} to="/student/courses" variant="outline-primary" size="sm">
                View My Courses
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div className="bg-success bg-opacity-10 text-success rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{width: '60px', height: '60px'}}>
                <FaSearch size={24} />
              </div>
              <h5>Browse Courses</h5>
              <p className="text-muted small mb-3">Discover new courses to enhance your skills</p>
              <Button as={Link} to="/student/available-courses" variant="outline-success" size="sm">
                Browse All Courses
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div className="bg-info bg-opacity-10 text-info rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{width: '60px', height: '60px'}}>
                <FaClipboardCheck size={24} />
              </div>
              <h5>My Results</h5>
              <p className="text-muted small mb-3">View your assessment results and progress</p>
              <Button as={Link} to="/student/results" variant="outline-info" size="sm">
                View Results
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Recent Activity</h5>
            <Button variant="link" size="sm" className="text-decoration-none p-0">
              View All
            </Button>
          </div>
          <div className="text-center py-4 text-muted">
            <p className="mb-2">No recent activity to display</p>
            <small>Your recent course activities will appear here</small>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default StudentHome;
