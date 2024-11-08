// src/components/Register.js
import React, { useState } from 'react';
import axios from 'axios';
import {useNavigate } from 'react-router-dom';
//import '../css/SignupLogin.css';
const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setmessage] = useState('');
  const navigate=useNavigate();
  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setmessage('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/register', 
        {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            username:username,
            email:email,
            password:password,
          }),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorResponse = await response.json();
        console.log(errorResponse.errormessage);
        setmessage(true);
        setmessage(errorResponse.errormessage || "An error occurred.");
      }        else{
        setmessage('Registered successfully !!');
        setTimeout(() => {
          navigate('/login');
        }, 1000);
        }
    } catch (err) {
      setmessage('Error registering. Please try again.');
      console.error(err);
    }
  };

  return (
    <div id="signin-login-page">
          <div className="auth-toggle">
          <button onClick={() => navigate('/register')}>Sign up</button>
          <button className="activebutton" onClick={() => navigate('/login')}>Sign in</button>
        </div>
    <div className="signup-login-container login-animate">
    <h2 className="signup-login-title">Sign Up</h2>
    <form id="signupForm" onSubmit={handleRegister}>
      {message && <p style={{ color: 'red' }}>{message}</p>}
      <input
      id="username"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        required
      />
      <input
      id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
      id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <input
      id="password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm Password"
        required
      />
      <button className='signuploginbutton' type="submit">Register</button>
    </form>
    </div>
    </div>
  );
};

export default Register;
