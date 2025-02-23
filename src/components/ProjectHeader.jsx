import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProjectHeader = ({ project, user, isEditing, editedProject, setEditedProject, onEdit, onDelete, onApply, hasApplied }) => {
  const canApply = () => {
    if (!user || user.uid === project.organizationId) return false;
    if (hasApplied) return false;
    if (project.status !== 'open') return false;
    
    // For hybrid projects, check if direct enrollment is still available
    if (project.enrollmentType === 'hybrid') {
      const currentDevelopers = project.assignedDevelopers?.length || 0;
      const directSpots = Math.floor(project.maxDevelopers / 2);
      return currentDevelopers < project.maxDevelopers; // Can still apply even if direct spots are full
    }
    
    return true;
  };

  const getEnrollmentBadge = () => {
    if (project.enrollmentType === 'direct') {
      return 'Open Enrollment';
    } else if (project.enrollmentType === 'application') {
      return 'Application Required';
    } else if (project.enrollmentType === 'hybrid') {
      const currentDevelopers = project.assignedDevelopers?.length || 0;
      const directSpots = Math.floor(project.maxDevelopers / 2);
      return currentDevelopers < directSpots ? 'Direct Spots Available' : 'Application Required';
    }
    return '';
  };

  return (
    <div className="relative h-96">
      <img
        src={project.imageUrl || '/placeholder.jpg'}
        alt={project.title}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 p-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">{project.title}</h1>
            <div className="flex items-center space-x-4">
              <span className="bg-blue-500/80 text-white px-4 py-1 rounded-full text-sm font-medium">
                {project.status}
              </span>
              <span className="text-white/90">
                Posted by {project.organizationName}
              </span>
              {project.enrollmentType && (
                <span className={`px-4 py-1 rounded-full text-sm font-medium ${
                  project.enrollmentType === 'hybrid' && project.assignedDevelopers?.length >= Math.floor(project.maxDevelopers / 2)
                    ? 'bg-yellow-500/80 text-white'
                    : 'bg-green-500/80 text-white'
                }`}>
                  {getEnrollmentBadge()}
                </span>
              )}
            </div>
          </div>
          {user?.uid === project.organizationId ? (
            <div className="flex space-x-3">
              <button
                onClick={onEdit}
                className="bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Project
              </button>
              <button
                onClick={onDelete}
                className="bg-red-500/90 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Project
              </button>
            </div>
          ) : (
            canApply() && (
              <button
                onClick={onApply}
                disabled={hasApplied}
                className={`${
                  hasApplied
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white px-4 py-2 rounded-md transition-colors duration-200`}
              >
                {hasApplied ? 'Already Applied' : 'Apply Now'}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;