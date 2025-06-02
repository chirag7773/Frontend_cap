import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Alert, Badge, Container, Row, Col, ButtonGroup, Modal } from 'react-bootstrap';
import { FaArrowLeft, FaPlus, FaListUl, FaEdit, FaTrash, FaExpand, FaCompress, FaCheckCircle, FaStar, FaTimes, FaClock } from 'react-icons/fa';
import CreateAssessmentForm from './CreateAssessmentForm';
import { createAssessment, getAssessmentsByCourse } from '../../services/assessmentService';


// Styled components for the assessment modal
const FullScreenButton = ({ isFullscreen, onClick }) => (
  <Button 
    variant="outline-secondary" 
    size="sm" 
    className="ms-2"
    onClick={onClick}
    title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
  >
    {isFullscreen ? <FaCompress /> : <FaExpand />}
  </Button>
);

const CloseButton = ({ onClick }) => (
  <Button 
    variant="link" 
    onClick={onClick}
    className="position-absolute end-0 top-0 p-3"
  >
    <FaTimes size={24} />
  </Button>
);

const CourseAssessments = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [course, setCourse] = useState(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const fetchAssessments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAssessmentsByCourse(courseId);
      setAssessments(data);
      return data;
    } catch (error) {
      setError(error.message || 'Failed to fetch assessments');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const fetchCourse = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user?.token;

      const courseResponse = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5109/api'}/Courses/${courseId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!courseResponse.ok) {
        throw new Error('Failed to fetch course details');
      }
      const courseData = await courseResponse.json();
      setCourse(courseData);
      return courseData;
    } catch (err) {
      setError(err.message || 'Failed to load data');
      throw err;
    }
  }, [courseId]);

  useEffect(() => {
    const loadData = async () => {
      if (courseId) {
        try {
          setLoading(true);
          await Promise.all([fetchAssessments(), fetchCourse()]);
        } catch (err) {
          setError(err.message || 'Failed to load data');
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadData();
  }, [courseId, fetchCourse, fetchAssessments]);
  
  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  const handleViewAssessment = (assessment) => {
    setSelectedAssessment(assessment);
    setShowModal(true);
  };
  
  const handleCloseAssessment = () => {
    setShowModal(false);
    // Exit fullscreen when closing the modal
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleCreateAssessment = async (assessmentData) => {
    try {
      setIsSubmitting(true);
      setSubmitError('');
      
      // Add courseId to the assessment data
      const assessmentWithCourse = {
        ...assessmentData,
        courseId: courseId
      };
      
      await createAssessment(assessmentWithCourse);
      setShowCreateModal(false);
      await fetchAssessments(); // Refresh the assessments list
    } catch (error) {
      console.error('Error creating assessment:', error);
      setSubmitError(error.message || 'Failed to create assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!course) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <Alert variant="danger">
          <p className="mb-0">{error}</p>
          <Button 
            variant="outline-danger" 
            className="mt-3"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{course?.title || 'Course'} - Assessments</h2>
        <Button 
          variant="primary" 
          onClick={() => setShowCreateModal(true)}
          disabled={!courseId}
        >
          <FaPlus className="me-2" /> Create Assessment
        </Button>
      </div>

      {/* Create Assessment Modal */}
      <CreateAssessmentForm
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        courseId={courseId}
        onSave={handleCreateAssessment}
      />
      
      {/* Assessment Details Modal */}
      <Modal 
        show={showModal} 
        onHide={handleCloseAssessment}
        size={isFullscreen ? 'xl' : 'lg'}
        fullscreen={isFullscreen ? true : undefined}
        className={isFullscreen ? 'fullscreen-modal' : ''}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedAssessment?.title || 'Assessment Details'}
          </Modal.Title>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            className="ms-2"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </Button>
        </Modal.Header>
        <Modal.Body>
          {selectedAssessment && (
            <div>
              <h5>Questions</h5>
              <ol className="list-group list-group-numbered">
                {selectedAssessment.questions?.map((q, qIndex) => (
                  <li key={qIndex} className="list-group-item mb-3">
                    <div className="ms-2 me-auto">
                      <div className="fw-bold">{q.questionText}</div>
                      <div className="mt-2">
                        {['A', 'B', 'C', 'D'].map(opt => (
                          <div 
                            key={opt} 
                            className={`p-2 mb-1 rounded ${q.correctOption === opt ? 'bg-success bg-opacity-10' : ''}`}
                          >
                            <strong>{opt}.</strong> {q[`option${opt}`]}
                            {q.correctOption === opt && (
                              <span className="ms-2 text-success">
                                <FaCheckCircle /> Correct Answer
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-3">
                <p><strong>Maximum Score:</strong> {selectedAssessment.maxScore}</p>
                <p><strong>Number of Questions:</strong> {selectedAssessment.questions?.length || 0}</p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleCloseAssessment}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Error Alert */}
      {submitError && (
        <div className="position-fixed bottom-0 end-0 m-3" style={{ zIndex: 1050 }}>
          <Alert variant="danger" onClose={() => setSubmitError('')} dismissible>
            {submitError}
          </Alert>
        </div>
      )}

      {assessments.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <FaListUl size={48} className="text-muted mb-3" />
            <h4>No Assessments Yet</h4>
            <p className="text-muted mb-4">
              Create your first assessment to evaluate your students' understanding
            </p>
            <Button 
              variant="primary" 
              onClick={() => setShowCreateModal(true)}
            >
              <FaPlus className="me-2" /> Create Assessment
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Card className="mb-4">
          <Card.Body>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Questions</th>
                    <th>Max Score</th>
                    <th>Duration</th>
                    <th>Correct Options</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((assessment) => (
                    <tr key={assessment.assessmentId}>
                      <td className="align-middle">
                        <strong>{assessment.title}</strong>
                      </td>
                      <td className="align-middle">
                        <Badge bg="info">
                          {assessment.questions?.length || 0}
                        </Badge>
                      </td>
                      <td className="align-middle">
                        {assessment.maxScore}
                      </td>
                      <td className="align-middle">
                        {assessment.durationMinutes ? `${assessment.durationMinutes} mins` : 'N/A'}
                      </td>
                      <td className="align-middle">
                        <div className="d-flex flex-wrap gap-1">
                          {assessment.questions?.map((q, idx) => (
                            <Badge key={idx} bg="light" text="dark" className="border">
                              Q{idx + 1}: {q.correctOption}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="align-middle">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => handleViewAssessment(assessment)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      )}
      
      {/* Assessment Detail Modal */}
      <Modal 
        show={showModal} 
        onHide={handleCloseAssessment}
        fullscreen={isFullscreen ? true : undefined}
        size={isFullscreen ? undefined : 'xl'}
        className={isFullscreen ? 'assessment-modal-fullscreen' : ''}
      >
        <Modal.Header className="bg-light">
          <Modal.Title className="d-flex align-items-center">
            {selectedAssessment?.title || 'Assessment Details'}
            <ButtonGroup size="sm" className="ms-3">
              <Button 
                variant="outline-secondary" 
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <FaCompress /> : <FaExpand />}
              </Button>
            </ButtonGroup>
          </Modal.Title>
          <Button 
            variant="link" 
            onClick={handleCloseAssessment}
            className="position-absolute end-0 top-0 p-3"
          >
            <FaTimes size={24} />
          </Button>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedAssessment && (
            <div className="assessment-content">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h2>{selectedAssessment.title}</h2>
                  <p className="text-muted">
                    {selectedAssessment.questions?.length || 0} Questions • 
                    Max Score: {selectedAssessment.maxScore}
                    {selectedAssessment.durationMinutes && ` • Duration: ${selectedAssessment.durationMinutes} mins`}
                  </p>
                </div>
              </div>
              
              <div className="questions-container">
                {selectedAssessment.questions?.map((question, index) => (
                  <Card key={question.questionId} className="mb-4">
                    <Card.Body>
                      <h5 className="d-flex align-items-center">
                        <span className="badge bg-primary me-2">{index + 1}</span>
                        {question.questionText}
                      </h5>
                      <div className="options mt-3">
                        {['A', 'B', 'C', 'D'].map((option) => (
                          question[`option${option}`] && (
                            <div 
                              key={option}
                              className={`p-3 mb-2 border rounded ${question.correctAnswer === option ? 'bg-light-success' : ''}`}
                            >
                              <strong>{option}.</strong> {question[`option${option}`]}
                              {question.correctAnswer === option && (
                                <span className="ms-2 text-success">
                                  <FaStar className="me-1" /> Correct Answer
                                </span>
                              )}
                            </div>
                          )
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={handleCloseAssessment}>
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              handleCloseAssessment();
              navigate(`/instructor/assessments/${selectedAssessment.assessmentId}`);
            }}
          >
            Edit Assessment
          </Button>
        </Modal.Footer>
      </Modal>
      
      <style jsx global>{`
        .assessment-modal-fullscreen .modal-content {
          height: 100%;
          border: 0;
          border-radius: 0;
        }
        .assessment-modal-fullscreen .modal-body {
          overflow-y: auto;
          height: calc(100% - 120px);
        }
        .options div {
          transition: all 0.2s;
        }
        .options div:hover {
          background-color: #f8f9fa;
          cursor: pointer;
        }
        .bg-light-success {
          background-color: #e8f5e9 !important;
        }
      `}</style>
    </div>
  );
};

export default CourseAssessments;
