// src/components/ProjectApplicationForm.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { sendNewApplicationNotification } from '../utils/notifications';
import { Player } from '@lottiefiles/react-lottie-player';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import LoadingSpinner from './LoadingSpinner';

const ProjectApplicationForm = ({ project, onClose, onSubmitSuccess }) => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    coverLetter: '',
    githubProfile: '',
    portfolio: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: 'loading', message: 'Submitting your application...' });

    try {
      const now = new Date().toISOString();
      const applicationData = {
        projectId: project.id,
        projectTitle: project.title,
        userId: user.uid,
        userName: user.displayName,
        userAvatar: user.photoURL,
        coverLetter: formData.coverLetter,
        githubProfile: formData.githubProfile,
        portfolio: formData.portfolio,
        dateApplied: serverTimestamp()
      };

      // Handle different enrollment types
      if (project.enrollmentType === 'direct') {
        applicationData.status = 'accepted';
      } else if (project.enrollmentType === 'hybrid') {
        // For hybrid enrollment, check if there are still direct spots available
        const currentDevelopers = project.assignedDevelopers?.length || 0;
        const directSpots = Math.floor(project.maxDevelopers / 2); // Half of spots for direct enrollment
        
        if (currentDevelopers < directSpots) {
          applicationData.status = 'accepted';
        } else {
          applicationData.status = 'pending';
        }
      } else {
        applicationData.status = 'pending';
      }

      const applicationRef = await addDoc(collection(db, 'projectApplications'), applicationData);

      // If application is accepted (direct or hybrid with available spots)
      if (applicationData.status === 'accepted') {
        await updateDoc(doc(db, 'projects', project.id), {
          assignedDevelopers: arrayUnion({
            userId: user.uid,
            userName: user.displayName,
            assignedDate: now
          })
        });
      }

      // Send notification
      await sendNewApplicationNotification(
        project.organizationId,
        project.id,
        project.title,
        user.displayName
      );

      setSubmitStatus({
        type: 'success',
        message: applicationData.status === 'accepted' 
          ? 'Successfully joined the project!' 
          : 'Application submitted successfully!'
      });
      
      setTimeout(() => {
        onSubmitSuccess();
      }, 2000);

    } catch (error) {
      console.error('Error submitting application:', error);
      setSubmitStatus({
        type: 'error',
        message: 'There was an error submitting your application. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center animate-fadeIn">
      <div className="relative mx-auto p-8 w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl transform transition-all duration-300 ease-in-out">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-full"
            aria-label="Close application form"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {project.enrollmentType === 'direct' ? 'Join Project' : 'Project Application'}
              </h2>
              <p className="text-gray-600 mb-4">{project.title}</p>
              {project.enrollmentType === 'direct' && (
                <div className="inline-flex items-center bg-green-50 px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="ml-2 text-sm font-medium text-green-700">Open Enrollment</span>
                </div>
              )}
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
              <div className="relative">
                <div className="absolute top-5 w-full">
                  <div className="h-1 bg-gray-200 rounded-full">
                    <div 
                      className="h-1 bg-blue-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${((formStep - 1) / 1) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="relative flex justify-between">
                  {[1, 2].map((step) => (
                    <div key={step} className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                        formStep >= step 
                          ? 'bg-blue-500 text-white scale-110' 
                          : 'bg-white text-gray-400 border-2 border-gray-200'
                      }`}>
                        {formStep > step ? (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className="text-lg">{step}</span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-500">
                        {step === 1 ? 'About You' : 'Profile Links'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {submitStatus.type && (
              <div className={`mb-6 p-4 rounded-lg animate-fadeIn ${
                submitStatus.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-100' 
                  : submitStatus.type === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-100'
                  : 'bg-blue-50 text-blue-800 border border-blue-100'
              }`}>
                <p className="flex items-center">
                  {submitStatus.type === 'loading' && (
                    <LoadingSpinner size={24} className="mr-3" />
                  )}
                  {submitStatus.message}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {formStep === 1 && (
                <div className="space-y-6 animate-slideIn">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cover Letter {project.enrollmentType !== 'direct' && <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative">
                      <textarea
                        required={project.enrollmentType !== 'direct'}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-h-[200px] resize-none"
                        placeholder="Share your experience and why you're interested in this project..."
                        value={formData.coverLetter}
                        onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                      />
                      <div className="absolute bottom-3 right-3 text-sm text-gray-400">
                        {formData.coverLetter.length}/500
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setFormStep(2)}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:shadow-lg"
                    >
                      Next Step
                      <svg className="ml-2 -mr-1 w-4 h-4 animate-bounceX" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-6 animate-slideIn">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GitHub Profile {project.githubRequired && <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/>
                        </svg>
                      </div>
                      <input
                        type="url"
                        required={project.githubRequired}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="https://github.com/yourusername"
                        value={formData.githubProfile}
                        onChange={(e) => setFormData({ ...formData, githubProfile: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Portfolio URL
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <input
                        type="url"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="https://yourportfolio.com"
                        value={formData.portfolio}
                        onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => setFormStep(1)}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                    >
                      <svg className="mr-2 -ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <LoadingSpinner size={24} className="mr-2" />
                          Processing...
                        </span>
                      ) : (
                        project.enrollmentType === 'direct' ? 'Join Project' : 'Submit Application'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectApplicationForm;