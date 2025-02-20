// src/pages/Home.js
import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, orderBy, limit, getDocs, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const Home = () => {
  const { user } = useContext(AuthContext);
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    activeDevs: 0,
  });

  const [technologies, setTechnologies] = useState([]);
  const [hoveredTech, setHoveredTech] = useState(null);

  const calculateTechnologyStats = (projects) => {
    // Create a map to store technology counts
    const techCount = {};
    let totalProjects = projects.length;
  
    // Count occurrences of each technology
    projects.forEach(project => {
      if (project.technologies && Array.isArray(project.technologies)) {
        project.technologies.forEach(tech => {
          techCount[tech] = (techCount[tech] || 0) + 1;
        });
      }
    });
  
    // Convert to array of objects with percentages
    const techArray = Object.entries(techCount)
      .map(([name, count]) => ({
        name,
        percentage: Math.round((count / totalProjects) * 100)
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 6); // Get top 6 technologies
  
    return techArray;
  };

  const fetchFeaturedProjects = async () => {
    try {
      const projectsQuery = query(
        collection(db, 'projects'),
        where('status', '==', 'open'),
        orderBy('dateCreated', 'desc'),
        limit(3)
      );

      const projectsSnapshot = await getDocs(projectsQuery);
      const projects = [];

      for (const docSnap of projectsSnapshot.docs) {
        const projectRef = doc(db, 'projects', docSnap.id);
        const project = { id: docSnap.id, ...docSnap.data() };

        // Only fetch image if project doesn't already have a stored imageUrl
        if (!project.imageUrl) {
          try {
            const response = await axios.get('https://api.pexels.com/v1/search', {
              headers: {
                Authorization: 'X71OYZXaackKssLkOZ4P6INink0716ZxjdejGgLzrhwAWMuRHHRvlPif'
              },
              params: {
                query: `${project.title} ${project.description}`,
                per_page: 1,
                page: Math.floor(Math.random() * 100) + 1
              }
            });

            const imageUrl = response.data.photos[0]?.src?.medium || '/placeholder.jpg';
            
            // Store the imageUrl in the project document
            await updateDoc(projectRef, {
              imageUrl: imageUrl
            });
            
            project.imageUrl = imageUrl;
          } catch (error) {
            console.error('Error fetching image:', error);
            project.imageUrl = '/placeholder.jpg';
          }
        }

        projects.push(project);
      }

      setFeaturedProjects(projects);
    } catch (error) {
      console.error('Error fetching featured projects:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Get all projects from the database
      const projectsSnapshot = await getDocs(collection(db, 'projects'));
      const projects = projectsSnapshot.docs.map(doc => doc.data());

      const totalProjects = projects.length;
      const completedProjects = projects.filter(project => project.status === 'completed').length;

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const activeDevs = usersSnapshot.docs.filter(doc => doc.data().type === 'developer').length;

      // Calculate comprehensive technology stats from all projects
      const techStats = calculateTechnologyStats(projects);
      
      // Sort by usage percentage and get top technologies
      const sortedTechStats = techStats.sort((a, b) => b.percentage - a.percentage);
      setTechnologies(sortedTechStats);

      setStats({
        totalProjects,
        completedProjects,
        activeDevs,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default empty values in case of error
      setTechnologies([]);
      setStats({
        totalProjects: 0,
        completedProjects: 0,
        activeDevs: 0,
      });
    }
  };

  useEffect(() => {
    fetchFeaturedProjects();
    fetchStats();
  }, []);

  const renderActionButton = () => {
    if (!user) {
      return (
        <Link
          to="/register"
          className="bg-blue-500 text-white px-8 py-3 rounded-md font-medium hover:bg-blue-400"
        >
          Get Started
        </Link>
      );
    }

    if (user.type === 'organization') {
      return (
        <Link
          to="/upload-project"
          className="bg-blue-500 text-white px-8 py-3 rounded-md font-medium hover:bg-blue-400"
        >
          Upload Project
        </Link>
      );
    }

    return (
      <Link
        to="/profile"
        className="bg-blue-500 text-white px-8 py-3 rounded-md font-medium hover:bg-blue-400"
      >
        View Profile
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div
        className="bg-cover bg-center bg-no-repeat bg-fixed relative"
        style={{
          backgroundImage: "url('/HeroBackground.jpg')",
          minHeight: "80vh",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/85 to-blue-600/80 backdrop-blur-sm"></div>
        <div className="relative">
          <div className="max-w-7xl mx-auto py-20 px-4 sm:py-32 sm:px-6 lg:px-8 flex flex-col items-center">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl drop-shadow-lg animate-fade-in-down">
                Empowering Developers,<br/>
                <span className="text-blue-200">Supporting Non-Profits</span>
              </h1>
              <p className="mt-8 text-xl text-blue-100 leading-relaxed max-w-3xl mx-auto animate-fade-in-up">
                Connect with meaningful projects, gain real-world experience, and make a difference
                while building your portfolio. Join our community of passionate developers.
              </p>
              <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4 animate-fade-in">
                <Link
                  to="/projects"
                  className="group relative inline-flex items-center justify-center px-8 py-3 bg-white text-blue-600 font-medium rounded-md overflow-hidden transition-all duration-300 ease-out hover:bg-blue-50 hover:scale-105 transform"
                >
                  <span className="relative">Browse Projects</span>
                </Link>
                {renderActionButton()}
              </div>
              <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-3 animate-fade-in-up">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">{stats.totalProjects}</div>
                  <div className="text-blue-200">Total Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">{stats.completedProjects}</div>
                  <div className="text-blue-200">Completed Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">{stats.activeDevs}</div>
                  <div className="text-blue-200">Active Developers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Projects Section */}
      <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Featured Projects</h2>
            <p className="mt-2 text-gray-600">Explore our hand-picked selection of impactful projects</p>
          </div>
          <Link
            to="/projects"
            className="inline-flex items-center text-blue-600 hover:text-blue-500 font-medium group"
          >
            View All Projects
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <div className="relative">
                <img
                  src={project.imageUrl || project.logoUrl || '/placeholder.jpg'}
                  alt={`${project.organizationName || 'Organization'} Logo`}
                  className="h-48 w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex justify-between items-center text-white">
                    <h3 className="text-lg font-semibold">{project.title}</h3>
                    <div className="flex items-center space-x-1 bg-yellow-400/90 px-2 py-1 rounded-full">
                      <span>⭐</span>
                      <span className="font-medium">{project.rating || '4.5'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 line-clamp-2 mb-4">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies?.slice(0, 3).map((tech, index) => (
                    <span
                      key={index}
                      className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.technologies?.length > 3 && (
                    <span className="bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                      +{project.technologies.length - 3} more
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                  <span className="flex items-center">
                    <svg className="h-5 w-5 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {project.timeEstimate || '3 months'}
                  </span>
                  <span className="flex items-center">
                    <svg className="h-5 w-5 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {project.maxDevelopers || '5'} devs
                  </span>
                </div>
                <Link
                  to={`/project/${project.id}`}
                  className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-300"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">Success Stories</h2>
        <p className="text-center text-gray-600 mb-12">
          Hear from developers and organizations who use DeveloperSpace to make a difference.
        </p>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="bg-white rounded-lg shadow-lg p-6 flex items-start">
            <img
              src="https://ui-avatars.com/api/?name=Alex+Rivera&background=random&color=fff"
              alt="Alex Rivera"
              className="w-16 h-16 rounded-full mr-4"
            />
            <div>
              <p className="italic text-gray-700 mb-4">
                "DeveloperSpace helped me transition from a junior role to a full stack position. 
                The projects I worked on here became the portfolio that landed me my dream job."
              </p>
              <div className="font-bold text-gray-900">Alex Rivera</div>
              <div className="text-gray-500">Full Stack Developer</div>
              <div className="text-blue-500 text-sm">Previously: Junior Developer</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 flex items-start">
            <img
              src="https://ui-avatars.com/api/?name=Sarah+Chen&background=random&color=fff"
              alt="Sarah Chen"
              className="w-16 h-16 rounded-full mr-4"
            />
            <div>
              <p className="italic text-gray-700 mb-4">
                "As a self-taught developer, finding real-world projects was challenging. 
                This platform connected me with meaningful projects that accelerated my career growth."
              </p>
              <div className="font-bold text-gray-900">Sarah Chen</div>
              <div className="text-gray-500">Tech Lead</div>
              <div className="text-blue-500 text-sm">Started as: Self-taught Developer</div>
            </div>
          </div>
        </div>
      </div>

      {/* In-Demand Technologies Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">In-Demand Technologies</h2>
        <p className="text-gray-600 text-center mb-10">
          Stay ahead with the most sought-after skills in the industry
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {technologies.map((tech, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center justify-center hover:shadow-xl transition-shadow duration-300"
              onMouseEnter={() => setHoveredTech(tech.name)}
              onMouseLeave={() => setHoveredTech(null)}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-blue-600 text-2xl">&lt;/&gt;</span> {tech.name}
                </span>
                <span className="text-gray-500 text-sm font-medium">{tech.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 h-4 rounded-full mt-4 overflow-hidden">
                <div
                  className="bg-blue-500 h-4 rounded-full transition-all duration-500 ease-in-out"
                  style={{
                    width: hoveredTech === tech.name ? `${tech.percentage}%` : "0%",
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Organization Testimonials Section */}
      <div className="max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Trusted by Organizations</h2>
        <p className="text-gray-600 text-center mb-16">
          See how non-profits and organizations are achieving their goals through our platform
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          <div className="bg-white rounded-xl shadow-lg p-8 relative">
            <div className="absolute -top-6 left-8">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <blockquote className="mt-8">
              <p className="text-lg text-gray-600 italic">
                "The developers we connected with through this platform helped us modernize our entire digital infrastructure. The impact has been tremendous."
              </p>
            </blockquote>
            <div className="mt-4">
              <p className="text-gray-900 font-semibold">Environmental Action Network</p>
              <p className="text-sm text-gray-500">Non-profit Organization</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 relative">
            <div className="absolute -top-6 left-8">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <blockquote className="mt-8">
              <p className="text-lg text-gray-600 italic">
                "Finding skilled developers who are passionate about education was challenging until we discovered this platform. Now we're making learning accessible to everyone."
              </p>
            </blockquote>
            <div className="mt-4">
              <p className="text-gray-900 font-semibold">Global Education Initiative</p>
              <p className="text-sm text-gray-500">Educational Non-profit</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 relative">
            <div className="absolute -top-6 left-8">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
            <blockquote className="mt-8">
              <p className="text-lg text-gray-600 italic">
                "The dedication and skill of the developers we've worked with has enabled us to help more people in need. Technology truly can change lives."
              </p>
            </blockquote>
            <div className="mt-4">
              <p className="text-gray-900 font-semibold">Community Health Alliance</p>
              <p className="text-sm text-gray-500">Healthcare Non-profit</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
