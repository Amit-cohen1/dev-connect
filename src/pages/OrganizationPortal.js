// src/pages/OrganizationPortal.js
import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
  arrayUnion  
} from 'firebase/firestore';
import { sendApplicationStatusNotification } from '../utils/notifications';

const ProjectCard = ({ project }) => {
  const statusColors = {
    'open': 'bg-green-100 text-green-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-blue-100 text-blue-800'
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[project.status]}`}>
            {project.status}
          </span>
        </div>
        <p className="mt-2 text-gray-600 line-clamp-2">{project.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {project.technologies?.map((tech, index) => (
            <span
              key={index}
              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
            >
              {tech}
            </span>
          ))}
        </div>
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            <span>Applicants: {project.applicants?.length || 0}</span>
          </div>
          <Link
            to={`/project/${project.id}`}
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Manage →
          </Link>
        </div>
      </div>
    </div>
  );
};

const ApplicationCard = ({ application, onUpdateStatus }) => {
  const statusColors = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'accepted': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {application.userName}
          </h3>
          <p className="text-sm text-gray-500">
            Applied for: {application.projectTitle}
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
        
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[application.status]}`}>
            {application.status}
          </span>
          <select
            value={application.status}
            onChange={(e) => onUpdateStatus(application.id, e.target.value)}
            className="mt-2 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="accepted">Accept</option>
            <option value="rejected">Reject</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const OrganizationPortal = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalApplicants: 0,
    completedProjects: 0
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch projects
        const projectsQuery = query(
          collection(db, 'projects'),
          where('organizationId', '==', user.uid),
          orderBy('dateCreated', 'desc')
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjects(projectsData);

        // Fetch applications from projectApplications collection
        const applicationsQuery = query(
          collection(db, 'projectApplications'),
          where('organizationId', '==', user.uid),
          orderBy('dateApplied', 'desc')
        );
        const applicationsSnapshot = await getDocs(applicationsQuery);
        const applicationsData = applicationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setApplications(applicationsData);

        // Calculate statistics
        setStats({
          totalProjects: projectsData.length,
          activeProjects: projectsData.filter(p => p.status === 'in-progress').length,
          totalApplicants: applicationsData.length,
          completedProjects: projectsData.filter(p => p.status === 'completed').length
        });

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleApplicationStatus = async (applicationId, newStatus) => {
    try {
      const application = applications.find(app => app.id === applicationId);
      
      // Update application status
      await updateDoc(doc(db, 'projectApplications', applicationId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Send notification to applicant
      await sendApplicationStatusNotification(
        application.userId,
        application.projectId,
        application.projectTitle,
        newStatus
      );

      // If accepted, update project's assigned developers
      if (newStatus === 'accepted') {
        await updateDoc(doc(db, 'projects', application.projectId), {
          assignedDevelopers: arrayUnion({
            userId: application.userId,
            assignedDate: serverTimestamp()
          })
        });
      }

      // Update local state
      setApplications(applications.map(app =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
    } catch (error) {
      console.error('Error updating application status:', error);
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Organization Portal</h1>
        <Link
          to="/upload-project"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Upload New Project
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-blue-500 p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Projects</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalProjects}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-green-500 p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Projects</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.activeProjects}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-yellow-500 p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Applicants</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalApplicants}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-indigo-500 p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed Projects</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.completedProjects}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm mb-6">
        <nav className="-mb-px flex space-x-8 px-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`${
              activeTab === 'projects'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Projects
          </button>
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
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <>
            {/* Recent Projects */}
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Projects</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {projects.slice(0, 3).map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
              {projects.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900">No projects yet</h3>
                  <p className="mt-2 text-gray-500">
                    Get started by uploading your first project.
                  </p>
                </div>
              )}
            </div>

            {/* Recent Applications */}
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Applications</h2>
              <div className="space-y-4">
                {applications.slice(0, 3).map(application => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    onUpdateStatus={handleApplicationStatus}
                  />
                ))}
              </div>
              {applications.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900">No applications yet</h3>
                  <p className="mt-2 text-gray-500">
                    Applications will appear here when developers apply to your projects.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
            {projects.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">No projects yet</h3>
                <p className="mt-2 text-gray-500">
                  Get started by uploading your first project.
                </p>
                <Link
                  to="/upload-project"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Upload Project
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="space-y-4">
            {applications.map(application => (
              <ApplicationCard
                key={application.id}
                application={application}
                onUpdateStatus={handleApplicationStatus}
              />
            ))}
            {applications.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">No applications yet</h3>
                <p className="mt-2 text-gray-500">
                  Applications will appear here when developers apply to your projects.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationPortal;