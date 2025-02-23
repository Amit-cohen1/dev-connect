import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  getDoc,
  doc
} from 'firebase/firestore';
import { sendNotification } from '../utils/notifications';
import { useNavigate } from 'react-router-dom';
import { Player } from '@lottiefiles/react-lottie-player';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import LoadingSpinner from './LoadingSpinner';

const ProjectComments = ({ projectId, organizationId }) => {
  const { user } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [mentionedUsers, setMentionedUsers] = useState([]);
  const [showUserList, setShowUserList] = useState(false);
  const [projectUsers, setProjectUsers] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const commentsQuery = query(
      collection(db, 'projectComments'),
      where('projectId', '==', projectId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const commentsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Group replies with their parent comments
      const groupedComments = commentsList.reduce((acc, comment) => {
        if (!comment.parentCommentId) {
          // This is a parent comment
          comment.replies = commentsList.filter(
            reply => reply.parentCommentId === comment.id
          ).sort((a, b) => a.timestamp - b.timestamp);
          acc.push(comment);
        }
        return acc;
      }, []);

      setComments(groupedComments);
    });

    // Fetch all users involved in the project
    const fetchProjectUsers = async () => {
      try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        const projectData = projectDoc.data();
        
        const usersSet = new Set();
        
        // Add assigned developers
        if (projectData.assignedDevelopers) {
          for (const dev of projectData.assignedDevelopers) {
            const userDoc = await getDoc(doc(db, 'users', dev.userId));
            if (userDoc.exists()) {
              usersSet.add({
                id: dev.userId,
                name: userDoc.data().displayName,
                avatar: userDoc.data().photoURL
              });
            }
          }
        }

        // Add organization owner
        const orgDoc = await getDoc(doc(db, 'users', projectData.organizationId));
        if (orgDoc.exists()) {
          usersSet.add({
            id: projectData.organizationId,
            name: orgDoc.data().displayName,
            avatar: orgDoc.data().photoURL
          });
        }

        setProjectUsers(Array.from(usersSet));
      } catch (error) {
        console.error('Error fetching project users:', error);
      }
    };

    fetchProjectUsers();

    return () => unsubscribe();
  }, [projectId]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCommentChange = (e) => {
    const text = e.target.value;
    setNewComment(text);

    // Check for @ mentions
    const lastAtSymbol = text.lastIndexOf('@');
    if (lastAtSymbol !== -1 && lastAtSymbol >= text.lastIndexOf(' ')) {
      setShowUserList(true);
      setCursorPosition(e.target.selectionStart);
    } else {
      setShowUserList(false);
    }
  };

  const handleUserMention = (selectedUser) => {
    const beforeMention = newComment.substring(0, newComment.lastIndexOf('@'));
    const afterMention = newComment.substring(cursorPosition);
    const updatedComment = `${beforeMention}@${selectedUser.name} ${afterMention}`;
    
    setNewComment(updatedComment);
    setShowUserList(false);
    setMentionedUsers([...mentionedUsers, selectedUser]);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const commentData = {
        projectId,
        userId: user.uid,
        userName: user.displayName,
        userAvatar: user.photoURL,
        content: newComment.trim(),
        timestamp: serverTimestamp(),
        mentionedUsers: mentionedUsers.map(u => u.id)
      };

      await addDoc(collection(db, 'projectComments'), commentData);

      // Update notification to include tab parameter
      await sendNotification({
        userId: organizationId,
        type: 'new_comment',
        message: `${user.displayName} commented on your project`,
        projectId,
        senderName: user.displayName,
        additionalData: { tab: 'comments' }  // Add tab information
      });

      // Notify mentioned users with tab parameter
      for (const mentionedUser of mentionedUsers) {
        if (mentionedUser.id !== organizationId) {
          await sendNotification({
            userId: mentionedUser.id,
            type: 'mention',
            message: `${user.displayName} mentioned you in a comment`,
            projectId,
            senderName: user.displayName,
            additionalData: { tab: 'comments' }  // Add tab information
          });
        }
      }

      setNewComment('');
      setMentionedUsers([]);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (parentComment) => {
    if (!replyText.trim()) return;

    setLoading(true);
    try {
      const replyData = {
        projectId,
        userId: user.uid,
        userName: user.displayName,
        userAvatar: user.photoURL,
        content: replyText.trim(),
        timestamp: serverTimestamp(),
        mentionedUsers: mentionedUsers.map(u => u.id),
        parentCommentId: parentComment.id,
        replyToUser: parentComment.userName
      };

      await addDoc(collection(db, 'projectComments'), replyData);

      // Notify the parent comment author
      if (parentComment.userId !== user.uid) {
        await sendNotification({
          userId: parentComment.userId,
          type: 'comment_reply',
          message: `${user.displayName} replied to your comment`,
          projectId,
          senderName: user.displayName
        });
      }

      setReplyText('');
      setReplyingTo(null);
      setMentionedUsers([]);
    } catch (error) {
      console.error('Error adding reply:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId) => {
    navigate(`/user/${userId}`);
  };

  const renderCommentContent = (content, mentionedUsers) => {
    if (!mentionedUsers) return content;

    let renderedContent = content;
    projectUsers.forEach(user => {
      const mention = `@${user.name}`;
      if (content.includes(mention)) {
        renderedContent = renderedContent.replace(
          mention,
          `<span class="text-blue-600 font-medium">${mention}</span>`
        );
      }
    });

    return (
      <p 
        className="mt-1 text-gray-700 whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />
    );
  };

  return (
    <div className="px-8 py-6">
      <div className="max-w-3xl mx-auto">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Discussion</h3>
        
        {/* Comment Form */}
        <form onSubmit={handleSubmitComment} className="mb-8 relative bg-white rounded-lg shadow-sm">
          <div className="relative">
            <textarea
              value={newComment}
              onChange={handleCommentChange}
              placeholder="Ask a question or start a discussion... Use @ to mention users"
              rows={3}
              className="w-full border border-gray-300 rounded-lg shadow-sm p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-shadow duration-200"
            />
            {loading && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                <LoadingSpinner size={24} />
              </div>
            )}
          </div>
          
          {/* User mention dropdown */}
          {showUserList && (
            <div className="absolute z-10 w-64 mt-1 bg-white rounded-lg shadow-xl border border-gray-100">
              {projectUsers.map((projectUser) => (
                <div
                  key={projectUser.id}
                  onClick={() => handleUserMention(projectUser)}
                  className="flex items-center px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors duration-150"
                >
                  <img
                    src={projectUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                    alt={projectUser.name}
                    className="h-8 w-8 rounded-full mr-3"
                  />
                  <span className="text-sm font-medium text-gray-700">{projectUser.name}</span>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                Tip: Use @ to mention project members
              </div>
              <button
                type="submit"
                disabled={loading || !newComment.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center">
                    <DotLottieReact
                      src="https://lottie.host/b322dc50-427f-40af-8420-99175a24803d/A3xbYuTK3w.lottie"
                      loop
                      autoplay
                      style={{ width: 24, height: 24, marginRight: 8 }}
                    />
                    Sending...
                  </span>
                ) : (
                  'Post Comment'
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-lg shadow-sm hover:shadow transition-shadow duration-200">
              <div className="p-4">
                <div className="flex items-start space-x-4">
                  <img
                    src={comment.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                    alt={comment.userName}
                    className="h-10 w-10 rounded-full ring-2 ring-white cursor-pointer hover:opacity-80 transition-opacity duration-200"
                    onClick={() => handleUserClick(comment.userId)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p 
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer transition-colors duration-150"
                        onClick={() => handleUserClick(comment.userId)}
                      >
                        {comment.userName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimestamp(comment.timestamp)}
                      </p>
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-700">
                      {renderCommentContent(comment.content, comment.mentionedUsers)}
                    </div>
                    
                    {/* Reply button */}
                    <div className="mt-3">
                      <button
                        onClick={() => setReplyingTo(comment)}
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors duration-150"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                        </svg>
                        Reply
                      </button>
                    </div>

                    {/* Reply form */}
                    {replyingTo?.id === comment.id && (
                      <div className="mt-3 bg-gray-50 rounded-lg p-3">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={`Reply to ${comment.userName}...`}
                          rows={2}
                          className="w-full border border-gray-300 rounded-md shadow-sm p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200"
                        />
                        <div className="mt-2 flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText('');
                            }}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleReply(comment)}
                            disabled={!replyText.trim() || loading}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                          >
                            {loading ? 'Sending...' : 'Reply'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-4 pl-4 border-l-2 border-gray-100">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="mb-3 last:mb-0">
                            <div className="flex items-start space-x-3">
                              <img
                                src={reply.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                alt={reply.userName}
                                className="h-8 w-8 rounded-full ring-2 ring-white cursor-pointer hover:opacity-80 transition-opacity duration-200"
                                onClick={() => handleUserClick(reply.userId)}
                              />
                              <div className="flex-1 min-w-0 bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <p 
                                    className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer transition-colors duration-150"
                                    onClick={() => handleUserClick(reply.userId)}
                                  >
                                    {reply.userName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatTimestamp(reply.timestamp)}
                                  </p>
                                </div>
                                <div className="prose prose-sm max-w-none text-gray-700">
                                  {renderCommentContent(reply.content, reply.mentionedUsers)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="mt-2 text-gray-500">No comments yet. Start the discussion!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectComments;