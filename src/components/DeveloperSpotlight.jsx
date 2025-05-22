import React from 'react';

const DeveloperSpotlight = ({ user }) => {
  // Assuming user prop will always be provided as per subtask instructions.
  // If user could be null/undefined, add: if (!user) return null;

  const combinedSkills = (user.skills || []).concat(user.technologies || []);

  return (
    <div className="bg-white shadow-2xl rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl">
      <img
        src={user.photoURL || '/default-avatar.png'} // Assumes /default-avatar.png exists in public folder
        alt={`${user.displayName}'s profile`}
        className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-blue-500 shadow-md flex-shrink-0"
      />
      <div className="flex-1 space-y-3 text-center md:text-left">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800">
          <span role="img" aria-label="star" className="mr-2">🌟</span>
          {user.displayName}
        </h2>
        <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
          {user.aboutMe || "No information provided."}
        </p>

        {combinedSkills.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mt-4 mb-2">Skills & Technologies:</h4>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {combinedSkills.slice(0, 6).map((skill, idx) => (
                <span 
                  key={idx} 
                  className="bg-blue-100 text-blue-800 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium shadow-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {(user.achievements || []).length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mt-5 mb-2">Achievements:</h4>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-600 space-y-1.5 text-left">
              {(user.achievements || []).slice(0, 3).map((ach, idx) => (
                <li key={idx} className="ml-2">{ach}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperSpotlight;
