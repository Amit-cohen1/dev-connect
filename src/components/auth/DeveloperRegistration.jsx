import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const DeveloperRegistration = ({ onBack }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    skillLevel: '',
    technologies: [],
    githubProfile: '',
    linkedinProfile: '',
    portfolio: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const techOptions = [
    'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'TypeScript',
    'Angular', 'Vue.js', 'PHP', 'Ruby', 'C#', 'Go', 'Swift'
  ];

  const handleTechToggle = (tech) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.includes(tech)
        ? prev.technologies.filter(t => t !== tech)
        : [...prev.technologies, tech]
    }));
  };

  const validateStep = () => {
    setError('');
    switch(step) {
      case 1:
        if (!formData.fullName || !formData.email) {
          setError('Please fill in all required fields');
          return false;
        }
        break;
      case 2:
        if (!formData.password || formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          return false;
        }
        break;
      case 3:
        if (!formData.skillLevel || formData.technologies.length === 0) {
          setError('Please select your skill level and at least one technology');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await createUserDocument(result.user, {
        fullName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL
      });
      navigate('/profile');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createUserDocument = async (user, additionalData) => {
    await setDoc(doc(db, 'users', user.uid), {
      type: 'developer',
      ...additionalData,
      skillLevel: formData.skillLevel,
      technologies: formData.technologies,
      githubProfile: formData.githubProfile,
      linkedinProfile: formData.linkedinProfile,
      portfolio: formData.portfolio,
      createdAt: new Date(),
      projects: []
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      await createUserDocument(userCredential.user, {
        fullName: formData.fullName,
        email: formData.email
      });

      navigate('/profile');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-700">Skill Level</label>
              <select
                value={formData.skillLevel}
                onChange={(e) => setFormData({...formData, skillLevel: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select your level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Technologies</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {techOptions.map((tech) => (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => handleTechToggle(tech)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                      formData.technologies.includes(tech)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tech}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-700">GitHub Profile (Optional)</label>
              <input
                type="url"
                value={formData.githubProfile}
                onChange={(e) => setFormData({...formData, githubProfile: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="https://github.com/username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">LinkedIn Profile (Optional)</label>
              <input
                type="url"
                value={formData.linkedinProfile}
                onChange={(e) => setFormData({...formData, linkedinProfile: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Portfolio Website (Optional)</label>
              <input
                type="url"
                value={formData.portfolio}
                onChange={(e) => setFormData({...formData, portfolio: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="https://yourportfolio.com"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Developer Registration</h2>
          <p className="mt-2 text-sm text-gray-600">Step {step} of 4</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="bg-white shadow-xl rounded-lg p-8">
          {step === 1 && (
            <div className="mb-8">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                <img
                  className="h-5 w-5 mr-2"
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google logo"
                />
                Continue with Google
              </button>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {renderStep()}

            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={step === 1 ? onBack : () => setStep(prev => prev - 1)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                {step === 1 ? 'Back' : 'Previous'}
              </button>
              
              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Next
                  <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeveloperRegistration;