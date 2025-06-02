import React from 'react';
import { Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import StudentDashboard from './student/StudentDashboard';
import InstructorDashboard from './instructor/InstructorDashboard';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  
  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container my-5">
        <Alert variant="warning">
          Please <a href="/login">log in</a> to view your dashboard.
        </Alert>
      </div>
    );
  }

  // Determine which dashboard to show based on user role
  // In a real app, this would come from your user object in the auth context
  const isInstructor = user.role === 'instructor';

  return (
    <>
      {isInstructor ? (
        <InstructorDashboard />
      ) : (
        <StudentDashboard />
      )}
    </>
  );
};

export default Dashboard;
