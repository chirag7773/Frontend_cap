import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { FaArrowLeft, FaClipboardList, FaCalendarAlt, FaPlay, FaInfoCircle } from 'react-icons/fa';
import config from '../../config';

const AssessmentView = () => {
  const { courseId } = useParams();
  const [assessments, setAssessments] = useState([]);
  
  // Debug: Log the courseId when component mounts
  useEffect(() => {
    console.log('=== ASSESSMENT VIEW MOUNTED ===');
    console.log('Course ID from URL params:', courseId);
    console.log('Current URL:', window.location.href);
    
    if (!courseId) {
      console.error('❌ No courseId provided in URL');
      // Try to extract courseId from URL as fallback
      const match = window.location.pathname.match(/\/courses\/(\d+)\/assessments/);
      if (match && match[1]) {
        console.log('Extracted courseId from URL:', match[1]);
        // Update the courseId in the URL
        window.history.replaceState({}, '', `/student/courses/${match[1]}/assessments`);
      }
    } else {
      // Test the API endpoint immediately
      testAssessmentEndpoint(courseId);
    }
  }, [courseId]);
  
  // Function to test the assessment endpoint
  // Helper function to resolve course ID to GUID
  const resolveCourseGuid = async (courseId) => {
    // If it's already a GUID, return it as is
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId)) {
      return courseId;
    }
    
    // If it's numeric, try to find the GUID from the courses list
    if (/^\d+$/.test(courseId)) {
      try {
        const coursesResponse = await fetch(`${config.apiBaseUrl}/Courses`, {
          headers: {
            'Authorization': `Bearer ${user?.token}`,
            'Accept': 'application/json'
          },
          credentials: 'include'
        });
        
        if (coursesResponse.ok) {
          const courses = await coursesResponse.json();
          const course = courses.find(c => 
            c.courseId === parseInt(courseId) || 
            c.id === parseInt(courseId) ||
            c.courseId?.toString() === courseId ||
            c.id?.toString() === courseId
          );
          
          if (course) {
            return course.courseId || course.id;
          }
        }
      } catch (e) {
        console.error('Error fetching courses:', e);
      }
    }
    
    // If we can't find a GUID, return the original ID
    return courseId;
  };

  const testAssessmentEndpoint = async (testCourseId) => {
    try {
      console.log('=== TESTING ASSESSMENT ENDPOINT ===');
      // Resolve the course ID to a GUID
      const courseGuid = await resolveCourseGuid(testCourseId);
      console.log('Resolved course ID:', testCourseId, 'to GUID:', courseGuid);
      
      const testUrl = `${config.apiBaseUrl}/Assessments/Course/${courseGuid}`;
      console.log('Test URL:', testUrl);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      
      console.log('Test Response Status:', response.status);
      const data = await response.json().catch(() => ({}));
      console.log('Test Response Data:', data);
      
      if (!response.ok) {
        console.error('❌ Test request failed:', response.status, data);
      } else {
        console.log('✅ Test request successful');
      }
    } catch (error) {
      console.error('❌ Error testing assessment endpoint:', error);
    }
  };
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [takenAssessments, setTakenAssessments] = useState({});
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[fetchData] Starting data fetch for courseId:', courseId);
        setLoading(true);
        setError('');
        
        // Check if user is authenticated
        if (!user || !user.token) {
          const errorMsg = 'User not authenticated';
          console.error('[fetchData]', errorMsg);
          throw new Error(errorMsg);
        }
        
        // Resolve course ID to GUID
        const resolvedCourseId = await resolveCourseGuid(courseId);
        console.log('Resolved course ID for fetch:', courseId, '->', resolvedCourseId);

        // Fetch course details
        try {
          const courseResponse = await fetch(`${config.apiBaseUrl}/Courses/${resolvedCourseId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            credentials: 'include'
          });

          if (courseResponse.ok) {
            const courseData = await courseResponse.json();
            setCourse(courseData);
          } else {
            console.warn('Failed to fetch course details, continuing with assessments');
          }
        } catch (courseError) {
          console.error('Error fetching course details:', courseError);
          // Continue even if course details fail
        }

        // Fetch assessments with detailed logging
        const assessmentsUrl = `${config.apiBaseUrl}/Assessments/Course/${resolvedCourseId}`;
        console.log('=== FETCHING ASSESSMENTS ===');
        console.log('Course ID:', courseId);
        console.log('Resolved Course ID:', resolvedCourseId);
        console.log('API URL:', assessmentsUrl);
        console.log('Auth Token:', user.token ? 'Present' : 'Missing');
        
        try {
          const startTime = performance.now();
          const assessmentsResponse = await fetch(assessmentsUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            credentials: 'include'
          });
          const responseTime = performance.now() - startTime;

          console.log('=== ASSESSMENTS RESPONSE ===');
          console.log('Status:', assessmentsResponse.status, assessmentsResponse.statusText);
          console.log('Response time:', responseTime.toFixed(2), 'ms');
          console.log('Response headers:', Object.fromEntries([...assessmentsResponse.headers.entries()]));

          if (!assessmentsResponse.ok) {
            const errorText = await assessmentsResponse.text();
            console.error('Error response body:', errorText);
            throw new Error(`HTTP error! status: ${assessmentsResponse.status}`);
          }

          const responseText = await assessmentsResponse.text();
          console.log('=== ASSESSMENTS RAW RESPONSE ===');
          console.log('Status:', assessmentsResponse.status);
          console.log('Headers:', Object.fromEntries([...assessmentsResponse.headers.entries()]));
          console.log('Response text:', responseText);
          
          let assessmentsData;
          try {
            const responseData = responseText ? JSON.parse(responseText) : {};
            console.log('=== PARSED ASSESSMENTS DATA ===');
            console.log('Response type:', typeof responseData);
            console.log('Response data:', responseData);
            
            // Handle both array and object responses
            if (Array.isArray(responseData)) {
              console.log(`Found ${responseData.length} assessments in array`);
              assessmentsData = responseData;
            } else if (responseData && typeof responseData === 'object') {
              console.log('Processing assessments from object response');
              // Convert object to array if needed
              assessmentsData = Object.values(responseData);
              console.log(`Converted to ${assessmentsData.length} assessments`);
            } else {
              console.warn('Unexpected response format, defaulting to empty array');
              assessmentsData = [];
            }
            
            console.log('Final assessments data:', assessmentsData);
            setAssessments(assessmentsData);
          } catch (parseError) {
            console.error('Error parsing assessments response:', parseError);
            console.error('Response text that failed to parse:', responseText);
            setError('Failed to parse assessments data');
            setAssessments([]);
          }
        } catch (error) {
          console.error('Error fetching assessments:', error);
          setError(`Error loading assessments: ${error.message}`);
          setAssessments([]);
        }

        // Fetch assessment results
        try {
          const resultsResponse = await fetch(`${config.apiBaseUrl}/Assessments/student/results`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });

          if (resultsResponse.ok) {
            const resultsData = await resultsResponse.json();
            const takenAssessmentsMap = {};
            
            if (Array.isArray(resultsData)) {
              resultsData.forEach(result => {
                if (result.attemptDate) {
                  takenAssessmentsMap[result.assessmentId] = {
                    score: result.score || 0,
                    maxScore: result.maxScore || 1,
                    attemptDate: result.attemptDate,
                    isPassed: result.score >= (result.passingScore || 0)
                  };
                }
              });
              setTakenAssessments(takenAssessmentsMap);
            }
          }
        } catch (resultsError) {
          console.error('Error fetching assessment results:', resultsError);
          // Continue without results if there's an error
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err.message || 'An error occurred while loading assessments');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchData();
    } else {
      setError('No course ID provided');
      setLoading(false);
    }
  }, [courseId, user]);

  const handleStartAssessment = (assessmentId) => {
    console.log('Starting assessment:', {
      assessmentId,
      courseId,
      currentPath: window.location.pathname
    });
    
    // Ensure we have a valid assessment ID and course ID
    if (!assessmentId) {
      console.error('No assessment ID provided');
      return;
    }
    
    if (!courseId) {
      console.error('No course ID available');
      return;
    }
    
    // Navigate to the assessment with proper state
    navigate(`/student/assessments/${assessmentId}/take`, { 
      state: { 
        courseId: courseId,
        from: window.location.pathname
      } 
    });
  };

if (error) {
return (
  <Container className="py-5">
    <Alert variant="danger">
      <Alert.Heading>Error</Alert.Heading>
      <p>{error}</p>
      <Button variant="outline-danger" onClick={() => window.location.reload()}>
        Try Again
      </Button>
    </Alert>
  </Container>
);
}

console.log('Rendering AssessmentView with state:', {
  loading,
  error,
  assessments,
  assessmentsLength: assessments.length,
  courseId,
  course
});

if (assessments.length === 0) {
console.log('Rendering no assessments message. Assessments array:', assessments);
return (
  <Container className="text-center py-5">
    <Card className="shadow-sm">
      <Card.Body>
        <div className="py-5">
          <FaClipboardList size={48} className="text-muted mb-3" />
          <h4>No Assessments Available</h4>
          <p className="text-muted">
            {loading 
              ? 'Loading assessments...' 
              : 'There are no assessments available for this course at the moment.'
            }
          </p>
          <Button variant="outline-primary" onClick={() => navigate(-1)} className="mt-3">
            <FaArrowLeft className="me-2" /> Back to Course
          </Button>
        </div>
      </Card.Body>
    </Card>
  </Container>
);
}

return (
  <Container className="py-4">
    <div className="d-flex justify-content-between align-items-center mb-4">
      <Button variant="outline-secondary" onClick={() => navigate(-1)}>
        <FaArrowLeft className="me-2" /> Back to Course
      </Button>
      <h2 className="mb-0">Course Assessments</h2>
      <div></div> {/* Empty div for alignment */}
    </div>

    {course && (
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <h4 className="text-primary">{course.title}</h4>
          <p className="text-muted mb-0">{course.description || 'No description available.'}</p>
        </Card.Body>
      </Card>
    )}

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">
              <FaClipboardList className="me-2 text-primary" />
              Available Assessments
            </h5>
            <Badge bg="light" text="dark" className="py-2 px-3">
              {assessments.length} {assessments.length === 1 ? 'Assessment' : 'Assessments'}
            </Badge>
          </div>
          
          {assessments.length === 0 ? (
            <Alert variant="info" className="mb-0">
              <div className="d-flex align-items-center">
                <FaInfoCircle className="me-2" size={20} />
                <span>No assessments available for this course yet. Please check back later.</span>
              </div>
            </Alert>
          ) : (
            <div className="row g-4">
              {assessments.map((assessment) => {
                const isTaken = takenAssessments[assessment.assessmentId];
                const scorePercentage = isTaken 
                  ? Math.round((isTaken.score / isTaken.maxScore) * 100) 
                  : 0;
                
                return (
                  <div key={assessment.assessmentId} className="col-12">
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body>
                        <div className="d-flex flex-column h-100">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h5 className="mb-1">{assessment.title}</h5>
                              <p className="text-muted small mb-2">
                                {assessment.description || 'No description provided.'}
                              </p>
                            </div>
                            <div className="text-end">
                              <Badge bg="info" className="mb-2">
                                {assessment.questions?.length || 0} Questions
                              </Badge>
                              <div className="text-muted small">
                                Max Score: {assessment.maxScore}
                              </div>
                            </div>
                          </div>
                          
                          {isTaken ? (
                            <div className="mt-auto">
                              <div className="progress mb-2" style={{ height: '8px' }}>
                                <div 
                                  className={`progress-bar ${scorePercentage >= 70 ? 'bg-success' : scorePercentage >= 40 ? 'bg-warning' : 'bg-danger'}`} 
                                  role="progressbar" 
                                  style={{ width: `${scorePercentage}%` }}
                                  aria-valuenow={scorePercentage}
                                  aria-valuemin="0" 
                                  aria-valuemax="100"
                                ></div>
                              </div>
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="small">
                                  <strong>Score:</strong> {isTaken.score}/{isTaken.maxScore} ({scorePercentage}%)
                                </span>
                                <span className="small text-muted">
                                  <FaCalendarAlt className="me-1" />
                                  {new Date(isTaken.attemptDate).toLocaleString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className="d-grid gap-2 mt-3">
                                <Button 
                                  variant="outline-secondary" 
                                  onClick={() => navigate(`/student/results`)}
                                  size="sm"
                                >
                                  <FaClipboardList className="me-2" /> View All Results
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3">
                              <Button 
                                variant="primary" 
                                className="w-100"
                                onClick={() => {
                                  const targetUrl = `/student/assessments/${assessment.assessmentId}/take`;
                                  console.log('Navigating to:', targetUrl);
                                  console.log('Assessment ID:', assessment.assessmentId);
                                  console.log('Current pathname:', window.location.pathname);
                                  navigate(targetUrl);
                                }}
                              >
                                <FaPlay className="me-2" /> Take Assessment
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AssessmentView;
