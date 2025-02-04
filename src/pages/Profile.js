// src/pages/Profile.js
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { db, auth } from '../firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import AvatarSelector from '../components/AvatarSelector';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState({
    displayName: '',
    avatar: '',
    aboutMe: '',
    skills: [],
    completedProjects: [],
    joinDate: null
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.uid) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileData({
            displayName: user.displayName || '',
            avatar: user.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
            aboutMe: data.aboutMe || '',
            skills: data.skills || [],
            completedProjects: data.completedProjects || [],
            joinDate: data.createdAt?.toDate() || new Date()
          });
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError('Failed to load profile data');
      }
    };

    fetchProfileData();
  }, [user]);

  const handleSaveName = async () => {
    if (!profileData.displayName.trim() || !user) return;

    setLoading(true);
    setError('');
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateProfile(currentUser, {
          displayName: profileData.displayName.trim()
        });

        await updateDoc(doc(db, 'users', user.uid), {
          displayName: profileData.displayName.trim()
        });

        setIsEditingName(false);
      } else {
        throw new Error('No authenticated user found');
      }
    } catch (error) {
      console.error('Error updating display name:', error);
      setError('Failed to update display name');
      setProfileData(prev => ({
        ...prev,
        displayName: user.displayName || ''
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAvatar = async (newAvatar) => {
    if (!user) return;

    setLoading(true);
    setError('');
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateProfile(currentUser, {
          photoURL: newAvatar
        });

        await updateDoc(doc(db, 'users', user.uid), {
          photoURL: newAvatar
        });

        setProfileData(prev => ({
          ...prev,
          avatar: newAvatar
        }));
        setShowAvatarSelector(false);
      } else {
        throw new Error('No authenticated user found');
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      setError('Failed to update avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAbout = async () => {
    if (!user) return;

    setLoading(true);
    setError('');
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        aboutMe: profileData.aboutMe.trim()
      });
      setIsEditingAbout(false);
    } catch (error) {
      console.error('Error updating about me:', error);
      setError('Failed to update about section');
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
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center space-x-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={profileData.avatar}
                alt="Profile"
                className="h-24 w-24 rounded-full cursor-pointer hover:opacity-75 transition-opacity"
                onClick={() => setShowAvatarSelector(true)}
              />
              <button
                onClick={() => setShowAvatarSelector(true)}
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700"
                disabled={loading}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>

            {/* Name and Email */}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                {isEditingName ? (
                  <div className="flex-1 mr-4">
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({ 
                        ...profileData, 
                        displayName: e.target.value 
                      })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-lg"
                      placeholder="Enter your name"
                      disabled={loading}
                    />
                    <div className="mt-2 flex space-x-2">
                      <button
                        onClick={handleSaveName}
                        disabled={loading || !profileData.displayName.trim()}
                        className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingName(false);
                          setProfileData(prev => ({
                            ...prev,
                            displayName: user?.displayName || ''
                          }));
                        }}
                        disabled={loading}
                        className="px-3 py-1 text-sm text-gray-700 hover:text-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {profileData.displayName || 'Add your name'}
                    </h1>
                    <button
                      onClick={() => setIsEditingName(true)}
                      disabled={loading}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <p className="text-sm text-gray-500">
                Joined {profileData.joinDate?.toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* About Me Section */}
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-medium text-gray-900">About Me</h2>
            {!isEditingAbout && (
              <button
                onClick={() => setIsEditingAbout(true)}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Edit
              </button>
            )}
          </div>
          
          {isEditingAbout ? (
            <div className="mt-2">
              <textarea
                rows={4}
                value={profileData.aboutMe}
                onChange={(e) => setProfileData({ 
                  ...profileData, 
                  aboutMe: e.target.value 
                })}
                disabled={loading}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Tell us about yourself..."
              />
              <div className="mt-3 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsEditingAbout(false);
                    setProfileData(prev => ({
                      ...prev,
                      aboutMe: user?.aboutMe || ''
                    }));
                  }}
                  disabled={loading}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAbout}
                  disabled={loading}
                  className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-gray-600">
              {profileData.aboutMe || 'No description provided yet.'}
            </p>
          )}
        </div>
        

        {/* Skills Section */}
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Skills</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {profileData.skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {skill}
              </span>
            ))}
            {profileData.skills.length === 0 && (
              <p className="text-gray-500">No skills added yet.</p>
            )}
          </div>
        </div>

        {/* Completed Projects Section */}
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Completed Projects
          </h2>
          {profileData.completedProjects.length === 0 ? (
            <p className="text-gray-500">No completed projects yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {profileData.completedProjects.map((project, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-medium text-gray-900">{project.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {project.technologies?.map((tech, techIndex) => (
                      <span
                        key={techIndex}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
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

      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
        <AvatarSelector
          currentAvatar={profileData.avatar}
          onSelect={handleUpdateAvatar}
          onClose={() => setShowAvatarSelector(false)}
        />
      )}
    </div>
  );
};

export default Profile;