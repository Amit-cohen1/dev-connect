import { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';

const UploadProject = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submitTriggered = useRef(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    technologies: [],
    difficulty: 'beginner',
    timeEstimate: '',
    maxDevelopers: 1,
    githubRequired: false,
    enrollmentType: 'direct'
  });

  const technologies = [
    'React', 'Angular', 'Vue', 'Node.js', 'Python',
    'Java', 'C#', '.NET', 'PHP', 'Ruby',
    'AWS', 'Azure', 'Firebase', 'MongoDB', 'SQL',
    'Docker', 'Kubernetes', 'Machine Learning', 'AI'
  ];

  const handleSubmit = useCallback(async (e) => {
    if (e) {
      e.preventDefault();
    }
  
    // Prevent multiple submissions
    if (loading) return;
  
    console.log('Submitting with formData:', formData); // Debug log
  
    setError('');
    setLoading(true);
  
    try {
      const projectData = {
        ...formData,
        organizationId: user.uid,
        organizationName: user.organizationName || user.displayName,
        status: 'open',
        applicants: [],
        assignedDevelopers: [],
        dateCreated: serverTimestamp(),
        dateUpdated: serverTimestamp()
      };
  
      console.log('Final projectData being sent to Firestore:', projectData); // Debug log
  
      await addDoc(collection(db, 'projects'), projectData);
      navigate('/organization-portal');
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [formData, user, navigate, loading]);

    useEffect(() => {
    const locationState = location.state;
    console.log('UploadProject received state:', locationState);
  
    if (locationState?.formData) {
      console.log('Setting form data:', locationState.formData);
      setFormData(locationState.formData);
    
      // Create a second useEffect to handle auto-submit after formData is set
      if (locationState.autoSubmit && !submitTriggered.current) {
        submitTriggered.current = true;
      }
    }
  }, [location]); // Remove handleSubmit dependency

  // Separate useEffect for handling the auto-submit
  useEffect(() => {
    const locationState = location.state;
    if (locationState?.autoSubmit && submitTriggered.current && formData.title) {
      console.log('Auto-submitting with formData:', formData);
      handleSubmit();
    }
  }, [formData, handleSubmit]); // This will run when formData actually changes

  const handleTechnologyChange = (tech) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.includes(tech)
        ? prev.technologies.filter(t => t !== tech)
        : [...prev.technologies, tech]
    }));
  };

  // Rest of the JSX remains exactly the same...
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload New Project</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Project Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Project Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Technologies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Technologies Required
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {technologies.map((tech) => (
                <label key={tech} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.technologies.includes(tech)}
                    onChange={() => handleTechnologyChange(tech)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2">{tech}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Difficulty Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Difficulty Level
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Time Estimate */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Estimated Time to Complete
            </label>
            <input
              type="text"
              required
              value={formData.timeEstimate}
              onChange={(e) => setFormData({ ...formData, timeEstimate: e.target.value })}
              placeholder="e.g., 2-3 weeks"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Max Developers */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Maximum Number of Developers
            </label>
            <input
              type="number"
              min="1"
              required
              value={formData.maxDevelopers}
              onChange={(e) => setFormData({ ...formData, maxDevelopers: parseInt(e.target.value) })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Enrollment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Enrollment Type
            </label>
            <select
              value={formData.enrollmentType}
              onChange={(e) => setFormData({ ...formData, enrollmentType: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="direct">Direct Enrollment</option>
              <option value="application">Application Required</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Project Requirements
            </label>
            <textarea
              rows={4}
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="List any prerequisites or specific requirements for developers..."
            />
          </div>

          {/* GitHub Required Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.githubRequired}
              onChange={(e) => setFormData({ ...formData, githubRequired: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="ml-2 block text-sm text-gray-900">
              GitHub account required for this project
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating Project...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadProject;