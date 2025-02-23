// src/components/Conversations.js
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase/config';
import { 
  collection, query, where, orderBy, getDocs,
  doc, getDoc 
} from 'firebase/firestore';
import MessagingSystem from './MessagingSystem';
import LoadingSpinner from './LoadingSpinner';

const ConversationList = ({ conversations, selectedId, onSelect }) => (
  <div className="divide-y divide-gray-200">
    {conversations.map((conversation) => (
      <div
        key={conversation.id}
        className={`p-4 cursor-pointer hover:bg-gray-50 ${
          selectedId === conversation.id ? 'bg-blue-50' : ''
        }`}
        onClick={() => onSelect(conversation)}
      >
        <div className="flex items-center space-x-3">
          <img
            src={conversation.otherUser.photoURL || 'https://via.placeholder.com/40'}
            alt=""
            className="h-10 w-10 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {conversation.otherUser.displayName}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {conversation.projectTitle}
            </p>
          </div>
          {conversation.unreadCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    ))}
  </div>
);

const Conversations = () => {
  const { user } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        // Get all messages where user is a participant
        const messagesQuery = query(
          collection(db, 'messages'),
          where('participants', 'array-contains', user.uid),
          orderBy('timestamp', 'desc')
        );

        const messagesSnapshot = await getDocs(messagesQuery);
        
        // Group messages by project and get latest message
        const conversationsMap = new Map();
        
        for (const messageDoc of messagesSnapshot.docs) {
          const messageData = messageDoc.data();
          const projectId = messageData.projectId;
          
          if (!conversationsMap.has(projectId)) {
            // Get project details
            const projectDoc = await getDoc(doc(db, 'projects', projectId));
            const projectData = projectDoc.data();

            // Get other user's details
            const otherUserId = messageData.participants.find(id => id !== user.uid);
            const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
            const otherUserData = otherUserDoc.data();

            conversationsMap.set(projectId, {
              id: projectId,
              projectTitle: projectData.title,
              otherUser: {
                uid: otherUserId,
                displayName: otherUserData.displayName,
                photoURL: otherUserData.photoURL
              },
              lastMessage: messageData,
              unreadCount: messageData.read ? 0 : 1
            });
          } else if (!messageData.read && messageData.senderId !== user.uid) {
            // Update unread count for existing conversation
            const conversation = conversationsMap.get(projectId);
            conversation.unreadCount = (conversation.unreadCount || 0) + 1;
          }
        }

        setConversations(Array.from(conversationsMap.values()));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setLoading(false);
      }
    };

    if (user) {
      fetchConversations();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size={80} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900">Conversations</h3>
          </div>
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations yet
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversation?.id}
              onSelect={setSelectedConversation}
            />
          )}
        </div>

        {/* Active Conversation */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <MessagingSystem
              projectId={selectedConversation.id}
              currentUser={user}
              otherUser={selectedConversation.otherUser}
            />
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Conversations;