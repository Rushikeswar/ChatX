import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../css/Register.css"; // Update to a new CSS file specific for Register

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/register', 
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username,
            email: email,
            password: password,
          }),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorResponse = await response.json();
        setMessage(errorResponse.errormessage || "An error occurred.");
      } else {
        setMessage('Registered successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 1000);
      }
    } catch (err) {
      setMessage('Error registering. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="register-page">
      <div className="register-toggle">
        <button onClick={() => navigate('/register')}>Sign up</button>
        <button className="register-active-button" onClick={() => navigate('/login')}>Sign in</button>
      </div>
      <div className="register-container register-animate">
        <h2 className="register-title">Sign Up</h2>
        <form id="registerForm" onSubmit={handleRegister}>
          {message && <p className="register-message">{message}</p>}
          <input
            id="register-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
          />
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <input
            id="register-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            required
          />
          <button className="register-submit-button" type="submit">Register</button>
        </form>
      </div>
    </div>
  );
};

export default Register;
