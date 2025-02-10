// src/pages/ProjectDetail.js
import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase/config';
import { 
  doc, getDoc, collection, query, where, getDocs,
  updateDoc, arrayUnion, deleteDoc, serverTimestamp,
  addDoc 
} from 'firebase/firestore';
import ProjectApplicationForm from '../components/ProjectApplications';
import ProjectComments from '../components/ProjectComments';
import { sendApplicationStatusNotification, sendNewApplicationNotification } from '../utils/notifications';

const ProjectDetail = () => {
  const { projectId } = useParams();
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

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        // Fetch project details
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (!projectDoc.exists()) {
          navigate('/projects');
          return;
        }

        const projectData = { id: projectDoc.id, ...projectDoc.data() };
        setProject(projectData);
        setEditedProject(projectData);

        // Check if user has already applied
        if (user) {
          const applicationQuery = query(
            collection(db, 'projectApplications'),
            where('projectId', '==', projectId),
            where('userId', '==', user.uid)
          );
          const applicationSnapshot = await getDocs(applicationQuery);
          setHasApplied(!applicationSnapshot.empty);
        }

        // Fetch applications if it's the organization's project
        if (projectData.organizationId === user?.uid) {
          const applicationsQuery = query(
            collection(db, 'projectApplications'),
            where('projectId', '==', projectId)
          );
          const applicationsSnapshot = await getDocs(applicationsQuery);
          
          const applicationsData = await Promise.all(
            applicationsSnapshot.docs.map(async (appDoc) => {
              const userData = await getDoc(doc(db, 'users', appDoc.data().userId));
              return {
                id: appDoc.id,
                ...appDoc.data(),
                user: userData.data()
              };
            })
          );

          setApplications(applicationsData);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching project data:', error);
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId, user, navigate]);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
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
            onClick={() => setActiveTab('details')}
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
              onClick={() => setActiveTab('applications')}
              className={`${
                activeTab === 'applications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Applications ({applications.length})
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
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
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
      </div>

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
  );
};

export default ProjectDetail;