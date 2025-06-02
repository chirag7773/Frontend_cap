import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import 'bootstrap/dist/js/bootstrap.bundle.min';

// Get the root element
const rootElement = document.getElementById('root');

if (rootElement) {
  console.log('Root element found, mounting React app...');
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
  console.log('React app mounted successfully!');
} else {
  console.error('Root element not found!');
}
