import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Alert, Badge, Container, Row, Col, Table, ButtonGroup } from 'react-bootstrap';
import { FaArrowLeft, FaPlus, FaListUl, FaEdit, FaTrash, FaBook } from 'react-icons/fa';

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assessments, setAssessments] = useState([]);

  console.log('CourseDetails rendered with courseId:', courseId);

  const fetchAssessments = async () => {
    try {
      setAssessmentsLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user?.token;
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5109/api'}/Assessments/Course/${courseId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch assessments');
      }

      const data = await response.json();
      setAssessments(data);
    } catch (err) {
      console.error('Error fetching assessments:', err);
      setError(prev => prev || 'Failed to load assessments');
    } finally {
      setAssessmentsLoading(false);
    }
  };

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user?.token;
        const instructorId = user?.userId;

        // Get course details directly by ID
        const response = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5109/api'}/Courses/${courseId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          // If direct fetch fails, try getting from the instructor's courses
          const coursesResponse = await fetch(
            `${process.env.REACT_APP_API_URL || 'http://localhost:5109/api'}/Courses/ByInstructor/${instructorId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (!coursesResponse.ok) {
            throw new Error('Failed to fetch course details');
          }

          const courses = await coursesResponse.json();
          const foundCourse = Array.isArray(courses) ? 
            courses.find(c => c.courseId === courseId) : 
            (courses.value || []).find(c => c.courseId === courseId);
          
          if (!foundCourse) {
            throw new Error('Course not found');
          }
          setCourse(foundCourse);
        } else {
          const data = await response.json();
          setCourse(data);
        }
      } catch (err) {
        console.error('Error fetching course details:', err);
        setError(err.message || 'Failed to load course details');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const handleCreateAssessment = () => {
    console.log('Navigating to create assessment for course:', courseId);
    navigate(`/instructor/courses/${courseId}/assessments`);
    
    // Force a reload of the CourseAssessments component
    setTimeout(() => {
      window.location.href = `/instructor/courses/${courseId}/assessments`;
    }, 100);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading course...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Course</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container className="py-4">
        <Alert variant="warning">Course not found</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Button 
        variant="outline-secondary" 
        className="mb-4" 
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft className="me-2" /> Back to Courses
      </Button>

      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h2 className="mb-0">{course.title || 'Untitled Course'}</h2>
          <div>
            <Button 
              variant="primary" 
              onClick={handleCreateAssessment}
              className="ms-2"
            >
              <FaPlus className="me-2" /> Create Assessment
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {course.mediaUrl && (
            <div className="ratio ratio-16x9 mb-4">
              <iframe 
                src={course.mediaUrl} 
                title={course.title || 'Course Media'}
                allowFullScreen
                className="rounded"
              />
            </div>
          )}
          
          <div className="mb-4">
            <h4>Course Details</h4>
            <div className="card">
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-3 fw-bold">Title:</div>
                  <div className="col-md-9">{course.title || 'N/A'}</div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-3 fw-bold">Description:</div>
                  <div className="col-md-9">
                    {course.description || 'No description available.'}
                  </div>
                </div>
                {course.instructorName && (
                  <div className="row">
                    <div className="col-md-3 fw-bold">Instructor:</div>
                    <div className="col-md-9">{course.instructorName}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">Assessments</h4>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={handleCreateAssessment}
              >
                <FaPlus className="me-1" /> New Assessment
              </Button>
            </div>
            
            <Card>
              <Card.Body className="text-center py-5">
                <FaBook size={48} className="text-muted mb-3" />
                <h5>No assessments yet</h5>
                <p className="text-muted mb-3">Create your first assessment to get started</p>
                <Button 
                  variant="primary" 
                  onClick={handleCreateAssessment}
                >
                  <FaPlus className="me-2" /> Create Assessment
                </Button>
              </Card.Body>
            </Card>
          </div>
        </Card.Body>
      </Card>

      {/* Assessments Section */}
      <Card className="mt-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Course Assessments</h5>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => navigate(`/instructor/courses/${courseId}/assessments/create`)}
          >
            <FaPlus className="me-1" /> Create Assessment
          </Button>
        </Card.Header>
        <Card.Body>
          {assessmentsLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="mt-2 mb-0">Loading assessments...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">
              <Alert.Heading>Error loading assessments</Alert.Heading>
              <p>{error}</p>
              <Button variant="outline-danger" size="sm" onClick={fetchAssessments}>
                Retry
              </Button>
            </Alert>
          ) : assessments.length === 0 ? (
            <div className="text-center py-4">
              <FaListUl size={32} className="text-muted mb-3" />
              <h5>No Assessments Yet</h5>
              <p className="text-muted mb-4">
                Create your first assessment to evaluate your students' understanding
              </p>
              <Button 
                variant="primary" 
                onClick={() => navigate(`/instructor/courses/${courseId}/assessments/create`)}
              >
                <FaPlus className="me-1" /> Create Assessment
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Questions</th>
                    <th>Max Score</th>
                    <th>Duration</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((assessment) => (
                    <tr key={assessment.assessmentId}>
                      <td>
                        <div className="fw-semibold">{assessment.title}</div>
                        <div className="text-muted small">
                          {new Date(assessment.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>{assessment.questions?.length || 0}</td>
                      <td>{assessment.maxScore}</td>
                      <td>
                        {assessment.durationMinutes ? (
                          `${assessment.durationMinutes} mins`
                        ) : (
                          <span className="text-muted">No limit</span>
                        )}
                      </td>
                      <td className="text-end">
                        <ButtonGroup size="sm">
                          <Button 
                            variant="outline-primary" 
                            onClick={() => navigate(`/instructor/assessments/${assessment.assessmentId}`)}
                          >
                            <FaEdit className="me-1" /> Edit
                          </Button>
                          <Button 
                            variant="outline-danger"
                            disabled={true} // Disable delete for now
                            title="Delete (coming soon)"
                          >
                            <FaTrash />
                          </Button>
                        </ButtonGroup>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CourseDetails;
