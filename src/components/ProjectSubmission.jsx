import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  updateDoc,
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { sendNotification } from '../utils/notifications';

const ProjectSubmission = ({ projectId, organizationId, onSubmissionComplete }) => {
  const { user } = useContext(AuthContext);
  const [submissionText, setSubmissionText] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submissionText.trim() || !githubLink.trim()) return;

    setLoading(true);
    try {
      const now = new Date();
      // Create submission document with current timestamp
      const submissionData = {
        projectId,
        developerId: user.uid,
        developerName: user.displayName,
        submissionText,
        githubLink,
        liveUrl: liveUrl.trim() || null,
        status: 'pending',
        timestamp: serverTimestamp(),
        feedback: null,
        feedbackTimestamp: null
      };

      const submissionRef = await addDoc(collection(db, 'projectSubmissions'), submissionData);

      // Update project status
      await updateDoc(doc(db, 'projects', projectId), {
        status: 'pending-review',
        lastSubmissionId: submissionRef.id,
        lastSubmissionDate: serverTimestamp()
      });

      // Notify organization
      await sendNotification({
        userId: organizationId,
        type: 'project_submission',
        message: `${user.displayName} has submitted the project for review`,
        projectId,
        submissionId: submissionRef.id,
        senderName: user.displayName
      });

      setSubmissionText('');
      setGithubLink('');
      setLiveUrl('');
      
      // Pass the submission data with a temporary timestamp for immediate display
      const submissionWithTempTimestamp = {
        id: submissionRef.id,
        ...submissionData,
        timestamp: {
          toDate: () => now
        }
      };
      
      onSubmissionComplete(submissionWithTempTimestamp);
    } catch (error) {
      console.error('Error submitting project:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Project for Review</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="submissionText" className="block text-sm font-medium text-gray-700">
            Submission Details
          </label>
          <textarea
            id="submissionText"
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
            placeholder="Describe what you've completed, any challenges faced, and important notes for review..."
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="githubLink" className="block text-sm font-medium text-gray-700">
            GitHub Repository URL
          </label>
          <input
            type="url"
            id="githubLink"
            value={githubLink}
            onChange={(e) => setGithubLink(e.target.value)}
            placeholder="https://github.com/username/repository"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="liveUrl" className="block text-sm font-medium text-gray-700">
            Live Demo URL (optional)
          </label>
          <input
            type="url"
            id="liveUrl"
            value={liveUrl}
            onChange={(e) => setLiveUrl(e.target.value)}
            placeholder="https://your-demo-site.com"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !submissionText.trim() || !githubLink.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Project'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectSubmission;