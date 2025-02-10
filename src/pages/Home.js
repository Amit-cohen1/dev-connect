// src/pages/Home.js
import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, orderBy, limit, getDocs, where, doc, getDoc } from 'firebase/firestore';
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

  const [technologies, setTechnologies] = useState([
    { name: "React", percentage: 95 },
    { name: "TypeScript", percentage: 88 },
    { name: "Node.js", percentage: 85 },
    { name: "Python", percentage: 82 },
    { name: "AWS", percentage: 78 },
    { name: "Docker", percentage: 75 },
  ]);

  const [hoveredTech, setHoveredTech] = useState(null);

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
        const project = { id: docSnap.id, ...docSnap.data() };

        // Fetch a relevant image from Pexels API based on project title and description
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
        project.logoUrl = imageUrl;

        projects.push(project);
      }

      setFeaturedProjects(projects);
    } catch (error) {
      console.error('Error fetching featured projects:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const projectsSnapshot = await getDocs(collection(db, 'projects'));
      const projects = projectsSnapshot.docs.map(doc => doc.data());

      const totalProjects = projects.length;
      const completedProjects = projects.filter(project => project.status === 'completed').length;

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const activeDevs = usersSnapshot.docs.filter(doc => doc.data().type === 'developer').length;

      setStats({
        totalProjects,
        completedProjects,
        activeDevs,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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
        className="bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/HeroBackground.jpg')",
        }}
      >
        <div className="bg-blue-600/70">
          <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
                Empowering Developers, Supporting Non-Profits
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-blue-100">
                Connect with meaningful projects, gain real-world experience, and make a difference
                while building your portfolio.
              </p>
              <div className="mt-10 flex justify-center gap-4">
                <Link
                  to="/projects"
                  className="bg-white text-blue-600 px-8 py-3 rounded-md font-medium hover:bg-blue-50"
                >
                  Browse Projects
                </Link>
                {renderActionButton()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.totalProjects}</div>
              <div className="mt-2 text-sm font-medium text-gray-500">Total Projects</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.completedProjects}</div>
              <div className="mt-2 text-sm font-medium text-gray-500">Completed Projects</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.activeDevs}</div>
              <div className="mt-2 text-sm font-medium text-gray-500">Active Developers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Projects Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Featured Projects</h2>
          <Link
            to="/projects"
            className="text-blue-500 hover:text-blue-400 font-medium"
          >
            View All Projects →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <img
                src={project.logoUrl || '/placeholder.jpg'} // Dynamically fetched logoUrl
                alt={`${project.organizationName || 'Organization'} Logo`}
                className="h-48 w-full object-contain bg-gray-100"
              />
              <div className="p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                  <div className="flex items-center space-x-1 text-yellow-500 text-sm">
                    <span>⭐</span>
                    <span>{project.rating || '4.5'}</span>
                  </div>
                </div>
                <p className="mt-2 text-gray-600 line-clamp-2">{project.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.technologies?.map((tech, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex justify-between text-sm text-gray-600">
                  <span>📅 {project.timeEstimate || '3 months'}</span>
                  <span>👨‍💻 {project.maxDevelopers || '5 developers'}</span>
                </div>
                <Link
                  to={`/project/${project.id}`}
                  className="mt-4 block bg-blue-500 text-white text-center py-2 rounded-md font-medium hover:bg-blue-600"
                >
                  View Details →
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
    </div>
  );
};

export default Home;
