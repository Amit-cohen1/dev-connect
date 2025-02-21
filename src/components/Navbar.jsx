// src/components/Navbar.js
import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import NotificationSystem from './NotificationSystem';

const Navbar = () => {
  const { user, signOut } = useContext(AuthContext);
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-24 md:h-40">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex-shrink-0">
              <img
                src="/Logo/logo-transparent.png"
                alt="DevTogether Logo"
                className="h-24 md:h-44 w-auto"
              />
            </Link>
            {/* Navigation links moved here */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <Link
                to="/"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Home
              </Link>
              <Link
                to="/projects"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Projects
              </Link>
              {userData?.type === 'organization' && (
                <Link
                  to="/gemini-project-ai"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Project AI
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button and notifications */}
          <div className="flex items-center space-x-2 md:hidden">
            {user && (
              <div className="flex items-center">
                <NotificationSystem />
              </div>
            )}
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>

          {/* Right side menu items */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user ? (
              <>
                <div className="flex items-center">
                  <NotificationSystem />
                </div>

                {userData?.type === 'organization' && (
                  <Link
                    to="/organization-portal"
                    className="bg-blue-100 text-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-200"
                  >
                    Organization Portal
                  </Link>
                )}
                
                <Link
                  to="/profile"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Profile
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div 
        className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} fixed top-0 left-0 w-full h-screen bg-white transform transition-transform duration-300 ease-in-out z-[60] md:hidden overflow-y-auto`}
      >
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" onClick={() => setIsOpen(false)}>
              <img
                src="/Logo/logo-transparent.png"
                alt="DevTogether Logo"
                className="h-20 w-auto"
              />
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-3">
            <Link
              to="/"
              className="block text-lg text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md font-medium hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/projects"
              className="block text-lg text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md font-medium hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              Projects
            </Link>
            {userData?.type === 'organization' && (
              <Link
                to="/gemini-project-ai"
                className="block text-lg text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md font-medium hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                Project AI
              </Link>
            )}
            {user ? (
              <>
                {userData?.type === 'organization' && (
                  <Link
                    to="/organization-portal"
                    className="block text-lg bg-blue-50 text-blue-600 px-4 py-3 rounded-md font-medium hover:bg-blue-100"
                    onClick={() => setIsOpen(false)}
                  >
                    Organization Portal
                  </Link>
                )}
                
                <Link
                  to="/profile"
                  className="block text-lg text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md font-medium hover:bg-gray-50"
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
                
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full text-left text-lg bg-blue-600 text-white px-4 py-3 rounded-md font-medium hover:bg-blue-700 mt-4"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="space-y-3 mt-4">
                <Link
                  to="/login"
                  className="block text-lg text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md font-medium hover:bg-gray-50"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block text-lg bg-blue-600 text-white px-4 py-3 rounded-md font-medium hover:bg-blue-700"
                  onClick={() => setIsOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[50] md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </nav>
  );
};

export default Navbar;