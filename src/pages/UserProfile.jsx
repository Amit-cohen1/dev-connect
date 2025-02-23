import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import LoadingSpinner from '../components/LoadingSpinner';

const UserProfile = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [completedProjects, setCompletedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  let unsubscribe; // Declare unsubscribe outside fetchUserData

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get real-time updates for user data including completedProjects
        const userDocRef = doc(db, 'users', userId);
        unsubscribe = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            setUser({
              id: doc.id,
              displayName: userData.displayName,
              email: userData.email,
              photoURL: userData.photoURL,
              aboutMe: userData.aboutMe || '',
              skills: userData.skills || [],
              githubProfile: userData.githubProfile,
              portfolio: userData.portfolio
            });
            
            // Set completed projects with real-time updates
            setCompletedProjects(userData.completedProjects || []);
          }
        });

        // Fetch user's projects
        const [ownedProjects, participatingProjects] = await Promise.all([
          // Fetch owned projects
          getDocs(query(
            collection(db, 'projects'),
            where('organizationId', '==', userId)
          )),
          // Fetch projects where user is a participant
          getDocs(query(
            collection(db, 'projects'),
            where('assignedDevelopers', 'array-contains', { userId })
          ))
        ]);

        const ownedProjectsData = ownedProjects.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          role: 'owner'
        }));

        const participatingProjectsData = participatingProjects.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          role: 'participant'
        }));

        setProjects([...ownedProjectsData, ...participatingProjectsData]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };

    fetchUserData();
    // Clean up subscription on unmount
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [userId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
          <p className="mt-2 text-gray-600">The user you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* User Profile Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start space-y-6 md:space-y-0 md:space-x-6">
          {/* Avatar and Basic Info */}
          <div className="flex-shrink-0">
            <img
              src={user.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
              alt={user.displayName}
              className="h-32 w-32 rounded-full border-4 border-white shadow-lg"
            />
          </div>
          <div className="flex-grow">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.displayName}</h1>
            <p className="text-gray-600 mb-4">{user.email}</p>
            
            {/* About Me Section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">About Me</h2>
              {user.aboutMe ? ( // Changed from bio to aboutMe
                <p className="text-gray-700 whitespace-pre-wrap">{user.aboutMe}</p>
              ) : (
                <p className="text-gray-500 italic">No about me available</p>
              )}
            </div>
            
            {/* Skills Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Skills</h2>
              {user.skills && user.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No skills listed</p>
              )}
            </div>
          </div>

          {/* Contact/Social Links if available */}
          <div className="flex-shrink-0 space-y-3">
            {user.githubProfile && (
              <a
                href={user.githubProfile}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
                </svg>
                <span>GitHub Profile</span>
              </a>
            )}
            {user.portfolio && (
              <a
                href={user.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Portfolio</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Completed Projects Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed Projects</h2>
        {completedProjects.length === 0 ? (
          <p className="text-gray-600">No completed projects yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedProjects.map((project) => (
              <div
                key={project.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {project.title}
                  </h3>
                  <span className="text-sm text-green-600 font-medium">
                    ✓ Completed
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {project.technologies?.map((tech, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Project Links */}
                <div className="flex flex-wrap gap-3 mb-4">
                  {project.githubLink && (
                    <a
                      href={project.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                    >
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
                      </svg>
                      Code Repository
                    </a>
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Live Demo
                    </a>
                  )}
                </div>

                {/* Reviewer Feedback */}
                {project.feedback && (
                  <div className="mt-3 p-3 bg-green-50 rounded-md">
                    <div className="flex items-start space-x-2">
                      <img
                        src={project.reviewerAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                        alt={project.reviewerName}
                        className="h-6 w-6 rounded-full"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{project.reviewerName}</p>
                        <p className="text-sm text-gray-700">{project.feedback}</p>
                      </div>
                    </div>
                  </div>
                )}

                <p className="mt-3 text-xs text-gray-500">
                  Completed: {project.completedDate ? 
                    (typeof project.completedDate === 'string' ? 
                      new Date(project.completedDate).toLocaleDateString() :
                      project.completedDate.toDate().toLocaleDateString()
                    ) : 'Date not available'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Projects Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Projects</h2>
        {projects.length === 0 ? (
          <p className="text-gray-600">No projects yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {project.title}
                  </h3>
                  <span className="text-sm text-gray-500 capitalize">
                    {project.role}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.technologies?.map((tech, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;