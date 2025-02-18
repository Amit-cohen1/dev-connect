// src/App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Import all components and pages
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Projects from './pages/Projects';
import Profile from './pages/Profile';
import OrganizationPortal from './pages/OrganizationPortal';
import UploadProject from './pages/UploadProject';
import ProjectDetail from './pages/ProjectDetail';
import PrivateRoute from './components/PrivateRoute';
import OrganizationRoute from './components/OrganizationRoute';
import GeminiProjectAI from './pages/GeminiProjectAI';
import UserProfile from './pages/UserProfile';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen bg-gray-50">
          {/* Navbar */}
          <Navbar />
          {/* Main Content */}
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/project/:projectId" element={<ProjectDetail />} />
              <Route path="/gemini-project-ai" element={<GeminiProjectAI />} />
              <Route path="/user/:userId" element={<UserProfile />} />

              {/* Protected Routes */}
              <Route 
                path="/profile" 
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                } 
              />

              {/* Organization Only Routes */}
              <Route 
                path="/organization-portal" 
                element={
                  <OrganizationRoute>
                    <OrganizationPortal />
                  </OrganizationRoute>
                } 
              />
              <Route 
                path="/upload-project" 
                element={
                  <OrganizationRoute>
                    <UploadProject />
                  </OrganizationRoute>
                } 
              />

              {/* 404 Route - Keep it last */}
              <Route 
                path="*" 
                element={
                  <div className="flex flex-col items-center justify-center min-h-screen">
                    <h1 className="text-4xl font-bold text-gray-900">404 - Page Not Found</h1>
                    <p className="mt-2 text-gray-600">The page you're looking for doesn't exist.</p>
                  </div>
                } 
              />
            </Routes>
          </main>
          {/* Footer */}
          <Footer />
       </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
