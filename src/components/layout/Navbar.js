import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BSNavbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <BSNavbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <BSNavbar.Brand as={Link} to="/">EduSync</BSNavbar.Brand>
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BSNavbar.Collapse id="basic-navbar-nav">
          {user ? (
            <>
              <Nav className="me-auto">
                <Nav.Link as={Link} to={user.role === 'Instructor' ? "/instructor/dashboard" : "/student/dashboard"}>
                  <i className="bi bi-house-door me-1"></i> Dashboard
                </Nav.Link>
                
                <Nav.Link as={Link} to={"/student/available-courses"}>
                  <i className="bi bi-journals me-1"></i> All Courses
                </Nav.Link>
                
                {user.role === 'Student' && (
                  <Nav.Link as={Link} to={"/student/courses"}>
                    <i className="bi bi-collection me-1"></i> My Courses
                  </Nav.Link>
                )}
                
                {user.role === 'Student' && (
                  <Nav.Link as={Link} to="/student/results" className="me-2" style={{ color: 'white', background: '#0d6efd', borderRadius: '5px' }}>
                    <i className="bi bi-clipboard-data me-1"></i> My Results
                  </Nav.Link>
                )}
                
                {user.role === 'Student' && (
                  <Nav.Link as={Link} to="/student/available-assessments">
                    <i className="bi bi-pencil-square me-1"></i> Take Assessment
                  </Nav.Link>
                )}
                
                {user.role === 'Instructor' && (
                  <>
                    <Nav.Link as={Link} to="/instructor/student-results">
                      <i className="bi bi-people-fill me-1"></i> Student Results
                    </Nav.Link>
                    <NavDropdown 
                      title={
                        <>
                          <i className="bi bi-easel me-1"></i> Instructor
                        </>
                      } 
                      id="instructor-dropdown"
                    >
                      <NavDropdown.Item as={Link} to="/instructor/courses">
                        <i className="bi bi-journal-text me-2"></i> My Courses
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/instructor/assessments">
                        <i className="bi bi-plus-circle me-2"></i> Create Assessment
                      </NavDropdown.Item>
                      <NavDropdown.Divider />
                      <NavDropdown.Item as={Link} to="/instructor/assessments/manage">
                        <i className="bi bi-gear me-2"></i> Manage Assessments
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/instructor/results">
                        <i className="bi bi-graph-up me-2"></i> View Results
                      </NavDropdown.Item>
                    </NavDropdown>
                  </>
                )}
              </Nav>
              <Nav>
                <NavDropdown
                  title={
                    <>
                      <i className="bi bi-person-circle me-1"></i>
                      {user.name || 'Profile'}
                    </>
                  }
                  id="user-dropdown"
                  align="end"
                >
                  <NavDropdown.Item as={Link} to={`/${user.role.toLowerCase()}/profile`}>
                    <i className="bi bi-person-lines-fill me-2"></i> My Profile
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i> Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </Nav>
            </>
          ) : (
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
              <Nav.Link as={Link} to="/register">Register</Nav.Link>
            </Nav>
          )}
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;
