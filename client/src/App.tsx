import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/Home/Home'
import Register from './pages/Auth/Register/Register'
import Login from './pages/Auth/Login/Login'
import Navbar from './components/Navbar/Navbar'
import "./index.css"
import PrivateRoutes from './utils/PrivateRoutes'
import ListPosts from './pages/Posts/List/PostsList'
import Logout from './components/Logout/Logout'
import { useState } from 'react'
import PostDetail from './pages/Posts/Detail/PostDetail'
import SubgedditsList from './pages/Subgeddits/List/SubgedditsList'
import SubgedditsDetail from './pages/Subgeddits/Detail/SubgedditsDetail'
import { getUserFromToken } from './utils/User'
import SubgedditsCreate from './pages/Subgeddits/Create/SubgedditsCreate'
import PostsCreate from './pages/Posts/Create/PostCreate'
import Chat from './pages/Chat/Chat'
import Profile from './pages/Profile/View/Profile'
import ProfileUpdate from './pages/Profile/Update/ProfileUpdate'
import SubgedditUpdate from './pages/Subgeddits/Update/SubgedditUpdate'

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  const decodedJWT = getUserFromToken(token)

  let currentUserID = null;
  if (decodedJWT !== null)
  {
    currentUserID = decodedJWT.userID
  }
  
  return (
    
    <BrowserRouter>
      <Navbar token={token} currentUserID={currentUserID}/>
      <Routes>
        <Route element={<PrivateRoutes token={token} logout={logout}/>}>
          <Route path="/posts" element={<ListPosts token={token}/>}/>
          <Route path="/posts/create" element={<PostsCreate token={token} currentUserID={currentUserID}/>}/>
          <Route path="/posts/:id" element={<PostDetail token={token} currentUserID={currentUserID}/>}/>
          <Route path="/subgeddits" element={<SubgedditsList token={token} currentUserID={currentUserID}/>}/>
          <Route path="/subgeddits/create" element={<SubgedditsCreate token={token} currentUserID={currentUserID}/>}/>
          <Route path="/subgeddits/:id" element={<SubgedditsDetail token={token}/>}/>
          <Route path="/subgeddits/:subgedditID/post/create" element={<PostsCreate token={token} currentUserID={currentUserID}/>}/>
          <Route path="/auth/logout" element={<Logout logout={logout}/>}/>
          <Route path="/chat" element={<Chat token={token}/>}/>
          <Route path="/profile/:user_id" element={<Profile token={token} currentUserID={currentUserID}/>}/>
          <Route path="/profile/update/:user_id" element={<ProfileUpdate token={token}/>}/>
          <Route path="/subgeddits/update/:subgeddit_id" element={<SubgedditUpdate token={token}/>}></Route>
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
