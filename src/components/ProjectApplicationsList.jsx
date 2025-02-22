import React from 'react';
import { getStatusStyles } from '../utils/statusStyles';

const ProjectApplicationsList = ({ applications, isOrganization, onUpdateStatus }) => {
  return (
    <div className="divide-y divide-gray-200">
      {applications.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          No applications received yet
        </div>
      ) : (
        applications.map((application) => (
          <ApplicationCard
            key={application.id}
            application={application}
            isOrganization={isOrganization}
            onUpdateStatus={onUpdateStatus}
          />
        ))
      )}
    </div>
  );
};

const ApplicationCard = ({ application, isOrganization, onUpdateStatus }) => (
  <div className="p-6">
    <div className="flex justify-between items-start">
      <div className="flex items-start space-x-4">
        <img
          src={application.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
          alt={application.userName}
          className="h-12 w-12 rounded-full"
        />
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {application.userName}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Applied: {application.dateApplied?.toDate().toLocaleDateString()}
          </p>
          <p className="mt-2 text-gray-700">{application.coverLetter}</p>
          <div className="mt-4 space-x-4">
            {application.portfolio && (
              <a
                href={application.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-500"
              >
                Portfolio ↗
              </a>
            )}
            {application.githubProfile && (
              <a
                href={application.githubProfile}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-500"
              >
                GitHub ↗
              </a>
            )}
          </div>
        </div>
      </div>
      {isOrganization ? (
        <div className="flex items-center space-x-2">
          <select
            value={application.status}
            onChange={(e) => onUpdateStatus(application.id, e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="accepted">Accept</option>
            <option value="rejected">Reject</option>
          </select>
        </div>
      ) : (
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyles(application.status)}`}>
          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
        </div>
      )}
    </div>
  </div>
);

export default ProjectApplicationsList;