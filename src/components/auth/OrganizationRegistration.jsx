// src/components/auth/OrganizationRegistration.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../../firebase/config';
import { createUserWithEmailAndPassword, updateProfile, fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const OrganizationRegistration = ({ onBack }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    website: '',
    description: '',
    address: '',
    contactPerson: '',
    phoneNumber: '',
    organizationType: 'company',
    logo: null,
    registrationNumber: '',
    industry: '',
    mission: '',
    previewLogo: null
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const industries = [
    'Technology', 'Healthcare', 'Education', 'Nonprofit',
    'Financial Services', 'Manufacturing', 'Retail', 'Other'
  ];

  const validateStep = () => {
    setError('');
    switch(step) {
      case 1:
        if (!formData.organizationName || !formData.organizationType || !formData.industry) {
          setError('Please fill in all required fields');
          return false;
        }
        break;
      case 2:
        if (!formData.email || !formData.password || !formData.confirmPassword) {
          setError('Please fill in all required fields');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          return false;
        }
        break;
      case 3:
        if (!formData.contactPerson || !formData.phoneNumber || !formData.address) {
          setError('Please fill in all required fields');
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        if (file.size <= 5 * 1024 * 1024) {
          setFormData({ 
            ...formData, 
            logo: file,
            previewLogo: URL.createObjectURL(file)
          });
          setError('');
        } else {
          setError('Logo file size must be less than 5MB');
        }
      } else {
        setError('Please upload an image file (JPG, PNG, etc.)');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    setError('');
    setLoading(true);

    try {
      // Check email availability
      const signInMethods = await fetchSignInMethodsForEmail(auth, formData.email);
      if (signInMethods.length > 0) {
        setError('This email is already registered');
        setLoading(false);
        return;
      }

      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Handle logo upload if provided
      let logoUrl = null;
      if (formData.logo) {
        const fileExtension = formData.logo.name.split('.').pop();
        const fileName = `organization-logos/${userCredential.user.uid}.${fileExtension}`;
        const storageRef = ref(storage, fileName);
        
        await uploadBytes(storageRef, formData.logo);
        logoUrl = await getDownloadURL(storageRef);
      }

      // Create organization document
      const userData = {
        type: 'organization',
        organizationName: formData.organizationName.trim(),
        website: formData.website.trim(),
        description: formData.description.trim(),
        mission: formData.mission.trim(),
        address: formData.address.trim(),
        contactPerson: formData.contactPerson.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        email: formData.email.trim(),
        organizationType: formData.organizationType,
        industry: formData.industry,
        registrationNumber: formData.registrationNumber.trim(),
        logoUrl,
        createdAt: new Date(),
        verified: false,
        projects: []
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
      await updateProfile(userCredential.user, {
        displayName: formData.organizationName.trim(),
        photoURL: logoUrl
      });

      navigate('/organization-portal');
    } catch (error) {
      console.error('Registration error:', error);
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
              <label className="block text-sm font-medium text-gray-700">Organization Name</label>
              <input
                type="text"
                required
                value={formData.organizationName}
                onChange={(e) => setFormData({...formData, organizationName: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Organization Type</label>
              <select
                value={formData.organizationType}
                onChange={(e) => setFormData({...formData, organizationType: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="company">Company</option>
                <option value="nonprofit">Nonprofit Organization</option>
                <option value="education">Educational Institution</option>
                <option value="government">Government Organization</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Industry</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({...formData, industry: e.target.value})}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Industry</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Mission Statement</label>
              <textarea
                rows={3}
                value={formData.mission}
                onChange={(e) => setFormData({...formData, mission: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Share your organization's mission..."
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

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
              <label className="block text-sm font-medium text-gray-700">Contact Person Name</label>
              <input
                type="text"
                required
                value={formData.contactPerson}
                onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <textarea
                rows={3}
                required
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-700">Organization Logo</label>
              <div className="mt-1 flex items-center space-x-6">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                  {formData.previewLogo ? (
                    <img
                      src={formData.previewLogo}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Upload Logo
                  </label>
                  <p className="mt-2 text-xs text-gray-500">
                    Maximum file size: 5MB. Accepted formats: JPG, PNG
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Website (Optional)</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="https://"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Organization Description</label>
              <textarea
                rows={4}
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Tell us about your organization..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Registration/Tax ID Number
              </label>
              <input
                type="text"
                required
                value={formData.registrationNumber}
                onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Organization Registration</h2>
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

export default OrganizationRegistration;
