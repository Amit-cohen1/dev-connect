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
    <div className="mt-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Discussion</h3>
      
      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="mb-6 relative">
        <textarea
          value={newComment}
          onChange={handleCommentChange}
          placeholder="Ask a question or start a discussion... Use @ to mention users"
          rows={3}
          className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
        />
        
        {/* User mention dropdown */}
        {showUserList && (
          <div className="absolute z-10 w-64 mt-1 bg-white rounded-md shadow-lg">
            {projectUsers.map((projectUser) => (
              <div
                key={projectUser.id}
                onClick={() => handleUserMention(projectUser)}
                className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <img
                  src={projectUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                  alt={projectUser.name}
                  className="h-6 w-6 rounded-full mr-2"
                />
                <span>{projectUser.name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-white rounded-lg shadow p-4 hover:bg-gray-50 transition-colors duration-200">
            <div className="flex items-start space-x-3">
              <img
                src={comment.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                alt={comment.userName}
                className="h-10 w-10 rounded-full cursor-pointer"
                onClick={() => handleUserClick(comment.userId)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p 
                    className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer"
                    onClick={() => handleUserClick(comment.userId)}
                  >
                    {comment.userName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatTimestamp(comment.timestamp)}
                  </p>
                </div>
                {renderCommentContent(comment.content, comment.mentionedUsers)}
                
                {/* Reply button */}
                <div className="mt-2">
                  <button
                    onClick={() => setReplyingTo(comment)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Reply
                  </button>
                </div>

                {/* Reply form */}
                {replyingTo?.id === comment.id && (
                  <div className="mt-3">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${comment.userName}...`}
                      rows={2}
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="mt-2 flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText('');
                        }}
                        className="text-sm text-gray-600 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReply(comment)}
                        disabled={!replyText.trim() || loading}
                        className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loading ? 'Sending...' : 'Reply'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 space-y-4 pl-6 border-l-2 border-gray-100">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start space-x-3">
                          <img
                            src={reply.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                            alt={reply.userName}
                            className="h-8 w-8 rounded-full cursor-pointer"
                            onClick={() => handleUserClick(reply.userId)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p 
                                className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer"
                                onClick={() => handleUserClick(reply.userId)}
                              >
                                {reply.userName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatTimestamp(reply.timestamp)}
                              </p>
                            </div>
                            {renderCommentContent(reply.content, reply.mentionedUsers)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-center text-gray-500">
            No comments yet. Start the discussion!
          </p>
        )}
      </div>
    </div>
  );
};

export default ProjectComments;