import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const OrganizationProfile = () => {
  const { user } = useContext(AuthContext);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState({
    organizationName: '',
    logo: '',
    description: '',
    mission: '',
    website: '',
    industry: '',
    organizationType: '',
    contactPerson: '',
    phoneNumber: '',
    address: '',
    registrationNumber: '',
    verified: false,
    createdAt: null
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.uid) return;

      try {
        const orgDoc = await getDoc(doc(db, 'users', user.uid));
        if (orgDoc.exists()) {
          const data = orgDoc.data();
          setProfileData({
            organizationName: data.organizationName || '',
            logo: data.logoUrl || 'https://api.dicebear.com/7.x/shapes/svg?seed=org',
            description: data.description || '',
            mission: data.mission || '',
            website: data.website || '',
            industry: data.industry || '',
            organizationType: data.organizationType || '',
            contactPerson: data.contactPerson || '',
            phoneNumber: data.phoneNumber || '',
            address: data.address || '',
            registrationNumber: data.registrationNumber || '',
            verified: data.verified || false,
            createdAt: data.createdAt?.toDate() || new Date()
          });
        }
      } catch (error) {
        console.error('Error fetching organization data:', error);
        setError('Failed to load organization data');
      }
    };

    fetchProfileData();
  }, [user]);

  const handleSaveInfo = async () => {
    if (!user) return;

    setLoading(true);
    setError('');
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        description: profileData.description.trim(),
        mission: profileData.mission.trim(),
        website: profileData.website.trim(),
        contactPerson: profileData.contactPerson.trim(),
        phoneNumber: profileData.phoneNumber.trim(),
        address: profileData.address.trim()
      });
      setIsEditingInfo(false);
    } catch (error) {
      console.error('Error updating organization info:', error);
      setError('Failed to update organization information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Header Section */}
        <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-gray-800 to-gray-700">
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <div className="relative">
              <img
                src={profileData.logo}
                alt="Organization Logo"
                className="h-24 w-24 rounded-lg bg-white p-1"
              />
              {profileData.verified && (
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white p-1 rounded-full">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>

            {/* Organization Name and Type */}
            <div className="flex-1 text-white">
              <h1 className="text-2xl font-bold">{profileData.organizationName}</h1>
              <p className="text-gray-300">{profileData.organizationType}</p>
              <p className="text-sm text-gray-300 mt-1">
                Member since {profileData.createdAt?.toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-5 sm:px-6">
          {/* Mission and Description */}
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <h2 className="text-lg font-medium text-gray-900">About Organization</h2>
              {!isEditingInfo && (
                <button
                  onClick={() => setIsEditingInfo(true)}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Edit Information
                </button>
              )}
            </div>

            {isEditingInfo ? (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mission Statement</label>
                  <textarea
                    rows={3}
                    value={profileData.mission}
                    onChange={(e) => setProfileData({ ...profileData, mission: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Your organization's mission..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={4}
                    value={profileData.description}
                    onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Tell us about your organization..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                  <input
                    type="text"
                    value={profileData.contactPerson}
                    onChange={(e) => setProfileData({ ...profileData, contactPerson: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                  <input
                    type="tel"
                    value={profileData.phoneNumber}
                    onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Website</label>
                  <input
                    type="url"
                    value={profileData.website}
                    onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    rows={3}
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsEditingInfo(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveInfo}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-6">
                <div>
                  <h3 className="text-md font-medium text-gray-900">Mission Statement</h3>
                  <p className="mt-2 text-gray-600">{profileData.mission || 'No mission statement provided.'}</p>
                </div>

                <div>
                  <h3 className="text-md font-medium text-gray-900">Description</h3>
                  <p className="mt-2 text-gray-600">{profileData.description || 'No description provided.'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Organization Details */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Organization Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Industry</h3>
                <p className="mt-1 text-gray-900">{profileData.industry}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Organization Type</h3>
                <p className="mt-1 text-gray-900">{profileData.organizationType}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Contact Person</h3>
                <p className="mt-1 text-gray-900">{profileData.contactPerson || 'Not provided'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Contact Number</h3>
                <p className="mt-1 text-gray-900">{profileData.phoneNumber || 'Not provided'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Website</h3>
                {profileData.website ? (
                  <a
                    href={profileData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-blue-600 hover:text-blue-500 block"
                  >
                    {profileData.website}
                  </a>
                ) : (
                  <p className="mt-1 text-gray-900">Not provided</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Registration/Tax ID</h3>
                <p className="mt-1 text-gray-900">{profileData.registrationNumber}</p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Address</h3>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">{profileData.address || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationProfile;