import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome to the Chat App</h1>
      <p>Select an option to proceed:</p>
      <div style={{ margin: '20px 0' }}>
        <Link to="/login" style={linkStyle}>Login</Link> | 
        <Link to="/register" style={linkStyle}> Register</Link> |  
      </div>
    </div>
  );
};

const linkStyle = {
  textDecoration: 'none',
  color: '#007BFF',
  margin: '0 15px',
  fontSize: '18px',
};

export default Home;
