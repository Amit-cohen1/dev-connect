// src/pages/Home.js
import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, orderBy, limit, getDocs, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import DeveloperSpotlight from '../components/DeveloperSpotlight';


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

  // State for Developer Spotlight
  const [spotlightUser, setSpotlightUser] = useState(null);
  const [spotlightLoading, setSpotlightLoading] = useState(true);
  const [spotlightError, setSpotlightError] = useState(null);

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
                Authorization: 'X71OYZXaackKssLkOZ4P6INink0716ZxjdejGgLzrhwAWMuRHHRvlPif' // Replace with your Pexels API Key
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

  const fetchSpotlightUser = async () => {
    setSpotlightLoading(true);
    setSpotlightError(null);
    try {
      const usersRef = collection(db, 'users');
      // Query for users with a non-empty 'projects' array.
      // Firestore doesn't directly support querying for non-empty arrays or array length.
      // A common workaround is to have a separate field like 'projectsCount' > 0.
      // Or, fetch users and filter client-side, but this can be inefficient for large datasets.
      // Given the constraint `where('projects', '!=', [])`, this might not work as expected
      // or might only filter out users where 'projects' field is explicitly `[]` but not `null` or missing.
      // A more robust query might be needed if this doesn't yield correct results.
      // For this task, I will use the suggested query, but note its potential limitations.
      // Fetch up to 10 eligible users
      const q = query(usersRef, where('projects', '!=', []), where('type', '==', 'developer'), limit(10));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Randomly select one user from the fetched list
        const randomIndex = Math.floor(Math.random() * snapshot.docs.length);
        const randomUserDoc = snapshot.docs[randomIndex];
        const userData = randomUserDoc.data();
        
        // Ensure all necessary fields for DeveloperSpotlight are present
        setSpotlightUser({
          id: randomUserDoc.id, // Include ID if needed for links or keys
          displayName: userData.displayName || "Anonymous Developer",
          photoURL: userData.photoURL, // Will use placeholder if null/undefined
          aboutMe: userData.aboutMe || "No bio available.",
          skills: userData.skills || [],
          technologies: userData.technologies || [],
          achievements: userData.achievements || []
        });
      } else {
        setSpotlightUser(null); // No user found that matches criteria
      }
    } catch (error) {
      console.error('Error fetching spotlight user:', error);
      setSpotlightError('Failed to load developer spotlight. Please try again later.');
    } finally {
      setSpotlightLoading(false);
    }
  };


  useEffect(() => {
    fetchFeaturedProjects();
    fetchStats();
    fetchSpotlightUser();
  }, []);

  const renderActionButton = () => {
    // Enhanced styling for action buttons: Secondary button style
    const commonButtonStyles = "group relative inline-flex items-center justify-center px-8 py-3 sm:px-10 sm:py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg overflow-hidden transition-all duration-300 ease-out hover:bg-blue-50 hover:scale-105 transform shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300 border border-blue-600";

    if (!user) {
      return (
        <Link
          to="/register"
          className={commonButtonStyles}
        >
          Get Started
        </Link>
      );
    }

    if (user.type === 'organization') {
      return (
        <Link
          to="/upload-project"
          className={commonButtonStyles}
        >
          Upload Project
        </Link>
      );
    }

    return (
      <Link
        to="/profile"
        className={commonButtonStyles}
      >
        View Profile
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Static Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80" // Placeholder image: developers collaborating
            alt="Developers collaborating on a project"
            className="w-full h-full object-cover"
          />
          {/* Enhanced gradient overlay for better text visibility and modern feel */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/60 to-blue-100/30" />
        </div>

        {/* Content */}
        <div className="relative z-20 w-full">
          <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              {/* Enhanced Typography: Increased font size for larger screens, adjusted line height */}
              <h1 className="text-5xl font-extrabold text-gray-900 sm:text-6xl lg:text-7xl leading-tight sm:leading-tight lg:leading-tight drop-shadow-sm animate-fade-in-down">
                Empowering Developers,<br/>
                <span className="text-blue-700">Supporting Non-Profits</span>
              </h1>
              {/* Enhanced Typography: Increased font size and line height for better readability */}
              <p className="mt-8 text-xl sm:text-2xl text-gray-700 leading-relaxed sm:leading-relaxed max-w-3xl mx-auto animate-fade-in-up font-medium">
                Connect with meaningful projects, gain real-world experience, and make a difference
                while building your portfolio. Join our community of passionate developers.
              </p>
              {/* Adjusted gap for different screen sizes and updated CTA button styling */}
              <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 animate-fade-in">
                {/* Enhanced CTA Button Styling: Primary button */}
                <Link
                  to="/projects"
                  className="group relative inline-flex items-center justify-center px-8 py-3 sm:px-10 sm:py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg overflow-hidden transition-all duration-300 ease-out hover:bg-blue-700 hover:scale-105 transform shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
                >
                  <span className="relative">Browse Projects</span>
                </Link>
                {/* renderActionButton will use secondary button styles defined in the function */}
                {renderActionButton()}
              </div>
              
              {/* Stats with improved visibility */}
              <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-3 animate-fade-in-up">
                <div className="text-center p-4 rounded-lg bg-white/80 backdrop-blur-sm shadow-lg">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{stats.totalProjects}</div>
                  <div className="text-gray-800 font-medium">Total Projects</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-white/80 backdrop-blur-sm shadow-lg">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{stats.completedProjects}</div>
                  <div className="text-gray-800 font-medium">Completed Projects</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-white/80 backdrop-blur-sm shadow-lg">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{stats.activeDevs}</div>
                  <div className="text-gray-800 font-medium">Active Developers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Developer Spotlight Section */}
      <div className="py-20 bg-gray-50"> {/* Using bg-gray-50 for a subtle differentiation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              <span role="img" aria-label="star" className="mr-2">🌟</span> Developer Spotlight
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Highlighting amazing developers from our community who are making a difference.
            </p>
          </div>
          {spotlightLoading && (
            <p className="text-center text-gray-600 text-lg">Loading Developer Spotlight...</p>
          )}
          {spotlightError && (
            <div className="text-center text-red-600 bg-red-100 p-4 rounded-lg max-w-md mx-auto">
              <p className="font-semibold">Oops! Something went wrong.</p>
              <p>{spotlightError}</p>
            </div>
          )}
          {spotlightUser && !spotlightLoading && !spotlightError && (
            <div className="max-w-3xl mx-auto"> {/* Max width for the spotlight card itself */}
              <DeveloperSpotlight user={spotlightUser} />
            </div>
          )}
          {!spotlightUser && !spotlightLoading && !spotlightError && (
            <p className="text-center text-gray-600 text-lg">
              No developer to spotlight at the moment. Check back soon!
            </p>
          )}
        </div>
      </div>

      {/* Featured Projects Section */}
      {/* Consistent spacing py-20, heading styling already good */}
      <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Featured Projects</h2>
            <p className="mt-3 text-lg text-gray-600">Explore our hand-picked selection of impactful projects</p>
          </div>
          <Link
            to="/projects"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold group transition-colors duration-300"
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
              // Modernized card: increased border radius, adjusted shadow, enhanced hover effect
              className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl flex flex-col"
            >
              <div className="relative">
                <img
                  src={project.imageUrl || project.logoUrl || '/placeholder.jpg'}
                  alt={`${project.organizationName || 'Organization'} - ${project.title}`}
                  className="h-56 w-full object-cover" // Increased image height
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex justify-between items-center text-white">
                    <h3 className="text-xl font-bold">{project.title}</h3> {/* Increased font size and weight */}
                    <div className="flex items-center space-x-1 bg-yellow-500/95 px-3 py-1 rounded-full text-sm shadow"> {/* Enhanced rating badge */}
                      <span className="text-yellow-100">⭐</span>
                      <span className="font-semibold text-white">{project.rating || '4.5'}</span>
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
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                      +{project.technologies.length - 3} more
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center text-sm text-gray-700 mb-6 mt-auto"> {/* Added mt-auto to push to bottom */}
                  <span className="flex items-center">
                    <svg className="h-5 w-5 mr-1.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {project.timeEstimate || 'N/A'}
                  </span>
                  <span className="flex items-center">
                    <svg className="h-5 w-5 mr-1.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {project.maxDevelopers || 'N/A'} Devs
                  </span>
                </div>
                {/* Updated "View Details" button to match primary CTA style */}
                <Link
                  to={`/project/${project.id}`}
                  className="block w-full text-center px-6 py-3 bg-blue-600 text-white text-base font-semibold rounded-lg overflow-hidden transition-all duration-300 ease-out hover:bg-blue-700 hover:scale-105 transform shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials Section */}
      {/* Consistent spacing py-20, updated heading and subheading styles */}
      <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8 bg-gray-100"> {/* Slightly different bg for section variety */}
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4 sm:text-4xl">Success Stories</h2>
        <p className="text-center text-lg text-gray-600 mb-16 max-w-2xl mx-auto">
          Hear from developers and organizations who use DeveloperSpace to make a difference.
        </p>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:gap-12">
          {/* Modernized Testimonial Card 1 */}
          <div className="bg-white rounded-xl shadow-xl p-8 flex flex-col items-start transform transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl">
            <img
              src="https://ui-avatars.com/api/?name=Alex+Rivera&background=4F46E5&color=fff&size=128&font-size=0.33&bold=true" // Example of a more customized UI Avatar
              alt="Alex Rivera"
              className="w-20 h-20 rounded-full mr-6 mb-4 shadow-md" // Slightly larger avatar with shadow
            />
            <blockquote className="italic text-gray-700 text-lg mb-6 leading-relaxed">
              "DeveloperSpace helped me transition from a junior role to a full stack position. 
              The projects I worked on here became the portfolio that landed me my dream job."
            </blockquote>
            <div className="mt-auto"> {/* Pushes attribution to the bottom */}
              <div className="font-semibold text-xl text-gray-900">Alex Rivera</div>
              <div className="text-gray-600">Full Stack Developer</div>
              <div className="text-blue-600 text-sm font-medium mt-1">Previously: Junior Developer</div>
            </div>
          </div>

          {/* Modernized Testimonial Card 2 */}
          <div className="bg-white rounded-xl shadow-xl p-8 flex flex-col items-start transform transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl">
            <img
              src="https://ui-avatars.com/api/?name=Sarah+Chen&background=0D9488&color=fff&size=128&font-size=0.33&bold=true" // Example of a more customized UI Avatar
              alt="Sarah Chen"
              className="w-20 h-20 rounded-full mr-6 mb-4 shadow-md" // Slightly larger avatar with shadow
            />
            <blockquote className="italic text-gray-700 text-lg mb-6 leading-relaxed">
              "As a self-taught developer, finding real-world projects was challenging. 
              This platform connected me with meaningful projects that accelerated my career growth."
            </blockquote>
            <div className="mt-auto"> {/* Pushes attribution to the bottom */}
              <div className="font-semibold text-xl text-gray-900">Sarah Chen</div>
              <div className="text-gray-600">Tech Lead</div>
              <div className="text-blue-600 text-sm font-medium mt-1">Started as: Self-taught Developer</div>
            </div>
          </div>
        </div>
      </div>

      {/* In-Demand Technologies Section */}
      {/* Consistent spacing py-20, updated heading and subheading, changed background to bg-white for card pop */}
      <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4 sm:text-4xl">In-Demand Technologies</h2>
        <p className="text-center text-lg text-gray-600 mb-16 max-w-2xl mx-auto">
          Stay ahead with the most sought-after skills in the industry, based on projects on our platform.
        </p>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {technologies.map((tech, index) => (
            <div
              key={index}
              // Modernized card: increased border radius, adjusted shadow, subtle hover lift for the card
              className="bg-gray-50 rounded-xl shadow-lg p-6 flex flex-col transform transition-all duration-300 hover:scale-[1.03] hover:shadow-xl"
              onMouseEnter={() => setHoveredTech(tech.name)}
              onMouseLeave={() => setHoveredTech(null)}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <span className="text-xl font-semibold text-gray-800 flex items-center">
                  <span className="text-blue-600 text-3xl mr-3 p-2 bg-blue-100 rounded-lg">&lt;/&gt;</span> {/* Icon style improved */}
                  {tech.name}
                </span>
                <span className="text-lg font-bold text-blue-600">{tech.percentage}%</span>
              </div>
              <div className="w-full bg-gray-300 h-5 rounded-full mt-auto overflow-hidden shadow-inner"> {/* Progress bar slightly thicker and with inner shadow */}
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-700 h-full rounded-full transition-all duration-700 ease-out" // Gradient for progress bar
                  style={{
                    width: hoveredTech === tech.name ? `${tech.percentage}%` : "0%", // Keep hover effect for bar
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Organization Testimonials Section */}
      {/* Consistent spacing py-20, updated heading and subheading, bg-gray-50 for slight differentiation */}
      <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4 sm:text-4xl">Trusted by Organizations</h2>
        <p className="text-center text-lg text-gray-600 mb-16 max-w-3xl mx-auto">
          See how non-profits and community-focused organizations are achieving their goals and amplifying their impact through our platform.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 pt-8"> {/* Added pt-8 to give space for icons */}
          {/* Modernized Org Testimonial Card 1 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 relative flex flex-col transform transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl">
            <div className="absolute -top-7 left-1/2 -translate-x-1/2"> {/* Centered icon */}
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <blockquote className="mt-10"> {/* Increased mt to account for icon */}
              <p className="text-lg text-gray-700 italic leading-relaxed">
                "The developers we connected with through this platform helped us modernize our entire digital infrastructure. The impact has been tremendous."
              </p>
            </blockquote>
            <div className="mt-auto pt-6"> {/* Added pt-6 for spacing */}
              <p className="text-gray-900 font-semibold text-xl">Environmental Action Network</p>
              <p className="text-sm text-blue-600 font-medium">Non-profit Organization</p>
            </div>
          </div>

          {/* Modernized Org Testimonial Card 2 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 relative flex flex-col transform transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl">
            <div className="absolute -top-7 left-1/2 -translate-x-1/2"> {/* Centered icon */}
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <blockquote className="mt-10"> {/* Increased mt to account for icon */}
              <p className="text-lg text-gray-700 italic leading-relaxed">
                "Finding skilled developers who are passionate about education was challenging until we discovered this platform. Now we're making learning accessible to everyone."
              </p>
            </blockquote>
            <div className="mt-auto pt-6"> {/* Added pt-6 for spacing */}
              <p className="text-gray-900 font-semibold text-xl">Global Education Initiative</p>
              <p className="text-sm text-teal-600 font-medium">Educational Non-profit</p>
            </div>
          </div>

          {/* Modernized Org Testimonial Card 3 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 relative flex flex-col transform transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl">
            <div className="absolute -top-7 left-1/2 -translate-x-1/2"> {/* Centered icon */}
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
            <blockquote className="mt-10"> {/* Increased mt to account for icon */}
              <p className="text-lg text-gray-700 italic leading-relaxed">
                "The dedication and skill of the developers we've worked with has enabled us to help more people in need. Technology truly can change lives."
              </p>
            </blockquote>
            <div className="mt-auto pt-6"> {/* Added pt-6 for spacing */}
              <p className="text-gray-900 font-semibold text-xl">Community Health Alliance</p>
              <p className="text-sm text-pink-600 font-medium">Healthcare Non-profit</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
