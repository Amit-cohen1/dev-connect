import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { sendNotification, sendSkillsUpdateNotification } from '../utils/notifications';
import { toast } from 'react-toastify';
import LoadingSpinner from './LoadingSpinner';

const ProjectReview = ({ projectId, submissionId, onReviewComplete }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const submissionDoc = await getDoc(doc(db, 'projectSubmissions', submissionId));
        if (submissionDoc.exists()) {
          setSubmission({ id: submissionDoc.id, ...submissionDoc.data() });
          setStatus(submissionDoc.data().status);
        }
      } catch (error) {
        console.error('Error fetching submission:', error);
      }
    };

    fetchSubmission();
  }, [submissionId]);

  const handleReview = async (newStatus) => {
    if (!feedback.trim()) return;

    setLoading(true);
    try {
      // Update submission with feedback
      await updateDoc(doc(db, 'projectSubmissions', submissionId), {
        status: newStatus,
        feedback: feedback.trim(),
        feedbackTimestamp: serverTimestamp(),
        reviewerId: user.uid,
        reviewerName: user.displayName
      });

      // Update project status
      await updateDoc(doc(db, 'projects', projectId), {
        status: newStatus === 'approved' ? 'completed' : 'in-progress'
      });

      // If project is approved, update user's profile
      if (newStatus === 'approved') {
        // Fetch project details to get technologies
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        const projectData = projectDoc.data();

        // Fetch user's current data
        const userDoc = await getDoc(doc(db, 'users', submission.developerId));
        const userData = userDoc.data();

        // Calculate new skills to be added
        const existingSkills = new Set(userData.skills || []);
        const newSkills = projectData.technologies.filter(tech => !existingSkills.has(tech));

        // Update user's profile with completed project and new skills
        await updateDoc(doc(db, 'users', submission.developerId), {
          completedProjects: arrayUnion({
            id: projectId,
            title: projectData.title,
            description: projectData.description,
            technologies: projectData.technologies,
            completedDate: new Date().toISOString(),
            role: 'developer',
            githubLink: submission.githubLink,
            liveUrl: submission.liveUrl,
            feedback: feedback.trim(),
            reviewerId: user.uid,
            reviewerName: user.displayName,
            reviewerAvatar: user.photoURL
          }),
          skills: Array.from(new Set([...existingSkills, ...projectData.technologies]))
        });

        // Notify user about new skills if any were added
        if (newSkills.length > 0) {
          await sendSkillsUpdateNotification(
            submission.developerId,
            projectData.title,
            newSkills
          );
        }
      }

      // Notify developer
      await sendNotification({
        userId: submission.developerId,
        type: 'submission_review',
        message: `Your project submission has been ${newStatus}`,
        projectId,
        submissionId,
        senderName: user.displayName
      });

      // Call onReviewComplete callback if provided
      if (onReviewComplete) {
        onReviewComplete();
      }

      // Show success message
      if (newStatus === 'approved') {
        toast.success('Project approved! Developer profile has been updated with completed project and new skills.');
      } else {
        toast.info('Changes requested. Developer has been notified.');
      }

      setStatus(newStatus);
    } catch (error) {
      console.error('Error reviewing submission:', error);
      toast.error('Failed to update project status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!submission) {
    return (
      <div className="flex justify-center items-center p-6">
        <LoadingSpinner size={80} />
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Review Project Submission</h3>
      
      {/* Submission Details */}
      <div className="mb-6 space-y-4">
        <div>
          <div className="flex items-start space-x-4 mb-4">
            <img
              src={submission?.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
              alt={submission?.developerName}
              className="h-12 w-12 rounded-full cursor-pointer hover:opacity-80"
              onClick={() => navigate(`/user/${submission?.developerId}`)}
            />
            <div>
              <h4 
                className="text-lg font-medium text-gray-900 hover:text-blue-600 cursor-pointer"
                onClick={() => navigate(`/user/${submission?.developerId}`)}
              >
                {submission?.developerName}
              </h4>
              <p className="text-sm text-gray-600">{submission?.submissionText}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <a
            href={submission.githubLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-500"
          >
            <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
            </svg>
            View Code Repository
          </a>
          {submission.liveUrl && (
            <a
              href={submission.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-500"
            >
              <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Live Demo
            </a>
          )}
        </div>
      </div>

      {/* Review Form */}
      {status === 'pending' ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700">
              Feedback
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide detailed feedback about the submission..."
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => handleReview('rejected')}
              disabled={loading || !feedback.trim()}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Request Changes
            </button>
            <button
              onClick={() => handleReview('approved')}
              disabled={loading || !feedback.trim()}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Approve Project
            </button>
          </div>
        </div>
      ) : (
        <div className={`p-4 rounded-md ${
          status === 'approved' 
            ? 'bg-green-50 text-green-800' 
            : 'bg-red-50 text-red-800'
        }`}>
          <h4 className="font-medium">
            {status === 'approved' ? 'Project Approved' : 'Changes Requested'}
          </h4>
          <p className="mt-2 text-sm">
            {submission.feedback}
          </p>
          <p className="mt-1 text-xs opacity-75">
            Reviewed by {submission.reviewerName} on{' '}
            {submission.feedbackTimestamp?.toDate ? 
              submission.feedbackTimestamp.toDate().toLocaleString() :
              new Date().toLocaleString()
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectReview;