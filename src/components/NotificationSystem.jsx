// src/components/NotificationSystem.js
import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase/config';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc
} from 'firebase/firestore';
import LoadingSpinner from './LoadingSpinner';

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
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
          link: `/project/${notification.projectId}`
        };
      case 'project_update':
        return {
          icon: '🔄',
          message: `Project "${notification.projectTitle}" has been updated`,
          link: `/project/${notification.projectId}`
        };
      case 'new_application':
        return {
          icon: '👋',
          message: `New application received for "${notification.projectTitle}"`,
          link: `/project/${notification.projectId}`
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
    <div className={`p-4 hover:bg-gray-50 relative group ${notification.read ? 'opacity-75' : ''}`}>
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
      </Link>

      {/* Action buttons - appear on hover */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 flex space-x-2 transition-opacity">
        {!notification.read && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
            className="text-blue-600 hover:text-blue-800 p-1 rounded"
            title="Mark as read"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          className="text-red-600 hover:text-red-800 p-1 rounded"
          title="Delete"
          >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {!notification.read && (
        <span className="absolute right-2 top-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-blue-600 bg-blue-100 rounded-full">
          New
        </span>
      )}
    </div>
  );
};

const NotificationSystem = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
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

  const handleDelete = async (notificationId) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
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

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      try {
        await Promise.all(
          notifications.map(notification =>
            deleteDoc(doc(db, 'notifications', notification.id))
          )
        );
        setIsOpen(false);
      } catch (error) {
        console.error('Error clearing notifications:', error);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      // Don't close if clicking the notification button or inside the panel
      if (e.target.closest('.notification-button')) {
        return;
      }
      
      // Close if clicking outside the notification panel
      if (!e.target.closest('.notification-container')) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  return (
    <div className="relative notification-container z-50">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none notification-button"
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

      {/* Notifications Panel */}
      {isOpen && (
        <>
          {/* Mobile overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-[100] md:hidden" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className={`
            fixed md:absolute 
            inset-y-0 right-0 md:inset-auto
            top-0 md:top-10 
            md:-right-2
            h-[100dvh] md:h-auto
            w-[85vw] md:w-96
            bg-white 
            shadow-lg 
            z-[101] 
            overflow-y-auto 
            md:rounded-lg
            transform-gpu
            transition-all
            duration-300
            ease-out
            safe-area-inset-bottom
            pb-[env(safe-area-inset-bottom)]
            ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 md:opacity-100 md:translate-x-0'}
            md:max-h-[calc(100vh-80px)]
          `}>
            {/* Mobile drag indicator */}
            <div className="md:hidden w-12 h-1 bg-gray-300 rounded-full mx-auto my-3"></div>
            {/* Mobile header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                </div>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="text-sm text-red-600 hover:text-red-500"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <LoadingSpinner size={80} />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications yet
                </div>
              ) : (
                notifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
            {/* Mobile bottom safe area spacer */}
            <div className="h-[env(safe-area-inset-bottom)] md:hidden"></div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationSystem;