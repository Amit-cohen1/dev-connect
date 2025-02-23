import { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import LoadingSpinner from '../components/LoadingSpinner';

const UploadProject = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submitTriggered = useRef(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showTechHelp, setShowTechHelp] = useState(false);

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

  // Group technologies by category for better organization
  const techCategories = {
    'Frontend': [
      'HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue',
      'Tailwind CSS', 'Bootstrap', 'Material UI'
    ],
    'Backend': [
      'Node.js', 'Python', 'Java', 'PHP', 'Ruby', 'C#', '.NET',
      'Express.js', 'Django', 'Spring Boot'
    ],
    'Database': [
      'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Firebase',
      'Redis', 'GraphQL'
    ],
    'Mobile': [
      'React Native', 'Flutter', 'iOS', 'Android', 'Kotlin', 'Swift'
    ],
    'Cloud': [
      'AWS', 'Azure', 'Google Cloud', 'Firebase', 'Heroku'
    ],
    'Other': [
      'Git', 'Docker', 'Machine Learning', 'AI', 'DevOps'
    ]
  };

  const difficultyDescriptions = {
    beginner: "Suitable for developers with basic programming knowledge. No complex architectures.",
    intermediate: "Requires good understanding of chosen technologies. Some challenging features.",
    advanced: "Complex project requiring extensive experience. Advanced architecture and features."
  };

  const handleSubmit = useCallback(async (e) => {
    if (e) {
      e.preventDefault();
    }
  
    if (loading) return;
  
    // Basic validation
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.technologies.length === 0) {
      setError('Please select at least one technology');
      return;
    }
  
    setError('');
    setLoading(true);
  
    try {
      const projectData = {
        ...formData,
        organizationId: user.uid,
        organizationName: user.organizationName || user.displayName,
        status: 'open',
        assignedDevelopers: [], // Only keep assignedDevelopers, remove applicants
        dateCreated: serverTimestamp(),
        dateUpdated: serverTimestamp(),
        imageUrl: null
      };
  
      await addDoc(collection(db, 'projects'), projectData);
      navigate('/organization-portal');
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [formData, user, navigate, loading]);

  // Auto-submit logic remains the same
  useEffect(() => {
    const locationState = location.state;
    if (locationState?.formData) {
      setFormData(locationState.formData);
      if (locationState.autoSubmit && !submitTriggered.current) {
        submitTriggered.current = true;
      }
    }
  }, [location]);

  useEffect(() => {
    const locationState = location.state;
    if (locationState?.autoSubmit && submitTriggered.current && formData.title) {
      handleSubmit();
    }
  }, [formData, handleSubmit]);

  const handleTechnologyChange = (tech) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.includes(tech)
        ? prev.technologies.filter(t => t !== tech)
        : [...prev.technologies, tech]
    }));
  };

  const renderStepIndicator = () => (
    <div className="mb-12">
      <div className="max-w-3xl mx-auto">
        <div className="relative">
          <div className="absolute top-5 w-full">
            <div className="h-1 bg-gray-200 rounded-full">
              <div
                className="h-1 bg-blue-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
              />
            </div>
          </div>
          <div className="relative flex justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 
                    ${currentStep === step ? 'bg-blue-600 text-white scale-110' : 
                      currentStep > step ? 'bg-green-500 text-white' : 'bg-white text-gray-400 border-2 border-gray-200'}`}
                >
                  {currentStep > step ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-lg">{step}</span>
                  )}
                </div>
                <span className={`text-sm font-medium ${currentStep === step ? 'text-blue-600' : 'text-gray-500'}`}>
                  {step === 1 ? 'Basic Info' : step === 2 ? 'Technologies' : 'Details'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg mb-6 border border-blue-200">
        <h3 className="text-lg font-medium text-blue-900 mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tips for a Great Project Description
        </h3>
        <ul className="text-blue-800 text-sm space-y-2">
          <li className="flex items-start">
            <svg className="w-4 h-4 mr-2 mt-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Use a clear, specific title that describes the project's main goal
          </li>
          <li className="flex items-start">
            <svg className="w-4 h-4 mr-2 mt-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Explain why this project matters to your organization
          </li>
          <li className="flex items-start">
            <svg className="w-4 h-4 mr-2 mt-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Be specific about the features you need
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            placeholder="e.g., Community Food Bank Website"
          />
          <p className="mt-1 text-sm text-gray-500">A clear title helps developers understand your project at a glance</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Description <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <textarea
              required
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              placeholder="Describe what you want to build and why it matters..."
            />
            <div className="absolute bottom-2 right-2 text-sm text-gray-400">
              {formData.description.length}/500
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Include the problem you're solving and the impact this project will have
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg mb-6 border border-blue-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-blue-900 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Technology Selection
            </h3>
            <p className="text-blue-800 text-sm">Select the technologies you know you need. Don't worry if you're not sure about all of them.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowTechHelp(!showTechHelp)}
            className="text-blue-600 hover:text-blue-500 flex items-center text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Need help?
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(techCategories).map(([category, techs]) => (
          <div key={category} className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">{category}</h4>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {techs.map((tech) => (
                  <label
                    key={tech}
                    className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors duration-200 ${
                      formData.technologies.includes(tech)
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.technologies.includes(tech)}
                      onChange={() => handleTechnologyChange(tech)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{tech}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-medium text-blue-900 mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Final Project Details
        </h3>
        <p className="text-blue-800 text-sm">These details help set clear expectations for developers</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-4">
            Project Difficulty Level
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(difficultyDescriptions).map(([level, description]) => (
              <label
                key={level}
                className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  formData.difficulty === level
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-200'
                }`}
              >
                <input
                  type="radio"
                  name="difficulty"
                  value={level}
                  checked={formData.difficulty === level}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="sr-only"
                />
                <span className="flex items-center text-lg font-medium capitalize mb-2">
                  {formData.difficulty === level && (
                    <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {level}
                </span>
                <span className="text-sm text-gray-600">{description}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Estimate
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.timeEstimate}
                onChange={(e) => setFormData({ ...formData, timeEstimate: e.target.value })}
                placeholder="e.g., 2-3 weeks, 1 month"
                className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="mt-1 text-sm text-gray-500">Estimated time to complete the project</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Size
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="10"
                value={formData.maxDevelopers}
                onChange={(e) => setFormData({ ...formData, maxDevelopers: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="mt-1 text-sm text-gray-500">Maximum number of developers needed</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Requirements or Notes
          </label>
          <textarea
            rows={4}
            value={formData.requirements}
            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
            className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Any specific requirements, preferences, or additional information for developers..."
          />
          <p className="mt-1 text-sm text-gray-500">Include any specific qualifications, commitments, or other important details</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData.githubRequired}
              onChange={(e) => setFormData({ ...formData, githubRequired: e.target.checked })}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Require GitHub Account</span>
              <p className="text-sm text-gray-500">Developers will need to link their GitHub profile when applying</p>
            </div>
          </label>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Enrollment Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 
              ${formData.enrollmentType === 'direct' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}>
              <input
                type="radio"
                name="enrollmentType"
                value="direct"
                checked={formData.enrollmentType === 'direct'}
                onChange={(e) => setFormData({ ...formData, enrollmentType: e.target.value })}
                className="sr-only"
              />
              <span className="text-lg font-medium mb-2">Open Enrollment</span>
              <span className="text-sm text-gray-600">Developers can join directly without approval</span>
            </label>

            <label className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 
              ${formData.enrollmentType === 'application' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}>
              <input
                type="radio"
                name="enrollmentType"
                value="application"
                checked={formData.enrollmentType === 'application'}
                onChange={(e) => setFormData({ ...formData, enrollmentType: e.target.value })}
                className="sr-only"
              />
              <span className="text-lg font-medium mb-2">Application Required</span>
              <span className="text-sm text-gray-600">Review and approve developers before they can join</span>
            </label>

            <label className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 
              ${formData.enrollmentType === 'hybrid' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}>
              <input
                type="radio"
                name="enrollmentType"
                value="hybrid"
                checked={formData.enrollmentType === 'hybrid'}
                onChange={(e) => setFormData({ ...formData, enrollmentType: e.target.value })}
                className="sr-only"
              />
              <span className="text-lg font-medium mb-2">Hybrid</span>
              <span className="text-sm text-gray-600">Mix of open spots and application-based positions</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Create a New Project</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Share your project with our community of developers and bring your vision to life
          </p>
        </div>

        {renderStepIndicator()}

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden transition-all duration-300 transform hover:shadow-2xl">
          <div className="p-8">
            <form onSubmit={(e) => {
              e.preventDefault();
              if (currentStep < 3) {
                setCurrentStep(currentStep + 1);
              } else {
                handleSubmit(e);
              }
            }}>
              <div className="transition-all duration-300 transform">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
              </div>

              <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-200">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className={`inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white 
                    ${currentStep === 3 
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ml-auto`}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <LoadingSpinner size={24} className="mr-2" />
                      Creating Project...
                    </span>
                  ) : (
                    <>
                      {currentStep === 3 ? 'Create Project' : 'Next'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadProject;