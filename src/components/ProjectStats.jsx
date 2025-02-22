import React from 'react';

const ProjectStats = ({ applications, maxDevelopers }) => {
  const acceptedCount = applications.filter(app => app.status === 'accepted').length;
  
  return (
    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Applications"
        value={applications.length}
      />
      <StatCard
        title="Pending Applications"
        value={applications.filter(app => app.status === 'pending').length}
      />
      <StatCard
        title="Accepted Applications"
        value={acceptedCount}
      />
      <StatCard
        title="Available Positions"
        value={maxDevelopers - acceptedCount}
      />
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="px-4 py-5 sm:p-6">
      <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
      <dd className="mt-1 text-3xl font-semibold text-gray-900">{value}</dd>
    </div>
  </div>
);

export default ProjectStats;