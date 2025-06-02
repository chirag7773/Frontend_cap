import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Card, 
  Table, 
  Spinner, 
  Alert, 
  Badge, 
  Button, 
  Row, 
  Col 
} from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import config from '../../config';

const AssessmentResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchResults = async () => {
      if (!user?.token) {
        const errorMsg = 'User not authenticated';
        console.error(errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        console.log('Fetching assessment results...');
        
        const apiUrl = `${config.apiBaseUrl}/Assessments/student/results`;
        console.log('API URL:', apiUrl);

        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        
        if (!response.ok) {
          console.error('Error response:', responseText);
          throw new Error(`Failed to fetch assessment results: ${response.status} ${response.statusText}`);
        }

        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Parsed API Response:', JSON.stringify(data, null, 2));
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          throw new Error('Invalid JSON response from server');
        }
        
        if (!Array.isArray(data)) {
          console.error('Expected array but got:', typeof data);
          throw new Error('Invalid data format received from server');
        }

        // Log detailed information about the data
        console.log(`Received ${data.length} results`);
        if (data.length > 0) {
          console.log('First result item structure:', Object.keys(data[0]));
          console.log('First result item values:', data[0]);
          
          // Log all results for debugging
          data.forEach((item, index) => {
            console.log(`Result ${index + 1} type:`, typeof item);
            console.log(`Result ${index + 1} keys:`, Object.keys(item));
            console.log(`Result ${index + 1} values:`, JSON.stringify(item, null, 2));
          });
        } else {
          console.log('No assessment results found');
        }
        
        setResults(data || []);
      } catch (err) {
        const errorMsg = err.name === 'AbortError' 
          ? 'Request timed out. Please try again.' 
          : `Error: ${err.message}. Please check the console for more details.`;
        
        console.error('Error in fetchResults:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
        
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
    
    // Cleanup function to abort fetch on component unmount
    return () => {
      // Any cleanup if needed
    };
  }, [user]);

  const getScoreColor = (score, maxScore) => {
    if (score === undefined || maxScore === undefined) return 'secondary';
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'danger';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading your assessment results...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Results</Alert.Heading>
          <p>{error}</p>
          <Button 
            variant="outline-danger" 
            onClick={() => window.location.reload()}
            className="mt-2"
          >
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>My Assessment Results</h2>
        </Col>
        <Col xs="auto">
          <Button 
            variant="outline-primary" 
            onClick={() => window.location.reload()}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Col>
      </Row>

      {results.length === 0 ? (
        <Alert variant="info">
          <Alert.Heading>No Results Found</Alert.Heading>
          <p>You haven't taken any assessments yet. Your results will appear here after you complete an assessment.</p>
        </Alert>
      ) : (
        <Card className="shadow-sm">
          <Card.Body>
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th>Assessment</th>
                    <th className="text-center">Score</th>
                    <th className="text-center">Status</th>
                    <th className="text-end">Date Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => {
                    // Log each result being rendered
                    console.log(`Rendering result ${index}:`, JSON.stringify({
                      ResultId: result.ResultId,
                      AssessmentTitle: result.AssessmentTitle,
                      CourseName: result.CourseName,
                      Score: result.Score,
                      MaxScore: result.MaxScore,
                      AttemptDate: result.AttemptDate,
                      RawDate: result.AttemptDate ? new Date(result.AttemptDate).toString() : 'No date'
                    }, null, 2));

                    const hasScores = result.Score !== undefined && result.MaxScore !== undefined;
                    const score = Number(result.Score) || 0;
                    const maxScore = Number(result.MaxScore) || 100; // Default to 100 if not provided
                    const isPassed = hasScores ? score >= (maxScore * 0.6) : false;
                    
                    return (
                      <tr key={result.ResultId || `result-${index}`}>
                        <td>{result.AssessmentTitle || 'N/A'}</td>
                        <td className="text-center">
                          {hasScores ? (
                            <Badge bg={getScoreColor(score, maxScore)}>
                              {score}/{maxScore}
                            </Badge>
                          ) : 'N/A'}
                        </td>
                        <td className="text-center">
                          <Badge bg={isPassed ? 'success' : 'danger'}>
                            {isPassed ? 'Passed' : 'Failed'}
                          </Badge>
                        </td>
                        <td className="text-end">
                          <div>{formatDate(result.AttemptDate)}</div>
                          {process.env.NODE_ENV === 'development' && (
                            <div className="text-muted small mt-1">
                              <div>ID: {result.ResultId || 'N/A'}</div>
                              <div>Raw Date: {result.AttemptDate || 'No date'}</div>
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