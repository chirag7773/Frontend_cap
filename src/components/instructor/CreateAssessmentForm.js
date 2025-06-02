import React, { useState } from 'react';
import { Form, Button, Modal, Alert, Row, Col, Card } from 'react-bootstrap';
import { FaPlus, FaTrash } from 'react-icons/fa';

const CreateAssessmentForm = ({ courseId, show, onHide, onSave }) => {
  const [title, setTitle] = useState('');
  const [maxScore, setMaxScore] = useState(10);
  const [questions, setQuestions] = useState([
    { 
      questionText: '', 
      optionA: '', 
      optionB: '', 
      optionC: '', 
      optionD: '', 
      correctOption: 'A' 
    }
  ]);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (maxScore <= 0) {
      newErrors.maxScore = 'Max score must be greater than 0';
    }
    
    // Validate questions
    questions.forEach((q, index) => {
      if (!q.questionText.trim()) {
        newErrors[`question_${index}`] = 'Question text is required';
      }
      if (!q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim()) {
        newErrors[`options_${index}`] = 'All options are required';
      }
      if (!q.correctOption) {
        newErrors[`correct_${index}`] = 'Please select the correct option';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { 
        questionText: '', 
        optionA: '', 
        optionB: '', 
        optionC: '', 
        optionD: '', 
        correctOption: 'A' 
      }
    ]);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length > 1) {
      const newQuestions = [...questions];
      newQuestions.splice(index, 1);
      setQuestions(newQuestions);
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const assessmentData = {
        title,
        maxScore: parseInt(maxScore, 10),
        courseId,
        questions: questions.map(q => ({
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctOption: q.correctOption
        }))
      };
      
      onSave(assessmentData);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Create New Assessment</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Assessment Title</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              isInvalid={!!errors.title}
            />
            <Form.Control.Feedback type="invalid">
              {errors.title}
            </Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Maximum Score</Form.Label>
            <Form.Control
              type="number"
              min="1"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              isInvalid={!!errors.maxScore}
            />
            <Form.Control.Feedback type="invalid">
              {errors.maxScore}
            </Form.Control.Feedback>
          </Form.Group>
          
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6>Questions</h6>
              <Button 
                variant="outline-primary" 
                size="sm"
                type="button"
                onClick={handleAddQuestion}
              >
                <FaPlus className="me-1" /> Add Question
              </Button>
            </div>
            
            {questions.map((q, qIndex) => (
              <Card key={qIndex} className="mb-3 border-primary">
                <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                  <span>Question {qIndex + 1}</span>
                  {questions.length > 1 && (
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      type="button"
                      onClick={() => handleRemoveQuestion(qIndex)}
                    >
                      <FaTrash />
                    </Button>
                  )}
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Question Text</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={q.questionText}
                      onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                      isInvalid={!!errors[`question_${qIndex}`]}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors[`question_${qIndex}`]}
                    </Form.Control.Feedback>
                  </Form.Group>
                  
                  <Row className="g-3 mb-3">
                    {['A', 'B', 'C', 'D'].map((option) => (
                      <Col md={6} key={option}>
                        <Form.Group>
                          <div className="input-group">
                            <span className="input-group-text">{option}.</span>
                            <Form.Control
                              type="text"
                              placeholder={`Enter option ${option}`}
                              value={q[`option${option}`]}
                              onChange={(e) => handleQuestionChange(qIndex, `option${option}`, e.target.value)}
                              isInvalid={!!errors[`options_${qIndex}`]}
                            />
                          </div>
                        </Form.Group>
                      </Col>
                    ))}
                  </Row>
                  
                  {/* Correct Option Selection */}
                  <div className="mb-3">
                    <Form.Label className="fw-bold">Select Correct Option:</Form.Label>
                    <div className="d-flex flex-wrap gap-3">
                      {['A', 'B', 'C', 'D'].map((option) => (
                        <Form.Check
                          key={option}
                          type="radio"
                          id={`correct-${qIndex}-${option}`}
                          name={`correct-${qIndex}`}
                          label={`Option ${option}`}
                          checked={q.correctOption === option}
                          onChange={() => handleQuestionChange(qIndex, 'correctOption', option)}
                          disabled={!q[`option${option}`].trim()}
                          className="px-3 py-2 border rounded"
                        />
                      ))}
                    </div>
                    {errors[`correct_${qIndex}`] && (
                      <div className="text-danger small mt-2">{errors[`correct_${qIndex}`]}</div>
                    )}
                  </div>
                  
                  {errors[`options_${qIndex}`] && (
                    <div className="text-danger small mt-2">
                      {errors[`options_${qIndex}`]}
                    </div>
                  )}
                </Card.Body>
              </Card>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Create Assessment
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreateAssessmentForm;
