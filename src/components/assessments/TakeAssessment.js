import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Container, Card, Spinner, Form } from 'react-bootstrap';
import { FaExclamationTriangle, FaCheck, FaArrowLeft, FaClock, FaListUl } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import config from '../../config';
import api from '../../services/api';

// Inline styles for better visibility
const styles = {
  debugContainer: {
    border: '2px solid #dc3545',
    padding: '20px',
    margin: '20px',
    borderRadius: '5px',
    backgroundColor: '#fff8f8',
  },
  debugInfo: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '5px',
    margin: '10px 0',
    border: '1px solid #dee2e6',
  },
  testButton: {
    margin: '5px',
  },
};

// Add some basic styles for debugging
const debugStyles = `
  .debug-container {
    border: 2px solid #dc3545;
    padding: 20px;
    margin: 20px 0;
    border-radius: 5px;
  }
  .debug-info {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 5px;
    margin: 10px 0;
  }
`;

// Simple debug component
export const TakeAssessment = () => {
  const { assessmentId } = useParams();
  const location = useLocation();
  
  console.log('DEBUG - TakeAssessment rendered with ID:', assessmentId);
  console.log('Current location:', location);
  
  // Add styles to the document head
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = debugStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Fetch assessment data
  useEffect(() => {
    const fetchAssessment = async () => {
      if (!assessmentId || !user?.token) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch assessment details
        const response = await fetch(`${config.apiBaseUrl}/Assessments/${assessmentId}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch assessment: ${response.status}`);
        }

        let data = await response.json();
        
        // If questions are not included, fetch them separately
        if (!data.questions || data.questions.length === 0) {
          console.log('No questions found in assessment, fetching separately...');
          const questionsResponse = await fetch(`${config.apiBaseUrl}/Assessments/${assessmentId}/questions`, {
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (questionsResponse.ok) {
            const questionsData = await questionsResponse.json();
            data.questions = questionsData;
            console.log('Fetched questions:', questionsData);
          } else {
            console.warn('Failed to fetch questions separately');
            data.questions = [];
          }
        } else {
          console.log('Questions found in assessment data:', data.questions);
        }
        
        setAssessment(data);
        
        // Initialize answers object with null for each question
        if (data.questions) {
          const initialAnswers = {};
          data.questions.forEach(q => {
            initialAnswers[q.questionId] = null; // Initialize with null for radio buttons
          });
          setAnswers(initialAnswers);
          console.log('Initialized answers:', initialAnswers);
        }
        
        // Set up timer if there's a time limit
        if (data.timeLimitMinutes) {
          setTimeLeft(data.timeLimitMinutes * 60); // Convert to seconds
        }
        
      } catch (err) {
        console.error('Error fetching assessment:', err);
        setError(err.message || 'Failed to load assessment. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessment();
  }, [assessmentId, user?.token]);

  // Timer effect
  useEffect(() => {
    if (!timeLeft) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // Auto-submit when time is up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAnswerChange = (questionId, optionId) => {
    console.log(`Selected option ${optionId} for question ${questionId}`);
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };
  
  // Helper to get options from question object
  const getOptions = (question) => {
    const options = [];
    
    // Check each possible option (A, B, C, D)
    ['A', 'B', 'C', 'D'].forEach(letter => {
      const optionKey = `option${letter}`;
      const optionValue = question[optionKey];
      
      // Only add the option if it has a value and is not 'null' or empty string
      if (optionValue && optionValue.trim() !== '' && optionValue.toLowerCase() !== 'null') {
        options.push({
          optionId: optionKey,  // Using 'optionA', 'optionB' as IDs
          text: optionValue,
          letter: letter
        });
      }
    });
    
    return options;
  };

  // Helper to render options for a question
  const renderOptions = (question) => {
    const options = getOptions(question);
    
    if (options.length === 0) {
      console.warn('No valid options found for question:', question);
      return <Alert variant="warning">No valid options available for this question.</Alert>;
    }
    
    return (
      <div className="options-container">
        {options.map((option) => (
          <div key={`${question.questionId}-${option.optionId}`} className="form-check mb-2">
            <input
              className="form-check-input"
              type="radio"
              name={`question-${question.questionId}`}
              id={`option-${question.questionId}-${option.optionId}`}
              checked={answers[question.questionId] === option.optionId}
              onChange={() => handleAnswerChange(question.questionId, option.optionId)}
              disabled={isSubmitting}
            />
            <label 
              className="form-check-label d-block p-2 rounded"
              style={{
                backgroundColor: answers[question.questionId] === option.optionId ? '#e9f5ff' : 'transparent',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                width: '100%',
                borderRadius: '4px',
              }}
              htmlFor={`option-${question.questionId}-${option.optionId}`}
            >
              <strong>{option.letter}.</strong> {option.text}
            </label>
          </div>
        ))}
      </div>
    );
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    
    try {
      // Check if all questions are answered
      const unanswered = Object.entries(answers).filter(([_, value]) => value === null || value.trim() === '');
      
      if (unanswered.length > 0) {
        const confirmSubmit = window.confirm(
          `You have ${unanswered.length} unanswered question(s). Are you sure you want to submit?`
        );
        if (!confirmSubmit) return;
      }
      
      setIsSubmitting(true);
      
      // Prepare submission data
      const submission = {
        assessmentId,
        answers: Object.entries(answers).map(([questionId, optionId]) => ({
          questionId,
          selectedOption: optionId ? optionId.replace('option', '') : ''
        }))
      };
      
      console.log('Submitting assessment:', submission);
      
      // Submit using the API service
      const response = await api.post('/Assessments/Submit', submission);
      const result = response.data;
      
      console.log('Submission successful:', result);
      
      // Show success message
      alert(`Assessment submitted successfully! Your score: ${result.score}/${result.maxScore}`);
      
      // Redirect to homepage after successful submission
      navigate('/', { replace: true });
      
    } catch (err) {
      console.error('Error submitting assessment:', {
        error: err,
        message: err.message,
        stack: err.stack
      });
      alert(`Failed to submit assessment: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <h4>Loading assessment...</h4>
          <p className="text-muted">Please wait while we load your assessment</p>
        </div>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <div className="d-flex align-items-center">
            <FaExclamationTriangle className="me-2" size={24} />
            <div>
              <h4 className="alert-heading">Error Loading Assessment</h4>
              <p className="mb-0">{error}</p>
              <Button 
                variant="outline-danger" 
                className="mt-3" 
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </div>
        </Alert>
      </Container>
    );
  }

  // No assessment found
  if (!assessment) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <div className="d-flex align-items-center">
            <FaExclamationTriangle className="me-2" size={24} />
            <div>
              <h4 className="alert-heading">Assessment Not Found</h4>
              <p className="mb-0">The requested assessment could not be loaded.</p>
              <Button 
                variant="outline-secondary" 
                className="mt-2" 
                onClick={() => navigate(-1)}
              >
                Go Back
              </Button>
            </div>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Button 
          variant="outline-secondary" 
          onClick={() => navigate(-1)}
          className="d-flex align-items-center"
          disabled={isSubmitting}
        >
          <FaArrowLeft className="me-2" /> Back
        </Button>
        
        {timeLeft !== null && (
          <div className="d-flex align-items-center bg-light px-3 py-2 rounded">
            <FaClock className="me-2 text-danger" />
            <span className="fw-bold">Time Remaining: {formatTime(timeLeft)}</span>
          </div>
        )}
      </div>
      
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h1 className="h3 mb-2">{assessment.title}</h1>
              {assessment.description && (
                <p className="text-muted">{assessment.description}</p>
              )}
            </div>
            <div className="d-flex gap-3 text-muted small">
              {assessment.timeLimitMinutes && (
                <span className="d-flex align-items-center">
                  <FaClock className="me-1" /> {assessment.timeLimitMinutes} min
                </span>
              )}
              {assessment.questions?.length > 0 && (
                <span className="d-flex align-items-center">
                  <FaListUl className="me-1" /> {assessment.questions.length} questions
                </span>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>
      
      <Form onSubmit={handleSubmit}>
        {assessment.questions?.map((question, index) => (
          <Card key={question.questionId} className="mb-4 shadow-sm">
            <Card.Body>
              <Card.Title className="h5 mb-3">
                Question {index + 1}
                {question.points > 0 && (
                  <span className="text-muted small ms-2">
                    ({question.points} point{question.points !== 1 ? 's' : ''})
                  </span>
                )}
              </Card.Title>
              <div className="question-text mb-4">
                {question.text}
              </div>
              
              <Form.Group controlId={`question-${question.questionId}`}>
                <Form.Label className="fw-bold mb-3">Select your answer:</Form.Label>
                {renderOptions(question)}
                
                {/* Debug info - can be removed in production */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-3 small text-muted">
                    <div className="debug-info">
                      <span className="text-muted">Selected: </span>
                      <span className="fw-medium">
                        {answers[question.questionId] 
                          ? `${answers[question.questionId].replace('option', '')}. ${getOptions(question).find(o => o.optionId === answers[question.questionId])?.text}`
                          : 'None'}
                      </span>
                    </div>
                  </div>
                )}
              </Form.Group>
            </Card.Body>
          </Card>
        ))}
        
        <div className="d-flex justify-content-between mt-4">
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            disabled={isSubmitting}
            className="px-4"
          >
            {isSubmitting ? (
              <>
                <Spinner as="span" size="sm" animation="border" className="me-2" />
                Submitting...
              </>
            ) : (
              <>
                <FaCheck className="me-2" />
                Submit Assessment
              </>
            )}
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default TakeAssessment;