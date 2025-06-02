import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-4 mt-auto">
      <Container>
        <Row>
          <Col md={6}>
            <h5>EduSync</h5>
            <p className="mb-0">Smart Learning Management & Assessment Platform</p>
          </Col>
          <Col md={3}>
            <h5>Links</h5>
            <ul className="list-unstyled">
              <li><a href="/about" className="text-white text-decoration-none">About Us</a></li>
              <li><a href="/contact" className="text-white text-decoration-none">Contact</a></li>
              <li><a href="/privacy" className="text-white text-decoration-none">Privacy Policy</a></li>
              <li><a href="/terms" className="text-white text-decoration-none">Terms of Service</a></li>
            </ul>
          </Col>
          <Col md={3}>
            <h5>Contact</h5>
            <address>
              <p className="mb-1">Email: info@edusync.com</p>
              <p className="mb-0">Phone: (123) 456-7890</p>
            </address>
          </Col>
        </Row>
        <hr className="bg-light" />
        <div className="text-center">
          <p className="mb-0">&copy; {new Date().getFullYear()} EduSync. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
