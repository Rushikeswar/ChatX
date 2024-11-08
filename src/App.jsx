import React from 'react';
import { createBrowserRouter, RouterProvider,useParams } from 'react-router-dom';
import Login from '../frontend/components/Login';
import Register from '../frontend/components/Register';
import ChatRoom from '../frontend/components/ChatRoom';
import Home from '../frontend/components/Home';
const App = () => {
  const router=createBrowserRouter([
    {
      path:'/',
      element:<Home/>
    },
    {
      path:'/register',
      element:<Register/>
    },
    {
      path:'/login',
      element:<Login/>
    },
    {
      path:'/chatrooms',
      element:<ChatRoom/>
    }
  ])
  return <RouterProvider router={router} />;
};

export default App;
