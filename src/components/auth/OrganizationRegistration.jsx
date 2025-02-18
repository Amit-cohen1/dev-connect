// src/components/auth/OrganizationRegistration.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../../firebase/config';
import { 
  createUserWithEmailAndPassword, 
  updateProfile,
  fetchSignInMethodsForEmail 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const OrganizationRegistration = ({ onBack }) => {
  const navigate = useNavigate();
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
    industry: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const industries = [
    'Technology',
    'Healthcare',
    'Education',
    'Nonprofit',
    'Financial Services',
    'Manufacturing',
    'Retail',
    'Other'
  ];

  const checkEmailAvailability = async (email) => {
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      return signInMethods.length === 0;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        if (file.size <= 5 * 1024 * 1024) { // 5MB limit
          setFormData({ ...formData, logo: file });
          setError(''); // Clear any existing errors
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
    setError('');
    setLoading(true);

    // Form validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password should be at least 6 characters');
      setLoading(false);
      return;
    }

    // Check email availability
    const isEmailAvailable = await checkEmailAvailability(formData.email);
    if (!isEmailAvailable) {
      setError('This email is already registered. Please use a different email or try logging in.');
      setLoading(false);
      return;
    }

    try {
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Handle logo upload if provided
      let logoUrl = null;
      if (formData.logo) {
        try {
          const fileExtension = formData.logo.name.split('.').pop();
          const fileName = `organization-logos/${userCredential.user.uid}.${fileExtension}`;
          const storageRef = ref(storage, fileName);
          
          await uploadBytes(storageRef, formData.logo);
          logoUrl = await getDownloadURL(storageRef);
        } catch (uploadError) {
          console.error('Error uploading logo:', uploadError);
          // Continue with registration even if logo upload fails
        }
      }

      // Create organization document in Firestore
      const userData = {
        type: 'organization',
        organizationName: formData.organizationName.trim(),
        website: formData.website.trim(),
        description: formData.description.trim(),
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

      // Update Firebase auth profile
      await updateProfile(userCredential.user, {
        displayName: formData.organizationName.trim(),
        photoURL: logoUrl
      });

      // Navigate to success page
      navigate('/organization-portal');
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific Firebase errors
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('This email is already registered. Please use a different email or try logging in.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        case 'auth/operation-not-allowed':
          setError('Registration is currently disabled. Please contact support.');
          break;
        case 'auth/weak-password':
          setError('Password is too weak. Please use at least 6 characters.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your internet connection.');
          break;
        default:
          setError('Failed to create account. Please try again.');
      }

      // Cleanup if user was partially created
      try {
        if (auth.currentUser) {
          await auth.currentUser.delete();
        }
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Organization Registration
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create your organization account to start posting projects
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            {/* Organization Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Organization Type
              </label>
              <select
                value={formData.organizationType}
                onChange={(e) => setFormData({ ...formData, organizationType: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="company">Company</option>
                <option value="nonprofit">Nonprofit Organization</option>
              </select>
            </div>

            {/* Organization Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Organization Name
              </label>
              <input
                type="text"
                required
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Industry
              </label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                required
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Select Industry</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onBlur={async (e) => {
                  if (e.target.value) {
                    const isAvailable = await checkEmailAvailability(e.target.value);
                    if (!isAvailable) {
                      setError('This email is already registered. Please use a different email or try logging in.');
                    } else {
                      setError('');
                    }
                  }
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Organization Description
              </label>
              <textarea
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact Person Name
              </label>
              <input
                type="text"
                required
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                rows={2}
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Registration Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Business/Organization Registration Number
              </label>
              <input
                type="text"
                required
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Organization Logo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1 block w-full"
              />
              <p className="mt-1 text-xs text-gray-500">
                Maximum file size: 5MB. Accepted formats: JPG, PNG, GIF
              </p>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Organization Account'}
              </button>
            </div>
          </form>

          {/* Back Button */}
          <div className="mt-6">
            <button
              onClick={onBack}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to user type selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationRegistration;
