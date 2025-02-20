// src/pages/Register.js
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import DeveloperRegistration from '../components/auth/DeveloperRegistration';
import OrganizationRegistration from '../components/auth/OrganizationRegistration';

const Register = () => {
  const [userType, setUserType] = useState(null);
  const [hoveredType, setHoveredType] = useState(null);

  const handleSelection = (type) => {
    setUserType(type);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {!userType ? (
        <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Join <span className="text-blue-600">DevTogether</span>
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Choose your path and become part of our growing community
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {/* Developer Card */}
            <div
              className={`relative overflow-hidden rounded-2xl transition-all duration-300 transform ${
                hoveredType === 'developer' ? 'scale-105' : ''
              }`}
              onMouseEnter={() => setHoveredType('developer')}
              onMouseLeave={() => setHoveredType(null)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-400 opacity-90"></div>
              <div className="relative p-8">
                <div className="aspect-w-16 aspect-h-9 mb-6">
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Join as Developer</h3>
                <ul className="space-y-3 text-white/90 mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Build your portfolio
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Gain real experience
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Make a difference
                  </li>
                </ul>
                <button
                  onClick={() => handleSelection('developer')}
                  className="w-full py-3 px-4 rounded-lg bg-white text-blue-600 font-medium hover:bg-blue-50 transition-colors duration-200"
                >
                  Register as Developer
                </button>
              </div>
            </div>

            {/* Organization Card */}
            <div
              className={`relative overflow-hidden rounded-2xl transition-all duration-300 transform ${
                hoveredType === 'organization' ? 'scale-105' : ''
              }`}
              onMouseEnter={() => setHoveredType('organization')}
              onMouseLeave={() => setHoveredType(null)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-700 opacity-90"></div>
              <div className="relative p-8">
                <div className="aspect-w-16 aspect-h-9 mb-6">
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Join as Organization</h3>
                <ul className="space-y-3 text-white/90 mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Post your projects
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Find talented developers
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Grow your impact
                  </li>
                </ul>
                <button
                  onClick={() => handleSelection('organization')}
                  className="w-full py-3 px-4 rounded-lg bg-white text-gray-900 font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Register as Organization
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">
          {userType === 'developer' ? (
            <DeveloperRegistration onBack={() => setUserType(null)} />
          ) : (
            <OrganizationRegistration onBack={() => setUserType(null)} />
          )}
        </div>
      )}
    </div>
  );
};

export default Register;