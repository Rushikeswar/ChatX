import React, { useState } from 'react';
import {useNavigate } from 'react-router-dom';
//import '../css/SignupLogin.css';
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message,setmessage]=useState('');
  const navigate=useNavigate();
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response= await fetch('http://localhost:3000/login', 
        { 
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            email:email,
            password:password,
          }),
          credentials:'include',
        });
        if(!response.ok)
        {
          const errorResponse = await response.json();
          console.log(errorResponse.errormessage);
          setError(true);
          setmessage(errorResponse.errormessage || "An error occurred.");
        }
        else{
          const data=await response.json();
          if(data.user)
          {sessionStorage.setItem('user_id',data.user._id);
            setmessage('login successful');
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
    <div id="signin-login-page">
        <div className="auth-toggle">
          <button onClick={() => navigate('/register')}>Sign up</button>
          <button className="activebutton" onClick={() => navigate('/login')}>Sign in</button>
        </div>
    <div className="signup-login-container login-animate">
    <h2 className="signup-login-title">Sign In</h2>
    <form id='signupForm' onSubmit={handleLogin}>
      <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
      <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required/>
      <button className='signuploginbutton' type="submit">Login</button>
      <div>{message}</div>
    </form>
    </div>
    </div>
  );
};

export default Login;
