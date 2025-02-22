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
    portfolio: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();

      // Create application document in projectApplications collection
      const applicationDoc = await addDoc(collection(db, 'projectApplications'), {
        projectId: project.id,
        projectTitle: project.title, // Add project title to application
        userId: user.uid,
        userName: user.displayName,
        userAvatar: user.photoURL,
        coverLetter: formData.coverLetter,
        githubProfile: formData.githubProfile,
        portfolio: formData.portfolio,
        status: 'pending',
        dateApplied: serverTimestamp()
      });

      // Send notification to organization
      await sendNewApplicationNotification(
        project.organizationId,
        project.id,
        project.title,
        user.displayName
      );

      onSubmitSuccess();
    } catch (error) {
      console.error('Error submitting application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Apply for {project.title}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Cover Letter
                <textarea
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mt-1"
                  rows="4"
                  placeholder="Tell us why you're interested in this project..."
                  value={formData.coverLetter}
                  onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                />
              </label>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                GitHub Profile URL
                <input
                  type="url"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mt-1"
                  placeholder="https://github.com/yourusername"
                  value={formData.githubProfile}
                  onChange={(e) => setFormData({ ...formData, githubProfile: e.target.value })}
                />
              </label>
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Portfolio URL
                <input
                  type="url"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mt-1"
                  placeholder="https://yourportfolio.com"
                  value={formData.portfolio}
                  onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectApplicationForm;