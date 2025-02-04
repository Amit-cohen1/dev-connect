// src/components/ProjectApplications.js
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { 
  collection, query, where, getDocs, updateDoc, doc, 
  serverTimestamp, addDoc 
} from 'firebase/firestore';

const ProjectApplications = ({ organizationId }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [message, setMessage] = useState('');

  const fetchApplications = async () => {
    try {
      // Get all projects for this organization
      const projectsQuery = query(
        collection(db, 'projects'),
        where('organizationId', '==', organizationId)
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      const projectIds = projectsSnapshot.docs.map(doc => doc.id);

      // Get applications for these projects
      const applicationsQuery = query(
        collection(db, 'projectApplications'),
        where('projectId', 'in', projectIds)
      );
      const applicationsSnapshot = await getDocs(applicationsQuery);
      
      // Get additional details for each application
      const applicationData = await Promise.all(
        applicationsSnapshot.docs.map(async (appDoc) => {
          const app = appDoc.data();
          const [userDoc, projectDoc] = await Promise.all([
            getDocs(doc(db, 'users', app.userId)),
            getDocs(doc(db, 'projects', app.projectId))
          ]);
          
          return {
            id: appDoc.id,
            ...app,
            user: userDoc.data(),
            project: projectDoc.data()
          };
        })
      );

      setApplications(applicationData);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [organizationId]);

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      await updateDoc(doc(db, 'projectApplications', applicationId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      // Refresh applications list
      fetchApplications();
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedApplication) return;

    try {
      await addDoc(collection(db, 'messages'), {
        applicationId: selectedApplication.id,
        projectId: selectedApplication.projectId,
        senderId: organizationId,
        receiverId: selectedApplication.userId,
        content: message,
        timestamp: serverTimestamp(),
        read: false
      });

      setMessage('');
      // Could also refresh messages list here
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Applications List */}
      <div className="lg:col-span-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900">Project Applications</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {applications.map((application) => (
              <li 
                key={application.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  selectedApplication?.id === application.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedApplication(application)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {application.user.name} · {application.project.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      Applied {new Date(application.dateApplied?.toDate()).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        application.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : application.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {application.status}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Application Details & Communication */}
      <div className="lg:col-span-1">
        {selectedApplication ? (
          <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
            <div className="p-4">
              <h4 className="font-medium text-gray-900">Application Details</h4>
              <dl className="mt-2 space-y-2">
                <div>
                  <dt className="text-sm text-gray-500">Developer</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {selectedApplication.user.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Project</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {selectedApplication.project.title}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Status</dt>
                  <dd className="text-sm font-medium">
                    <select
                      value={selectedApplication.status}
                      onChange={(e) => handleStatusUpdate(selectedApplication.id, e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-4">Send Message</h4>
              <div className="space-y-4">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Type your message..."
                />
                <button
                  onClick={sendMessage}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
            Select an application to view details
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectApplications;