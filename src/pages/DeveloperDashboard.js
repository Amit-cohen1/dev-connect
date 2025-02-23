import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import LoadingSpinner from '../components/LoadingSpinner';

const DeveloperDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeProjects, setActiveProjects] = useState([]);
  const [projectFeedback, setProjectFeedback] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch projects where the user is assigned
        const projectsQuery = query(
          collection(db, 'projects'),
          where('assignedDevelopers', 'array-contains', { userId: user.uid }),
          where('status', '==', 'in-progress')
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setActiveProjects(projectsData);

        // Fetch project submissions and feedback
        const submissionsQuery = query(
          collection(db, 'projectSubmissions'),
          where('developerId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        const feedbackData = submissionsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(submission => submission.feedback);
        setProjectFeedback(feedbackData);

        // Calculate upcoming deadlines
        const today = new Date();
        const deadlines = projectsData
          .filter(project => project.deadline)
          .map(project => ({
            ...project,
            daysRemaining: Math.ceil(
              (project.deadline.toDate() - today) / (1000 * 60 * 60 * 24)
            )
          }))
          .filter(project => project.daysRemaining > 0)
          .sort((a, b) => a.daysRemaining - b.daysRemaining);
        setUpcomingDeadlines(deadlines);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          Welcome back, {user?.displayName}!
        </h1>
        <p className="text-blue-100">
          Here's an overview of your ongoing projects and recent activities.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Active Projects</h2>
            <Link
              to="/projects"
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              Browse More Projects →
            </Link>
          </div>
          {activeProjects.length === 0 ? (
            <p className="text-gray-500">No active projects at the moment.</p>
          ) : (
            <div className="space-y-4">
              {activeProjects.map((project) => (
                <div
                  key={project.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-gray-900">{project.title}</h3>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      In Progress
                    </span>
                  </div>
                  <p className="mt-2 text-gray-600 text-sm line-clamp-2">{project.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {project.technologies?.slice(0, 3).map((tech, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
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

        {/* Upcoming Deadlines Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Deadlines</h2>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-gray-500">No upcoming deadlines.</p>
          ) : (
            <div className="space-y-4">
              {upcomingDeadlines.map((project) => (
                <div
                  key={project.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-gray-900">{project.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      project.daysRemaining <= 3
                        ? 'bg-red-100 text-red-800'
                        : project.daysRemaining <= 7
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {project.daysRemaining} days left
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            100 - (project.daysRemaining / 30) * 100
                          )}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Feedback Section */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Feedback</h2>
          {projectFeedback.length === 0 ? (
            <p className="text-gray-500">No feedback received yet.</p>
          ) : (
            <div className="space-y-4">
              {projectFeedback.map((submission) => (
                <div
                  key={submission.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start space-x-4">
                    <img
                      src={submission.reviewerAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                      alt={submission.reviewerName}
                      className="h-10 w-10 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {submission.projectTitle}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Reviewed by {submission.reviewerName}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          submission.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                        </span>
                      </div>
                      <p className="mt-2 text-gray-600">{submission.feedback}</p>
                      <p className="mt-2 text-sm text-gray-500">
                        {submission.feedbackTimestamp?.toDate().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperDashboard;