import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../css/Login.css"
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/login', 
        { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
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
        const data = await response.json();
        if (data.user) {
          sessionStorage.setItem('user_id', data.user._id);
          setMessage('Login successful');
          setTimeout(() => {
            navigate('/chatrooms');
          }, 1000);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="login-page">
      <div className="login-toggle">
        <button onClick={() => navigate('/register')}>Sign up</button>
        <button className="login-active-button" onClick={() => navigate('/login')}>Sign in</button>
      </div>
      <div className="login-container">
        <h2 className="login-title">Sign In</h2>
        <form className="login-form" onSubmit={handleLogin}>
          <input className="login-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
          <input className="login-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
          <button className="login-submit-button" type="submit">Login</button>
          <div className="login-message">{message}</div>
        </form>
      </div>
    </div>
  );
};

export default Login;
