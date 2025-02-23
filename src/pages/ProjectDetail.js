import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase/config';
import { 
  doc, getDoc, collection, query, where, getDocs,
  updateDoc, arrayUnion, deleteDoc, serverTimestamp, orderBy
} from 'firebase/firestore';
import ProjectApplicationForm from '../components/ProjectApplications';
import ProjectComments from '../components/ProjectComments';
import ProjectHeader from '../components/ProjectHeader';
import ProjectStats from '../components/ProjectStats';
import ProjectApplicationsList from '../components/ProjectApplicationsList';
import { sendApplicationStatusNotification } from '../utils/notifications';
import ProjectSubmission from '../components/ProjectSubmission';
import ProjectReview from '../components/ProjectReview';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

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
  const [userApplicationStatus, setUserApplicationStatus] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  // Add fetchSubmissions function
  const fetchSubmissions = async () => {
    try {
      const submissionsQuery = query(
        collection(db, 'projectSubmissions'),
        where('projectId', '==', projectId),
        orderBy('timestamp', 'desc')
      );
      const submissionsSnapshot = await getDocs(submissionsQuery);
      const submissionsData = submissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  // Derive these values instead of storing in state
  const hasApplied = Boolean(userApplicationStatus);
  const isUserEnrolled = project?.assignedDevelopers?.some(dev => dev.userId === user?.uid) || 
    (hasApplied && userApplicationStatus === 'accepted');

  const fetchApplications = async () => {
    try {
      const applicationsQuery = query(
        collection(db, 'projectApplications'),
        where('projectId', '==', projectId),
        orderBy('dateApplied', 'desc')
      );
      const applicationsSnapshot = await getDocs(applicationsQuery);
      const applicationsData = [];

      for (const doc of applicationsSnapshot.docs) {
        const applicationData = {
          id: doc.id,
          ...doc.data()
        };

        // Fetch user details if not already included
        if (!applicationData.userName || !applicationData.userAvatar) {
          const userDoc = await getDoc(doc(db, 'users', applicationData.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            applicationData.userAvatar = userData.photoURL || null;
            applicationData.userName = userData.displayName || 'Anonymous';
          }
        }
        applicationsData.push(applicationData);
      }
      
      setApplications(applicationsData);

      // Update user's application status if logged in
      if (user) {
        const userApplication = applicationsData.find(app => app.userId === user.uid);
        if (userApplication) {
          setUserApplicationStatus(userApplication.status);
        }
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!projectId) return;

      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);

        if (projectSnap.exists()) {
          const projectData = { id: projectSnap.id, ...projectSnap.data() };

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
              await updateDoc(projectRef, { imageUrl });
              projectData.imageUrl = imageUrl;
            } catch (error) {
              console.error('Error fetching image:', error);
              projectData.imageUrl = '/placeholder.jpg';
            }
          }

          setProject(projectData);
          setEditedProject(projectData);

          // Initial applications and submissions fetch
          await Promise.all([
            fetchApplications(),
            fetchSubmissions()
          ]);

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
  }, [projectId, user]);

  // Add effect to refresh applications when tab changes to applications
  useEffect(() => {
    if (activeTab === 'applications') {
      fetchApplications();
    }
  }, [activeTab]);

  // Add effect to refresh submissions when tab changes
  useEffect(() => {
    if (activeTab === 'submissions') {
      fetchSubmissions();
    }
  }, [activeTab]);

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
      
      // Update application status
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

      // If accepted, update project's assigned developers
      if (status === 'accepted') {
        const updatedAssignedDevelopers = [
          ...(project.assignedDevelopers || []),
          {
            userId: application.userId,
            userName: application.userName,
            assignedDate: new Date().toISOString()
          }
        ];

        await updateDoc(doc(db, 'projects', projectId), {
          assignedDevelopers: updatedAssignedDevelopers
        });

        // Update local project state immediately
        setProject(prevProject => ({
          ...prevProject,
          assignedDevelopers: updatedAssignedDevelopers
        }));
      }

      // Update local applications state
      setApplications(prevApplications => 
        prevApplications.map(app =>
          app.id === applicationId ? { ...app, status } : app
        )
      );

      // Update user's application status if it's their own application
      if (user && application.userId === user.uid) {
        setUserApplicationStatus(status);
      }

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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', tab);
    navigate(`?${newSearchParams.toString()}`, { replace: true });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Project not found</h2>
          <p className="mt-2 text-gray-600">The project you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <ProjectHeader
            project={project}
            user={user}
            isEditing={isEditing}
            editedProject={editedProject}
            setEditedProject={setEditedProject}
            onEdit={() => setIsEditing(true)}
            onDelete={handleDeleteProject}
            onApply={() => setShowApplicationForm(true)}
            hasApplied={hasApplied}
          />

          {/* Navigation Tabs */}
          <div className="bg-white border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => handleTabChange('details')}
                className={`${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
              >
                Project Details
              </button>
              
              {(user?.uid === project.organizationId || project.status === 'open') && (
                <button
                  onClick={() => handleTabChange('applications')}
                  className={`${
                    activeTab === 'applications'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center`}
                >
                  Applications
                  {applications.length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                      {applications.length}
                    </span>
                  )}
                </button>
              )}

              {(isUserEnrolled || user?.uid === project.organizationId || userApplicationStatus === 'accepted') && (
                <button
                  onClick={() => handleTabChange('submissions')}
                  className={`${
                    activeTab === 'submissions'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                >
                  Submissions
                </button>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-white">
            {activeTab === 'details' && (
              <div className="p-8">
                <div className="max-w-3xl space-y-8">
                  {/* Project Description */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">About this Project</h3>
                    {isEditing ? (
                      <textarea
                        value={editedProject.description}
                        onChange={(e) => setEditedProject({
                          ...editedProject,
                          description: e.target.value
                        })}
                        rows={4}
                        className="mt-4 block w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none transition-shadow duration-200"
                      />
                    ) : (
                      <p className="mt-4 text-gray-600 leading-relaxed">{project.description}</p>
                    )}
                  </div>

                  {/* Technologies */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Technologies Required</h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(isEditing ? editedProject : project).technologies?.map((tech, index) => (
                        <span
                          key={index}
                          className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Project Requirements */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Requirements</h3>
                    {isEditing ? (
                      <textarea
                        value={editedProject.requirements}
                        onChange={(e) => setEditedProject({
                          ...editedProject,
                          requirements: e.target.value
                        })}
                        rows={4}
                        className="mt-4 block w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none transition-shadow duration-200"
                      />
                    ) : (
                      <div className="mt-4 bg-gray-50 rounded-lg p-6">
                        <p className="text-gray-600 whitespace-pre-wrap">{project.requirements}</p>
                      </div>
                    )}
                  </div>

                  <ProjectStats 
                    applications={applications}
                    maxDevelopers={project.maxDevelopers}
                  />
                </div>
              </div>
            )}

            {activeTab === 'applications' && (
              <ProjectApplicationsList
                applications={applications}
                isOrganization={user?.uid === project.organizationId}
                onUpdateStatus={handleApplicationUpdate}
              />
            )}

            {activeTab === 'submissions' && (
              <div className="p-8 space-y-8">
                {(isUserEnrolled || userApplicationStatus === 'accepted') && 
                 project.organizationId !== user?.uid && 
                 project.status !== 'completed' && (
                  <ProjectSubmission
                    projectId={projectId}
                    organizationId={project.organizationId}
                    onSubmissionComplete={(newSubmission) => {
                      setSubmissions(prev => [newSubmission, ...prev]);
                    }}
                  />
                )}

                {/* List of Submissions */}
                <div className="space-y-6">
                  {submissions.map(submission => (
                    <div key={submission.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow duration-200">
                      {project.organizationId === user?.uid ? (
                        <ProjectReview 
                          projectId={projectId} 
                          submissionId={submission.id}
                          onReviewComplete={fetchSubmissions}
                        />
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={submission.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                alt={submission.developerName}
                                className="h-10 w-10 rounded-full"
                              />
                              <div>
                                <h4 className="font-medium text-gray-900">{submission.developerName}</h4>
                                <p className="text-sm text-gray-500">
                                  {submission.timestamp?.toDate?.() 
                                    ? submission.timestamp.toDate().toLocaleString() 
                                    : new Date(submission.timestamp).toLocaleString()}
                                </p>
                              </div>
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
                          <p className="text-gray-700 mb-4">{submission.submissionText}</p>
                          <div className="flex space-x-4">
                            <a 
                              href={submission.githubLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-500 flex items-center"
                            >
                              <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/>
                              </svg>
                              View Code
                            </a>
                            {submission.liveUrl && (
                              <a 
                                href={submission.liveUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-500 flex items-center"
                              >
                                <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                View Demo
                              </a>
                            )}
                          </div>
                          {submission.feedback && (
                            <div className={`mt-4 p-4 rounded-md ${
                              submission.status === 'approved' 
                                ? 'bg-green-50' 
                                : 'bg-red-50'
                            }`}>
                              <p className="text-sm font-medium mb-1">Feedback from reviewer:</p>
                              <p className="text-sm">{submission.feedback}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Comments Section */}
          {(isUserEnrolled || userApplicationStatus === 'accepted' || 
            project.organizationId === user?.uid) && (
            <div id="comments-section" className="bg-gray-50 border-t border-gray-100">
              <ProjectComments 
                projectId={projectId} 
                organizationId={project.organizationId}
              />
            </div>
          )}

          {/* Application Form Modal */}
          {showApplicationForm && (
            <ProjectApplicationForm
              project={project}
              onClose={() => setShowApplicationForm(false)}
              onSubmitSuccess={() => {
                setShowApplicationForm(false);
                fetchApplications(); // Refresh applications after successful submission
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;