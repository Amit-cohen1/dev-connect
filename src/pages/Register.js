// src/pages/Register.js
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import DeveloperRegistration from '../components/auth/DeveloperRegistration';
import OrganizationRegistration from '../components/auth/OrganizationRegistration';

const Register = () => {
  const [userType, setUserType] = useState(null);

  const handleSelection = (type) => {
    setUserType(type);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {!userType ? (
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Join DevTogether
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choose how you want to participate
          </p>

          <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-4">
              <button
                onClick={() => handleSelection('developer')}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Join as Developer
              </button>
              <button
                onClick={() => handleSelection('organization')}
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Join as Organization/Company
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {userType === 'developer' ? (
            <DeveloperRegistration onBack={() => setUserType(null)} />
          ) : (
            <OrganizationRegistration onBack={() => setUserType(null)} />
          )}
        </>
      )}
    </div>
  );
};

export default Register;