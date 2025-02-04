// src/components/MessagingSystem.js
import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/config';
import { 
  collection, query, where, orderBy, limit, 
  addDoc, serverTimestamp, onSnapshot, 
  getDocs, updateDoc, doc 
} from 'firebase/firestore';

const Message = ({ message, isOwn, timestamp }) => (
  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
    <div
      className={`rounded-lg px-4 py-2 max-w-[70%] ${
        isOwn 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 text-gray-900'
      }`}
    >
      <p className="text-sm whitespace-pre-wrap">{message}</p>
      <p className="text-xs mt-1 opacity-75">
        {timestamp ? new Date(timestamp.toDate()).toLocaleTimeString() : ''}
      </p>
    </div>
  </div>
);

const MessagingSystem = ({ projectId, currentUser, otherUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const conversationQuery = query(
      collection(db, 'messages'),
      where('projectId', '==', projectId),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(conversationQuery, (snapshot) => {
      const messageList = [];
      let unread = 0;

      snapshot.forEach((doc) => {
        const messageData = { id: doc.id, ...doc.data() };
        messageList.push(messageData);
        
        // Count unread messages
        if (!messageData.read && messageData.senderId !== currentUser.uid) {
          unread++;
        }
      });

      setMessages(messageList);
      setUnreadCount(unread);
      setLoading(false);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [projectId, currentUser.uid]);

  // Mark messages as read when they become visible
  useEffect(() => {
    const markMessagesAsRead = async () => {
      const unreadMessages = messages.filter(
        msg => !msg.read && msg.senderId !== currentUser.uid
      );

      for (const message of unreadMessages) {
        await updateDoc(doc(db, 'messages', message.id), {
          read: true
        });
      }
    };

    markMessagesAsRead();
  }, [messages, currentUser.uid]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'messages'), {
        projectId,
        senderId: currentUser.uid,
        receiverId: otherUser.uid,
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
        read: false,
        participants: [currentUser.uid, otherUser.uid]
      });

      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white shadow rounded-lg h-[600px]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img
              src={otherUser.photoURL || 'https://via.placeholder.com/40'}
              alt={otherUser.displayName}
              className="h-10 w-10 rounded-full"
            />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {otherUser.displayName}
              </p>
              <p className="text-xs text-gray-500">
                {unreadCount > 0 && `${unreadCount} unread messages`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <Message
              key={msg.id}
              message={msg.message}
              isOwn={msg.senderId === currentUser.uid}
              timestamp={msg.timestamp}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
        <div className="flex space-x-4">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
            }}
            placeholder="Type your message..."
            className="flex-1 resize-none rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={2}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessagingSystem;