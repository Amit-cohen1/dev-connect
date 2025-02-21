// src/components/ProjectApplicationForm.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendNewApplicationNotification } from '../utils/notifications';

const ProjectApplicationForm = ({ project, onClose, onSubmitSuccess }) => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    coverLetter: '',
    githubProfile: '',
    availability: '',
    commitment: 'full-time'
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const applicationData = {
        userId: user.uid,
        userName: user.displayName,
        userEmail: user.email,
        projectId: project.id,
        projectTitle: project.title,
        organizationId: project.organizationId,
        status: 'pending',
        ...formData,
        dateApplied: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'projectApplications'), applicationData);

      await sendNewApplicationNotification(
        project.organizationId,
        project.id,
        project.title,
        user.displayName
      );

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error submitting application:', error);
      setError('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="animate-fade-in space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-4">Tell us about yourself</h3>
            <textarea
              rows={6}
              value={formData.coverLetter}
              onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
              placeholder="Write a brief introduction and why you're interested in this project..."
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.coverLetter.trim()}
                className="w-full sm:w-auto inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Next Step
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="animate-fade-in space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-4">Additional Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Profile
                </label>
                <input
                  type="url"
                  value={formData.githubProfile}
                  onChange={(e) => setFormData({ ...formData, githubProfile: e.target.value })}
                  placeholder="https://github.com/yourusername"
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Availability
                </label>
                <input
                  type="text"
                  value={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                  placeholder="e.g., 20 hours per week"
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commitment Level
                </label>
                <select
                  value={formData.commitment}
                  onChange={(e) => setFormData({ ...formData, commitment: e.target.value })}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            </div>
            
            <div className="pt-2 flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full sm:w-auto inline-flex justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || !formData.availability}
                className="w-full sm:w-auto inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-0">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-semibold pr-4">{project.title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            {project.title}
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            {project.description}
          </p>
        </div>

        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center w-full sm:w-2/3 max-w-xs">
              <div className={`flex-1 h-1 ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step === 1 ? 'border-blue-600 bg-blue-600 text-white' : 
                step > 1 ? 'border-blue-600 bg-white text-blue-600' : 'border-gray-200 bg-white text-gray-400'
              }`}>
                {step > 1 ? '✓' : '1'}
              </div>
              <div className={`flex-1 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step === 2 ? 'border-blue-600 bg-blue-600 text-white' : 
                step > 2 ? 'border-blue-600 bg-white text-blue-600' : 'border-gray-200 bg-white text-gray-400'
              }`}>
                2
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-3 py-2 sm:px-4 sm:py-3 rounded-md text-sm sm:text-base">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {renderStep()}
        </form>
      </div>
    </div>
  );
};

export default ProjectApplicationForm;