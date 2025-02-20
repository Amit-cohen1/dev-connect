// src/pages/ProjectDetail.js
import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase/config';
import { 
  doc, getDoc, collection, query, where, getDocs,
  updateDoc, arrayUnion, deleteDoc, serverTimestamp,
  addDoc, orderBy
} from 'firebase/firestore';
import ProjectApplicationForm from '../components/ProjectApplications';
import ProjectComments from '../components/ProjectComments';
import { sendApplicationStatusNotification, sendNewApplicationNotification } from '../utils/notifications';
import ProjectSubmission from '../components/ProjectSubmission';
import ProjectReview from '../components/ProjectReview';
import axios from 'axios';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isUserEnrolled, setIsUserEnrolled] = useState(false);
  const [userApplicationStatus, setUserApplicationStatus] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!projectId) return;

      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);

        if (projectSnap.exists()) {
          const projectData = { id: projectSnap.id, ...projectSnap.data() };

          // Only fetch image if project doesn't already have a stored imageUrl
          if (!projectData.imageUrl) {
            try {
              const response = await axios.get('https://api.pexels.com/v1/search', {
                headers: {
                  Authorization: 'X71OYZXaackKssLkOZ4P6INink0716ZxjdejGgLzrhwAWMuRHHRvlPif'
                },
                params: {
                  query: `${projectData.title} ${projectData.description}`,
                  per_page: 1,
                  page: Math.floor(Math.random() * 100) + 1
                }
              });

              const imageUrl = response.data.photos[0]?.src?.large || '/placeholder.jpg';
              
              // Store the imageUrl in the project document
              await updateDoc(projectRef, {
                imageUrl: imageUrl
              });
              
              projectData.imageUrl = imageUrl;
            } catch (error) {
              console.error('Error fetching image:', error);
              projectData.imageUrl = '/placeholder.jpg';
            }
          }

          setProject(projectData);
          setEditedProject(projectData);

          // Fetch applications if user is the project owner
          if (user?.uid === projectData.organizationId) {
            const applicationsRef = collection(db, 'applications');
            const q = query(applicationsRef, where('projectId', '==', projectId));
            const applicationsSnap = await getDocs(q);
            setApplications(applicationsSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })));
          }

          // Check if user has applied
          if (user) {
            const applicationsRef = collection(db, 'applications');
            const q = query(
              applicationsRef,
              where('projectId', '==', projectId),
              where('userId', '==', user.uid)
            );
            const userApplicationSnap = await getDocs(q);
            if (!userApplicationSnap.empty) {
              setHasApplied(true);
              setUserApplicationStatus(userApplicationSnap.docs[0].data().status);
            }
          }

          // Check if user is enrolled
          if (user && projectData.assignedDevelopers) {
            setIsUserEnrolled(projectData.assignedDevelopers.includes(user.uid));
          }
        } else {
          navigate('/projects');
        }
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId, user, navigate, searchParams]);

  useEffect(() => {
    // Handle hash navigation for comments
    if (window.location.hash === '#comments') {
      setTimeout(() => {
        const commentsSection = document.getElementById('comments-section');
        if (commentsSection) {
          commentsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500); // Small delay to ensure content is loaded
    }
  }, []);

  const handleUpdateProject = async () => {
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        ...editedProject,
        dateUpdated: serverTimestamp()
      });
      setProject(editedProject);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleApplicationUpdate = async (applicationId, status) => {
    try {
      const application = applications.find(app => app.id === applicationId);
      
      await updateDoc(doc(db, 'projectApplications', applicationId), {
        status,
        updatedAt: serverTimestamp()
      });

      // Send notification to applicant
      await sendApplicationStatusNotification(
        application.userId,
        projectId,
        project.title,
        status
      );

      // If accepted, add developer to project
      if (status === 'accepted') {
        await updateDoc(doc(db, 'projects', projectId), {
          assignedDevelopers: arrayUnion({
            userId: application.userId,
            assignedDate: serverTimestamp()
          })
        });
      }

      // Refresh applications
      const updatedApplications = applications.map(app =>
        app.id === applicationId ? { ...app, status } : app
      );
      setApplications(updatedApplications);
    } catch (error) {
      console.error('Error updating application:', error);
    }
  };

  const handleDeleteProject = async () => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteDoc(doc(db, 'projects', projectId));
        navigate('/organization-portal');
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const renderProjectComments = () => {
    if (!user) return null;

    // Show comments if user is the project owner, enrolled, or has an accepted application
    const isUserApproved = applications.some(app => 
      app.userId === user.uid && app.status === 'accepted'
    );
    
    if (isUserApproved || isUserEnrolled || project.organizationId === user.uid) {
      return (
        <div id="comments-section">
          <ProjectComments 
            projectId={projectId} 
            organizationId={project.organizationId}
          />
        </div>
      );
    }
    return null;
  };

  const formatSubmissionDate = (submission) => {
    if (!submission.timestamp) return new Date().toLocaleString();
    
    // Handle Firestore timestamp
    if (submission.timestamp.toDate && typeof submission.timestamp.toDate === 'function') {
      return submission.timestamp.toDate().toLocaleString();
    }
    
    // Handle our fallback timestamp
    if (submission.displayTimestamp) {
      return new Date(submission.displayTimestamp).toLocaleString();
    }
    
    return new Date().toLocaleString();
  };

  // Update URL when changing tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Update URL without causing a page reload
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', tab);
    navigate(`?${newSearchParams.toString()}`, { replace: true });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : project ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Hero Image Section */}
            <div className="relative h-96">
              <img
                src={project.imageUrl || '/placeholder.jpg'}
                alt={project.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-4">{project.title}</h1>
                    <div className="flex items-center space-x-4">
                      <span className="bg-blue-500/80 text-white px-4 py-1 rounded-full text-sm font-medium">
                        {project.status}
                      </span>
                      <span className="text-white/90">
                        Posted by {project.organizationName}
                      </span>
                    </div>
                  </div>
                  {user?.uid === project.organizationId && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Project
                      </button>
                      <button
                        onClick={handleDeleteProject}
                        className="bg-red-500/90 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Project
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Rest of the project details */}
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Project Header */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? (
                <input
                  type="text"
                  value={editedProject.title}
                  onChange={(e) => setEditedProject({
                    ...editedProject,
                    title: e.target.value
                  })}
                  className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              ) : (
                project.title
              )}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Created {new Date(project.dateCreated.toDate()).toLocaleDateString()}
            </p>
          </div>
          {project.organizationId === user?.uid ? (
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleUpdateProject}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedProject(project);
                    }}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Edit Project
                  </button>
                  <button
                    onClick={handleDeleteProject}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                  >
                    Delete Project
                  </button>
                </>
              )}
            </div>
          ) : (
            user && (
              <button
                onClick={() => setShowApplicationForm(true)}
                disabled={hasApplied}
                className={`${
                  hasApplied
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white px-4 py-2 rounded-md`}
              >
                {hasApplied ? 'Already Applied' : 'Apply Now'}
              </button>
            )
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm mb-6">
        <nav className="-mb-px flex space-x-8 px-4" aria-label="Tabs">
          <button
            onClick={() => handleTabChange('details')}
            className={`${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Project Details
          </button>
          
          {project.organizationId === user?.uid && (
            <button
              onClick={() => handleTabChange('applications')}
              className={`${
                activeTab === 'applications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Applications ({applications.length})
            </button>
          )}

          {(isUserEnrolled || userApplicationStatus === 'accepted' || project.organizationId === user?.uid) && (
            <button
              onClick={() => handleTabChange('submissions')}
              className={`${
                activeTab === 'submissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Submissions {submissions.length > 0 && `(${submissions.length})`}
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg">
        {activeTab === 'details' && (
          <div className="p-6">
            <div className="space-y-6">
              {/* Project Description */}
              <div>
                <h3 className="text-lg font-medium text-gray-900">Description</h3>
                {isEditing ? (
                  <textarea
                    value={editedProject.description}
                    onChange={(e) => setEditedProject({
                      ...editedProject,
                      description: e.target.value
                    })}
                    rows={4}
                    className="mt-2 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-2 text-gray-500">{project.description}</p>
                )}
              </div>

              {/* Technologies */}
              <div>
                <h3 className="text-lg font-medium text-gray-900">Technologies</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(isEditing ? editedProject : project).technologies?.map((tech, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Project Requirements */}
              <div>
                <h3 className="text-lg font-medium text-gray-900">Requirements</h3>
                {isEditing ? (
                  <textarea
                    value={editedProject.requirements}
                    onChange={(e) => setEditedProject({
                      ...editedProject,
                      requirements: e.target.value
                    })}
                    rows={4}
                    className="mt-2 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-2 text-gray-500">{project.requirements}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="divide-y divide-gray-200">
            {applications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No applications received yet
              </div>
            ) : (
              applications.map((application) => (
                <div key={application.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-4">
                      <img
                        src={application.user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                        alt={application.userName}
                        className="h-12 w-12 rounded-full cursor-pointer hover:opacity-80"
                        onClick={() => navigate(`/user/${application.userId}`)}
                      />
                      <div>
                        <h3 
                          className="text-lg font-medium text-gray-900 hover:text-blue-600 cursor-pointer"
                          onClick={() => navigate(`/user/${application.userId}`)}
                        >
                          {application.userName}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Applied: {new Date(application.dateApplied.toDate()).toLocaleDateString()}
                        </p>
                        <p className="mt-2 text-gray-700">{application.coverLetter}</p>
                        <div className="mt-4 space-x-4">
                          {application.portfolio && (
                            <a
                              href={application.portfolio}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-500"
                            >
                              Portfolio ↗
                            </a>
                          )}
                          {application.githubProfile && (
                            <a
                              href={application.githubProfile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-500"
                            >
                              GitHub ↗
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        value={application.status}
                        onChange={(e) => handleApplicationUpdate(application.id, e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="accepted">Accept</option>
                        <option value="rejected">Reject</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="p-6 space-y-6">
            {/* Allow both enrolled and approved developers to submit */}
            {(isUserEnrolled || userApplicationStatus === 'accepted') && project.organizationId !== user?.uid && (
              <ProjectSubmission
                projectId={projectId}
                organizationId={project.organizationId}
                onSubmissionComplete={() => {
                  // Update submissions state with a properly formatted timestamp
                  const newSubmission = {
                    projectId,
                    developerId: user.uid,
                    developerName: user.displayName,
                    status: 'pending',
                    timestamp: {
                      toDate: () => new Date() // Create a timestamp-like object
                    }
                  };
                  setSubmissions(prevSubmissions => [newSubmission, ...prevSubmissions]);
                }}
              />
            )}

            {/* List of Submissions */}
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id || Date.now()} className="border rounded-lg p-4">
                  {project.organizationId === user?.uid ? (
                    <div className="space-y-4">
                      <div className="flex items-start space-x-4">
                        <img
                          src={submission.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                          alt={submission.developerName}
                          className="h-12 w-12 rounded-full cursor-pointer hover:opacity-80"
                          onClick={() => navigate(`/user/${submission.developerId}`)}
                        />
                        <div className="flex-grow">
                          <h3 
                            className="text-lg font-medium text-gray-900 hover:text-blue-600 cursor-pointer"
                            onClick={() => navigate(`/user/${submission.developerId}`)}
                          >
                            {submission.developerName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatSubmissionDate(submission)}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          submission.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : submission.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                        </span>
                      </div>
                      <ProjectReview
                        projectId={projectId}
                        submissionId={submission.id}
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            Submission from {submission.developerName}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {formatSubmissionDate(submission)}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          submission.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : submission.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                        </span>
                      </div>

                      <p className="text-gray-700">{submission.submissionText}</p>

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

                      {submission.feedback && (
                        <div className={`mt-4 p-4 rounded-md ${
                          submission.status === 'approved'
                            ? 'bg-green-50'
                            : 'bg-red-50'
                        }`}>
                          <h5 className="font-medium text-gray-900">Feedback</h5>
                          <p className="mt-1 text-gray-700">{submission.feedback}</p>
                          <p className="mt-2 text-sm text-gray-500">
                            {submission.feedbackTimestamp?.toDate().toLocaleString()} by {submission.reviewerName}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {submissions.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No submissions yet
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Comments Section */}
      {renderProjectComments()}

      {/* Application Form Modal */}
      {showApplicationForm && (
        <ProjectApplicationForm
          project={project}
          onClose={() => setShowApplicationForm(false)}
          onSubmitSuccess={() => {
            setShowApplicationForm(false);
            setHasApplied(true);
          }}
        />
      )}
    </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center min-h-screen">
          <p className="text-gray-600">Project not found</p>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;