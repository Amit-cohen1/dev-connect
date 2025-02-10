// src/pages/Projects.js
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import ProjectApplicationForm from '../components/ProjectApplications';

const Projects = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [userApplications, setUserApplications] = useState({});
  const [loading, setLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    technology: '',
    difficulty: '',
    status: 'open'
  });

  const technologies = [
    'React', 'Angular', 'Vue', 'Node.js', 'Python',
    'Java', 'C#', '.NET', 'PHP', 'Ruby',
    'AWS', 'Azure', 'Firebase', 'MongoDB', 'SQL',
    'Docker', 'Kubernetes', 'Machine Learning', 'AI'
  ];

  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

  // Fetch projects based on filters
  const fetchProjects = async () => {
    setLoading(true);
    try {
      let projectsQuery = query(
        collection(db, 'projects'),
        where('status', '==', filters.status),
        orderBy('dateCreated', 'desc')
      );

      const snapshot = await getDocs(projectsQuery);
      let projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply client-side filters
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        projectsData = projectsData.filter(project =>
          project.title.toLowerCase().includes(searchLower) ||
          project.description.toLowerCase().includes(searchLower)
        );
      }

      if (filters.technology) {
        projectsData = projectsData.filter(project =>
          project.technologies?.includes(filters.technology)
        );
      }

      if (filters.difficulty) {
        projectsData = projectsData.filter(project =>
          project.difficulty === filters.difficulty.toLowerCase()
        );
      }

      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's applications
  const fetchUserApplications = async () => {
    if (!user) return;

    try {
      const applicationsQuery = query(
        collection(db, 'projectApplications'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(applicationsQuery);
      const applications = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        applications[data.projectId] = data.status;
      });
      setUserApplications(applications);
    } catch (error) {
      console.error('Error fetching user applications:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchProjects();
  }, [filters.status]);

  // Fetch user applications when user is logged in
  useEffect(() => {
    fetchUserApplications();
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProjects();
  };

  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  const handleApplyClick = (e, project) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedProject(project);
    setShowApplicationForm(true);
  };

  const getApplicationStatus = (projectId) => {
    return userApplications[projectId] || null;
  };

  const renderApplicationButton = (project) => {
    if (!user) {
      return (
        <button
          onClick={(e) => handleApplyClick(e, project)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
        >
          Sign in to Apply
        </button>
      );
    }

    if (project.organizationId === user.uid) {
      return (
        <button
          className="bg-gray-100 text-gray-600 px-4 py-2 rounded-md cursor-not-allowed"
          disabled
        >
          Your Project
        </button>
      );
    }

    const applicationStatus = getApplicationStatus(project.id);
    
    if (applicationStatus) {
      const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        accepted: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800'
      };

      return (
        <span className={`px-4 py-2 rounded-md ${statusColors[applicationStatus]}`}>
          {applicationStatus.charAt(0).toUpperCase() + applicationStatus.slice(1)}
        </span>
      );
    }

    return (
      <button
        onClick={(e) => handleApplyClick(e, project)}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
      >
        Apply Now
      </button>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg mb-8 p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search
              </label>
              <input
                type="text"
                id="search"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Search projects..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="technology" className="block text-sm font-medium text-gray-700">
                Technology
              </label>
              <select
                id="technology"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={filters.technology}
                onChange={(e) => setFilters({ ...filters, technology: e.target.value })}
              >
                <option value="">All Technologies</option>
                {technologies.map((tech) => (
                  <option key={tech} value={tech}>{tech}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
                Difficulty
              </label>
              <select
                id="difficulty"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={filters.difficulty}
                onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
              >
                <option value="">All Levels</option>
                {difficulties.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No projects found</h3>
          <p className="mt-2 text-gray-500">Try adjusting your search filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div 
              key={project.id} 
              className="bg-white rounded-lg shadow overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1"
              onClick={() => handleProjectClick(project.id)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {project.title}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    project.status === 'open' 
                      ? 'bg-green-100 text-green-800'
                      : project.status === 'in-progress'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status}
                  </span>
                </div>
                
                <p className="mt-2 text-gray-500 line-clamp-3">
                  {project.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {project.technologies?.map((tech, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-600 px-2 py-1 rounded-md text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <div>
                    <span>🕒 {project.timeEstimate}</span>
                    <span className="mx-2">•</span>
                    <span className="capitalize">{project.difficulty} Level</span>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {project.organizationName}
                  </span>
                  {renderApplicationButton(project)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Application Form Modal */}
      {showApplicationForm && selectedProject && (
        <ProjectApplicationForm
          project={selectedProject}
          onClose={() => {
            setShowApplicationForm(false);
            setSelectedProject(null);
          }}
          onSubmitSuccess={() => {
            setShowApplicationForm(false);
            setSelectedProject(null);
            fetchUserApplications();
          }}
        />
      )}
    </div>
  );
};

export default Projects;