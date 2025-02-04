// src/components/AvatarSelector.js
import { useState } from 'react';

const AvatarSelector = ({ currentAvatar, onSelect, onClose }) => {
  const avatarOptions = [
    '/avatars/dev1.png',
    '/avatars/dev2.png',
    '/avatars/dev3.png',
    '/avatars/dev4.png',
    '/avatars/dev5.png',
    '/avatars/dev6.png',
    // Add more avatar URLs as needed
  ];

  // For demonstration, we'll use placeholder images
  const placeholderAvatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=dev1',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=dev2',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=dev3',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=dev4',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=dev5',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=dev6',
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Choose an Avatar</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {placeholderAvatars.map((avatar, index) => (
            <button
              key={index}
              onClick={() => onSelect(avatar)}
              className={`relative rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 focus:outline-none
                ${currentAvatar === avatar ? 'ring-2 ring-blue-600' : ''}`}
            >
              <img
                src={avatar}
                alt={`Avatar option ${index + 1}`}
                className="w-full h-auto"
              />
              {currentAvatar === avatar && (
                <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AvatarSelector;