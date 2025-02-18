import React from 'react';

const ProjectSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse border border-gray-100">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="skeleton h-7 w-2/3 rounded-md"></div>
          <div className="skeleton h-6 w-20 rounded-full"></div>
        </div>
        
        <div className="space-y-2 mb-6">
          <div className="skeleton h-4 w-full rounded"></div>
          <div className="skeleton h-4 w-5/6 rounded"></div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <div className="skeleton h-7 w-20 rounded-full"></div>
          <div className="skeleton h-7 w-24 rounded-full"></div>
          <div className="skeleton h-7 w-16 rounded-full"></div>
        </div>

        <div className="flex flex-wrap justify-between gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="skeleton h-5 w-24 rounded"></div>
            <div className="skeleton h-5 w-24 rounded"></div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center">
            <div className="skeleton h-10 w-10 rounded-full"></div>
            <div className="skeleton h-4 w-32 ml-3 rounded"></div>
          </div>
          <div className="skeleton h-9 w-24 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSkeleton;