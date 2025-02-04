// src/components/NotificationSystem.js
import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase/config';
import { 
  collection, query, where, orderBy, limit, 
  onSnapshot, updateDoc, doc 
} from 'firebase/firestore';

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const getNotificationContent = () => {
    switch (notification.type) {
      case 'new_message':
        return {
          icon: '💬',
          message: `New message from ${notification.senderName}`,
          link: `/conversations/${notification.projectId}`
        };
      case 'application_status':
        return {
          icon: '📝',
          message: `Your application for "${notification.projectTitle}" was ${notification.status}`,
          link: `/projects/${notification.projectId}`
        };
      case 'project_update':
        return {
          icon: '🔄',
          message: `Project "${notification.projectTitle}" has been updated`,
          link: `/projects/${notification.projectId}`
        };
      case 'new_application':
        return {
          icon: '👋',
          message: `New application received for "${notification.projectTitle}"`,
          link: `/projects/${notification.projectId}/applications`
        };
      default:
        return {
          icon: '📌',
          message: notification.message,
          link: '/'
        };
    }
  };

  const content = getNotificationContent();

  return (
    <div className={`p-4 hover:bg-gray-50 ${notification.read ? 'opacity-75' : ''}`}>
      <Link 
        to={content.link}
        className="flex items-start space-x-3"
        onClick={() => onMarkAsRead(notification.id)}
      >
        <span className="text-2xl">{content.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm text-gray-900 ${notification.read ? '' : 'font-medium'}`}>
            {content.message}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(notification.timestamp?.toDate()).toLocaleString()}
          </p>
        </div>
        {!notification.read && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            New
          </span>
        )}
      </Link>
    </div>
  );
};

const NotificationSystem = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setNotifications(notificationsList);
      setUnreadCount(notificationsList.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(notification =>
          updateDoc(doc(db, 'notifications', notification.id), {
            read: true
          })
        )
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-200">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;