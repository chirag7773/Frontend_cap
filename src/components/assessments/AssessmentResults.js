import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Spinner, Alert, Badge } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import config from '../../config';

const AssessmentResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        console.log('Fetching assessment results...');
        const response = await fetch(`${config.apiBaseUrl}/Assessments/student/results`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Raw response:', responseText);

        if (!response.ok) {
          let errorMsg = 'Failed to fetch results';
          try {
            const errorData = JSON.parse(responseText);
            errorMsg = errorData.detail || errorData.message || errorMsg;
          } catch (e) {
            errorMsg = responseText || errorMsg;
          }
          throw new Error(errorMsg);
        }

        let data = [];
        try {
          data = JSON.parse(responseText);
          console.log('Parsed results:', data);
        } catch (e) {
          console.error('Failed to parse response:', e);
          throw new Error('Invalid response format from server');
        }

        if (!Array.isArray(data)) {
          console.error('Expected array but got:', typeof data);
          throw new Error('Invalid data format received from server');
        }

        // Log each result's structure
        if (data.length > 0) {
          console.log('First result item:', data[0]);
          console.log('First result keys:', Object.keys(data[0]));
        } else {
          console.log('No results found');
        }

        setResults(data);
      } catch (err) {
        console.error('Error in fetchResults:', err);
        setError(err.message || 'An error occurred while fetching results');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchResults();
    }
  }, [user]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score, maxScore) => {
    if (score === undefined || maxScore === undefined) return 'secondary';
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">My Assessment Results</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {results.length === 0 ? (
        <Alert variant="info">You haven't taken any assessments yet.</Alert>
      ) : (
        <Card>
          <Card.Body>
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Assessment</th>
                    <th className="text-center">Score</th>
                    <th className="text-center">Status</th>
                    <th className="text-end">Date Taken</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => {
                    // Log the result object for debugging
                    console.log('Rendering result:', result);
                    
                    // Handle different possible property names (case-insensitive)
                    const score = Number(result.Score || result.score || 0);
                    const maxScore = Number(result.MaxScore || result.maxScore || 100);
                    const hasScores = !isNaN(score) && !isNaN(maxScore);
                    const isPassed = hasScores ? score >= (maxScore * 0.6) : false;
                    const courseName = result.CourseName || result.courseName || 'Unnamed Course';
                    const assessmentTitle = result.AssessmentTitle || result.assessmentTitle || 'Untitled Assessment';
                    const attemptDate = result.AttemptDate || result.attemptDate || result.dateTaken;
                    
                    return (
                      <tr key={result.ResultId || result.id || `result-${Math.random().toString(36).substr(2, 9)}`}>
                        <td>{courseName}</td>
                        <td>{assessmentTitle}</td>
                        <td className="text-center">
                          {hasScores ? (
                            <Badge bg={getScoreColor(score, maxScore)}>
                              {Math.round(score * 10) / 10}/{maxScore}
                            </Badge>
                          ) : 'N/A'}
                        </td>
                        <td className="text-center">
                          <Badge bg={isPassed ? 'success' : 'danger'}>
                            {isPassed ? 'Passed' : 'Failed'}
                          </Badge>
                        </td>
                        <td className="text-end">
                          {attemptDate ? formatDate(attemptDate) : 'N/A'}
                          {process.env.NODE_ENV === 'development' && (
                            <div className="text-muted small">
                              ID: {result.ResultId || result.id || 'N/A'}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default AssessmentResults;
