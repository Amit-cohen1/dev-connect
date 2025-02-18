// src/pages/Projects.js
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import ProjectApplicationForm from '../components/ProjectApplications';
import ProjectSkeleton from '../components/ProjectSkeleton';

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
  const [filterChangeLoading, setFilterChangeLoading] = useState(false);

  const technologies = [
    // Frontend Frameworks & Libraries
    'React', 'Angular', 'Vue', 'Svelte', 'Next.js', 'Nuxt.js', 'Gatsby',
    'React Native', 'Flutter', 'Ionic', 'Electron',
    
    // Backend Technologies
    'Node.js', 'Python', 'Java', 'C#', '.NET', 'PHP', 'Ruby', 'Go', 'Rust',
    'Spring Boot', 'Django', 'Flask', 'Laravel', 'Express.js', 'NestJS',
    
    // Cloud & Infrastructure
    'AWS', 'Azure', 'Firebase', 'Google Cloud', 'Heroku', 'DigitalOcean',
    'Docker', 'Kubernetes', 'Terraform', 'Jenkins',
    
    // Databases
    'MongoDB', 'PostgreSQL', 'MySQL', 'SQL Server', 'Redis', 'Cassandra',
    'GraphQL', 'DynamoDB', 'SQLite',
    
    // Mobile Development
    'iOS', 'Android', 'Kotlin', 'Swift', 'Xamarin',
    
    // Frontend Technologies
    'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Sass', 'Tailwind CSS',
    'Bootstrap', 'Material UI', 'Redux', 'WebPack',
    
    // Testing & Quality
    'Jest', 'Cypress', 'Selenium', 'JUnit', 'PyTest',
    
    // AI & ML
    'Machine Learning', 'AI', 'TensorFlow', 'PyTorch', 'OpenAI',
    
    // Version Control & DevOps
    'Git', 'GitHub Actions', 'GitLab CI', 'Jira', 'Agile'
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

  const handleSearch = async (e) => {
    e.preventDefault();
    setFilterChangeLoading(true);
    await fetchProjects();
    setFilterChangeLoading(false);
  };

  const handleFilterChange = async (name, value) => {
    setFilterChangeLoading(true);
    setFilters(prev => ({ ...prev, [name]: value }));
    await fetchProjects();
    setFilterChangeLoading(false);
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Header Section */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4 animate-fade-in">Find Your Next Project</h1>
          <p className="text-blue-100 text-lg max-w-3xl animate-slide-up">
            Browse through our curated collection of impactful projects and find the perfect opportunity to make a difference.
          </p>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="max-w-7xl mx-auto -mt-8 px-4 sm:px-6 lg:px-8 mb-12">
        <div className="bg-white rounded-xl shadow-xl p-6 transition-all duration-300 hover:shadow-2xl border border-gray-100">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Search Input with Animation */}
              <div className="col-span-1 md:col-span-2 lg:col-span-4">
                <div className="relative group">
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-3 text-lg rounded-lg border-2 border-gray-200 
                             focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200
                             bg-gray-50 group-hover:bg-white"
                    placeholder="Search projects by title, description, or technology..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors duration-200">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Enhanced Filter Selects */}
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-700 mb-2">Technology</label>
                <select
                  className="w-full py-2.5 pl-4 pr-10 rounded-lg border-2 border-gray-200 
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                           bg-gray-50 group-hover:bg-white transition-all duration-200
                           appearance-none cursor-pointer"
                  value={filters.technology}
                  onChange={(e) => handleFilterChange('technology', e.target.value)}
                >
                  <option value="">All Technologies</option>
                  {technologies.map((tech) => (
                    <option key={tech} value={tech}>{tech}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-[2.4rem] pointer-events-none text-gray-400 group-hover:text-blue-500 transition-colors duration-200">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="relative group">
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                <select
                  className="w-full py-2.5 pl-4 pr-10 rounded-lg border-2 border-gray-200 
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                           bg-gray-50 group-hover:bg-white transition-all duration-200
                           appearance-none cursor-pointer"
                  value={filters.difficulty}
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                >
                  <option value="">All Levels</option>
                  {difficulties.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-[2.4rem] pointer-events-none text-gray-400 group-hover:text-blue-500 transition-colors duration-200">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="relative group">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  className="w-full py-2.5 pl-4 pr-10 rounded-lg border-2 border-gray-200 
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                           bg-gray-50 group-hover:bg-white transition-all duration-200
                           appearance-none cursor-pointer"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <div className="absolute right-3 top-[2.4rem] pointer-events-none text-gray-400 group-hover:text-blue-500 transition-colors duration-200">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => setFilters({ search: '', technology: '', difficulty: '', status: 'open' })}
                className="inline-flex items-center justify-center px-6 py-2.5 border-2 border-gray-300 
                         text-gray-700 font-medium rounded-lg hover:bg-gray-50 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 
                         transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Filters
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 
                         text-white font-medium rounded-lg hover:bg-blue-700 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                         transition-all duration-200 transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Apply Filters
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className={`transition-opacity duration-300 ${filterChangeLoading ? 'opacity-50' : 'opacity-100'}`}>
        {/* Projects Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ProjectSkeleton key={i} />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg mx-auto border border-gray-100">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Projects Found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your search filters or check back later for new projects.</p>
                <button
                  onClick={() => setFilters({ search: '', technology: '', difficulty: '', status: 'open' })}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base 
                           font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                           transition-all duration-200 transform hover:scale-105"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
              {projects.map((project) => (
                <div 
                  key={project.id} 
                  className="group bg-white rounded-xl shadow-md overflow-hidden cursor-pointer 
                           transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 
                           border border-gray-100"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 
                                  transition-colors duration-200 line-clamp-2">
                        {project.title}
                      </h3>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full flex items-center ${
                        project.status === 'open' 
                          ? 'bg-green-100 text-green-800'
                          : project.status === 'in-progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${
                          project.status === 'open'
                            ? 'bg-green-500'
                            : project.status === 'in-progress'
                            ? 'bg-yellow-500'
                            : 'bg-gray-500'
                        }`}></span>
                        {project.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2 group-hover:text-gray-900 transition-colors duration-200">
                      {project.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.technologies?.slice(0, 3).map((tech, index) => (
                        <span
                          key={index}
                          className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium 
                                  group-hover:bg-blue-100 transition-colors duration-200"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.technologies?.length > 3 && (
                        <span className="bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-sm font-medium 
                                     group-hover:bg-gray-100 transition-colors duration-200">
                          +{project.technologies.length - 3} more
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center">
                        <svg className="h-5 w-5 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {project.timeEstimate}
                      </span>
                      <span className="flex items-center">
                        <svg className="h-5 w-5 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {project.maxDevelopers} devs needed
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center">
                        <div className="relative">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(project.organizationName)}&background=random`}
                            alt={project.organizationName}
                            className="h-10 w-10 rounded-full border-2 border-white group-hover:border-blue-200 transition-colors duration-200"
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-900">{project.organizationName}</span>
                      </div>
                      {renderApplicationButton(project)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Application Form Modal */}
      {showApplicationForm && selectedProject && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity animate-fade-in">
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg animate-scale-in">
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;