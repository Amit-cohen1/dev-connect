// src/pages/Projects.js
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import ProjectApplicationForm from '../components/ProjectApplications';
import ProjectSkeleton from '../components/ProjectSkeleton';
import axios from 'axios';

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
    setFilterChangeLoading(true);
    try {
      let projectsQuery = collection(db, 'projects');
      const conditions = [];

      if (filters.status) {
        conditions.push(where('status', '==', filters.status));
      }

      if (filters.technology) {
        conditions.push(where('technologies', 'array-contains', filters.technology));
      }

      if (filters.difficulty) {
        conditions.push(where('difficulty', '==', filters.difficulty.toLowerCase()));
      }

      if (conditions.length > 0) {
        projectsQuery = query(projectsQuery, ...conditions);
      } else {
        projectsQuery = query(projectsQuery);
      }

      const projectsSnapshot = await getDocs(projectsQuery);
      const fetchedProjects = [];

      for (const docSnap of projectsSnapshot.docs) {
        const projectRef = doc(db, 'projects', docSnap.id);
        const project = { id: docSnap.id, ...docSnap.data() };

        // Filter by search term if present
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          if (
            !project.title.toLowerCase().includes(searchLower) &&
            !project.description.toLowerCase().includes(searchLower)
          ) {
            continue;
          }
        }

        fetchedProjects.push(project);
      }

      setProjects(fetchedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setFilterChangeLoading(false);
      setLoading(false);
    }
  };

  // Fetch user's applications
  const fetchUserApplications = async () => {
    if (!user) return;

    try {
      const applicationsRef = collection(db, 'applications');
      const q = query(applicationsRef, where('userId', '==', user.uid));
      const applicationsSnapshot = await getDocs(q);
      
      const applications = {};
      applicationsSnapshot.docs.forEach(doc => {
        applications[doc.data().projectId] = doc.data().status;
      });
      
      setUserApplications(applications);
    } catch (error) {
      console.error('Error fetching user applications:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchProjects();
  }, [filters]);

  // Fetch user applications when user is logged in
  useEffect(() => {
    if (user) {
      fetchUserApplications();
    }
  }, [user]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleFilterChange = async (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  const handleApplyClick = (e, project) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: `/project/${project.id}` } });
      return;
    }
    navigate(`/project/${project.id}`);
  };

  const getApplicationStatus = (projectId) => {
    return userApplications[projectId];
  };

  const renderApplicationButton = (project) => {
    const status = getApplicationStatus(project.id);
    
    if (status) {
      return (
        <button
          disabled
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md"
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </button>
      );
    }

    return (
      <button
        onClick={(e) => handleApplyClick(e, project)}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
      >
        Apply Now
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Filters Section */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search Input */}
          <div>
            <input
              type="text"
              placeholder="Search projects..."
              value={filters.search}
              onChange={handleSearch}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Technology Filter */}
          <div>
            <select
              value={filters.technology}
              onChange={(e) => handleFilterChange('technology', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Technologies</option>
              {technologies.map((tech) => (
                <option key={tech} value={tech}>
                  {tech}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <select
              value={filters.difficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Difficulties</option>
              {difficulties.map((level) => (
                <option key={level} value={level.toLowerCase()}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="open">Open Projects</option>
              <option value="completed">Completed Projects</option>
              <option value="in-progress">In Progress</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          /* Projects Grid */
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
              >
                <div className="aspect-w-16 aspect-h-9 relative overflow-hidden">
                  <img
                    src={project.imageUrl || '/placeholder.jpg'}
                    alt={project.title}
                    className="object-cover w-full h-48 transform hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">
                      {project.title}
                    </h3>
                    <p className="text-white/90 text-sm line-clamp-2">
                      {project.organizationName}
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.technologies?.slice(0, 3).map((tech, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.technologies?.length > 3 && (
                      <span className="text-gray-500 text-xs">
                        +{project.technologies.length - 3} more
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {project.maxDevelopers} developer{project.maxDevelopers !== 1 ? 's' : ''}
                    </div>
                    {renderApplicationButton(project)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && projects.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">No projects found</h3>
            <p className="mt-2 text-gray-500">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;