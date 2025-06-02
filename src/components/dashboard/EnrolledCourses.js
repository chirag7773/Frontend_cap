import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Button } from 'react-bootstrap';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { getEnrolledCourses } from '../../services/courseService';
import { useAuth } from '../../contexts/AuthContext';

// Array of random placeholder images from Unsplash
const placeholderImages = [
  
];

// Function to get a random image URL based on course ID for consistency
const getRandomImage = (id) => {
  const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % placeholderImages.length;
  return placeholderImages[index];
};

const EnrolledCourses = () => {
  const location = useLocation();
  const isAssessmentView = location.pathname.includes('/assessments');
  console.log('=== [1] EnrolledCourses Component Rendered ===');
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCourse, setExpandedCourse] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const toggleCourseExpand = (courseId) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };

  const handleViewAssessments = async (courseId) => {
    console.log('[handleViewAssessments] Course ID:', courseId);
    console.log('[handleViewAssessments] Current path:', window.location.pathname);
    
    if (!courseId) {
      console.error('[handleViewAssessments] No courseId provided');
      return;
    }
    
    // Get the course object to ensure we have the correct ID format
    const course = courses.find(c => c.courseId === courseId || c.id === courseId);
    const targetCourseId = course?.courseId || course?.id || courseId;
    
    console.log('[handleViewAssessments] Using course ID:', targetCourseId);
    
    const targetPath = `/student/courses/${targetCourseId}/assessments`;
    console.log('[handleViewAssessments] Navigating to:', targetPath);
    
    try {
      navigate(targetPath, { state: { courseId: targetCourseId } });
    } catch (navError) {
      console.error('[handleViewAssessments] Navigation error:', navError);
      // Fallback to window.location if programmatic navigation fails
      window.location.href = targetPath;
    }
  };
  
  // Log initial state
  console.log('[2] Initial state:', { 
    loading, 
    error, 
    coursesCount: courses.length,
    user: user ? { 
      id: user.userId, 
      email: user.email, 
      role: user.role,
      hasToken: !!user.token 
    } : 'No user',
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log('[3] useEffect triggered');
    let isMounted = true;
    
    const fetchEnrolledCourses = async () => {
      console.log('[4] fetchEnrolledCourses started');
      
      if (!user) {
        const msg = 'No user found in context';
        console.warn('[5]', msg);
        if (isMounted) {
          setError(msg);
          setLoading(false);
        }
        return;
      }

      try {
        console.log('[6] Setting loading to true');
        setLoading(true);
        setError('');
        
        console.log('[7] Calling getEnrolledCourses API');
        const startTime = Date.now();
        const data = await getEnrolledCourses();
        const endTime = Date.now();
        
        console.log(`[8] API call completed in ${endTime - startTime}ms`);
        console.log('[9] API response data:', {
          isArray: Array.isArray(data),
          itemCount: Array.isArray(data) ? data.length : 'N/A',
          data: data
        });
        
        if (!isMounted) {
          console.log('[10] Component unmounted, skipping state update');
          return;
        }
        
        if (Array.isArray(data)) {
          console.log('[11] Setting courses state with', data.length, 'items');
          setCourses(data);
          if (data.length === 0) {
            console.log('[12] No courses found for user');
            setError('You are not enrolled in any courses yet.');
          }
        } else {
          const errorMsg = 'Invalid data format received from server';
          console.error('[13]', errorMsg, data);
          throw new Error(errorMsg);
        }
      } catch (error) {
        console.error('[14] Error in fetchEnrolledCourses:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          response: error.response?.data
        });
        
        if (isMounted) {
          const errorMessage = error.response?.data?.message || 
                             error.message || 
                             'Failed to load courses. Please try again later.';
          console.log('[15] Setting error state:', errorMessage);
          setError(errorMessage);
        }
      } finally {
        if (isMounted) {
          console.log('[16] Setting loading to false');
          setLoading(false);
        }
      }
    };

    // Add a small delay to prevent race conditions
    const timer = setTimeout(() => {
      console.log('[17] Starting fetch after delay');
      fetchEnrolledCourses();
    }, 100);
    
    return () => {
      console.log('[18] Cleanup function called');
      isMounted = false;
      clearTimeout(timer);
    };
  }, [user]);

  console.log('[19] Rendering EnrolledCourses', { 
    loading, 
    error: error ? error.substring(0, 100) : 'No error',
    coursesCount: courses.length,
    hasUser: !!user,
    timestamp: new Date().toISOString()
  });

  // Simple loading state
  if (loading) {
    console.log('[20] Rendering loading state');
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status" className="me-2">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading your courses...</p>
        <div className="mt-3 text-muted small">
          <div>If this takes too long, try refreshing the page</div>
          <Button 
            variant="link" 
            size="sm" 
            onClick={() => window.location.reload()}
            className="p-0"
          >
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh now
          </Button>
        </div>
      </Container>
    );
  }

  // Error state
  if (error) {
    console.log('[21] Rendering error state:', error);
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Courses</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex gap-2 mt-3">
            <Button 
              variant="outline-danger" 
              onClick={() => window.location.reload()}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>Try Again
            </Button>
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate('/student')}
            >
              <i className="bi bi-house-door me-2"></i>Back to Dashboard
            </Button>
          </div>
        </Alert>
        <div className="mt-3 text-center">
          <Button 
            variant="link" 
            size="sm" 
            onClick={() => {
              console.log('[22] User clicked to view console');
              // This will open the browser's console
              console.log('[23] Current state:', { loading, error, courses, user });
            }}
          >
            <i className="bi bi-terminal me-1"></i>View console for details
          </Button>
        </div>
      </Container>
    );
  }

  // Empty state
  if (courses.length === 0) {
    console.log('[24] Rendering empty state - no courses found');
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="mb-4">
            <i className="bi bi-journal-bookmark" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
          </div>
          <h2>No Enrolled Courses</h2>
          <p className="lead text-muted mb-4">You haven't enrolled in any courses yet.</p>
          <div className="d-flex justify-content-center gap-2">
            <Button 
              variant="primary" 
              onClick={() => window.location.reload()}
              className="px-4"
            >
              <i className="bi bi-arrow-clockwise me-2"></i>Refresh
            </Button>
            <Button 
              variant="outline-secondary" 
              as={Link} 
              to="/courses"
              className="px-4"
            >
              <i className="bi bi-search me-2"></i>Browse Courses
            </Button>
          </div>
          <div className="mt-4">
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => console.log('[25] Debug info:', { user, courses, loading, error })}
            >
              <i className="bi bi-bug me-1"></i>Debug Information
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  // Success state - show courses
  if (isAssessmentView) {
    return <Outlet />;
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Enrolled Courses</h2>
        <Button 
          variant="outline-secondary" 
          onClick={() => window.location.reload()}
          size="sm"
        >
          <i className="bi bi-arrow-clockwise me-1"></i> Refresh
        </Button>
      </div>
      
      <Row xs={1} md={2} lg={3} className="g-4">
        {courses.map((course) => (
          <Col key={course.courseId}>
            <Card className="h-100 shadow-sm">
              <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
                <img
                  src={course.mediaUrl || course.imageUrl || getRandomImage(course.courseId || '')}
                  alt={course.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    backgroundColor: '#f8f9fa',
                    transition: 'opacity 0.3s ease-in-out'
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.opacity = '0';
                    // Fallback to a different random image
                    e.target.src = getRandomImage(course.title || '' + Math.random());
                    e.target.style.opacity = '1';
                  }}
                />
                {/* Gradient overlay for better text readability */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '40px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)'
                }} />
              </div>
              <Card.Body className="d-flex flex-column">
                <Card.Title className="h5">{course.title || 'Untitled Course'}</Card.Title>
                <Card.Text className="text-muted flex-grow-1">
                  {expandedCourse === course.courseId ? (
                    course.description || 'No description available.'
                  ) : (
                    course.description ? 
                    (course.description.length > 100 
                      ? `${course.description.substring(0, 100)}...` 
                      : course.description)
                    : 'No description available.'
                  )}
                </Card.Text>
                {expandedCourse === course.courseId && (
                  <div className="mb-3">
                    <h6 className="h6 mt-3">Course Details</h6>
                    <ul className="list-unstyled small text-muted">
                      <li className="mb-1">
                        <i className="bi bi-person me-2"></i>
                        <strong>Instructor:</strong> {course.instructorName || 'Not specified'}
                      </li>
                      <li className="mb-1">
                        <i className="bi bi-calendar3 me-2"></i>
                        <strong>Enrolled:</strong> {course.enrollmentDate ? new Date(course.enrollmentDate).toLocaleDateString() : 'N/A'}
                      </li>
                      <li>
                        <i className="bi bi-tag me-2"></i>
                        <strong>Status:</strong> {course.status || 'In Progress'}
                      </li>
                    </ul>
                  </div>
                )}
                <div className="d-flex justify-content-between align-items-center mt-auto pt-2">
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => setExpandedCourse(expandedCourse === course.courseId ? null : course.courseId)}
                    >
                      {expandedCourse === course.courseId ? 'Less' : 'View'} Details
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleViewAssessments(course.courseId)}
                    >
                      <i className="bi bi-pencil-square me-1"></i> View Assessments
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default EnrolledCourses;
