import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import * as courseService from '../../services/courseService';

const CoursesList = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const data = await courseService.getAllCourses();
        setCourses(data);
        setFilteredCourses(data);
      } catch (err) {
        setError('Failed to load courses. Please try again later.');
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    // Filter courses based on search term and level
    let result = [...courses];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(course => 
        course.title.toLowerCase().includes(term) || 
        course.description.toLowerCase().includes(term) ||
        course.instructorName.toLowerCase().includes(term)
      );
    }
    
    if (levelFilter !== 'all') {
      result = result.filter(course => course.level.toLowerCase() === levelFilter.toLowerCase());
    }
    
    setFilteredCourses(result);
  }, [searchTerm, levelFilter, courses]);

  const handleEnroll = async (courseId) => {
    try {
      // In a real app, you would handle enrollment logic here
      const { success } = await courseService.enrollInCourse(courseId);
      if (success) {
        // Update the UI to reflect enrollment
        setCourses(prevCourses => 
          prevCourses.map(course => 
            course.id === courseId 
              ? { ...course, enrolled: true } 
              : course
          )
        );
        alert('Successfully enrolled in the course!');
      }
    } catch (err) {
      console.error('Error enrolling in course:', err);
      alert('Failed to enroll in the course. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <Container className="my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Available Courses</h1>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Search and Filter */}
      <div className="mb-4">
        <Row className="g-3">
          <Col md={8}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="outline-secondary">
                <i className="bi bi-search"></i>
              </Button>
            </InputGroup>
          </Col>
          <Col md={4}>
            <Form.Select 
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Form.Select>
          </Col>
        </Row>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length > 0 ? (
        <Row xs={1} md={2} lg={3} className="g-4">
          {filteredCourses.map((course) => (
            <Col key={course.id}>
              <Card className="h-100 shadow-sm">
                <div className="position-relative">
                  <Card.Img 
                    variant="top" 
                    src={course.imageUrl} 
                    alt={course.title}
                    style={{ height: '160px', objectFit: 'cover' }}
                  />
                  <span className="position-absolute top-0 end-0 m-2 badge bg-primary">
                    {course.level}
                  </span>
                </div>
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="h5">{course.title}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    Instructor: {course.instructorName}
                  </Card.Subtitle>
                  <Card.Text className="flex-grow-1">
                    {course.description.length > 100 
                      ? `${course.description.substring(0, 100)}...` 
                      : course.description}
                  </Card.Text>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <span className="badge bg-light text-dark">
                      <i className="bi bi-clock me-1"></i> {course.duration}
                    </span>
                    {course.enrolled ? (
                      <Button 
                        as={Link} 
                        to={`/courses/${course.id}`} 
                        variant="outline-primary" 
                        size="sm"
                      >
                        Continue Learning
                      </Button>
                    ) : (
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleEnroll(course.id)}
                      >
                        Enroll Now
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Alert variant="info">
          No courses found matching your criteria. Try adjusting your search or filters.
        </Alert>
      )}
    </Container>
  );
};

export default CoursesList;
