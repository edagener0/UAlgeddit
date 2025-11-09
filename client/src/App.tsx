import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/Home/Home'
import Register from './pages/Auth/Register/Register'
import Login from './pages/Auth/Login/Login'
import Navbar from './components/Navbar/Navbar'
import "./index.css"
import PrivateRoutes from './utils/PrivateRoutes'
import ListPosts from './pages/Posts/Posts'
import Logout from './components/Logout/Logout'
import { useState } from 'react'

function App() {
  // TODO FIX: if token expires app will most likely break

  const [token, setToken] = useState(localStorage.getItem("token"));

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    
    <BrowserRouter>
      <Navbar token={token}/>
      <Routes>
        <Route element={<PrivateRoutes token={token}/>}>
          <Route path="/posts" element={<ListPosts/>}/>
          <Route path="/auth/logout" element={<Logout logout={logout}/>}/>
        </Route>
        <Route path="/" element={<HomePage/>}/>
        <Route path="/auth/register" element={<Register token={token}/>}/>
        <Route path="/auth/login" element={<Login login={login} token={token}/>}/>
        <Route path="*" element={<Navigate to="/" />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
