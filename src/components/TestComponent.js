import React, { useEffect } from 'react';

const TestComponent = () => {
  useEffect(() => {
    console.log('TestComponent mounted!');
    return () => console.log('TestComponent unmounted!');
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'red',
      color: 'white',
      padding: '10px',
      zIndex: 9999,
      borderRadius: '5px',
      boxShadow: '0 0 10px rgba(0,0,0,0.5)'
    }}>
      Test Component is Mounted!
    </div>
  );
};

export default TestComponent;
