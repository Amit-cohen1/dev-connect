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
  serverTimestamp 
} from 'firebase/firestore';
import { sendNotification } from '../utils/notifications';

const ProjectComments = ({ projectId, organizationId }) => {
  const { user } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

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
      setComments(commentsList);
    });

    return () => unsubscribe();
  }, [projectId]);

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
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'projectComments'), commentData);

      // Notify organization
      await sendNotification({
        userId: organizationId,
        type: 'new_comment',
        message: `${user.displayName} commented on your project`,
        projectId,
        senderName: user.displayName
      });

      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Discussion</h3>
      
      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Ask a question or start a discussion..."
          rows={3}
          className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
        />
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
          <div key={comment.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start space-x-3">
              <img
                src={comment.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                alt={comment.userName}
                className="h-10 w-10 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {comment.userName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {comment.timestamp?.toDate().toLocaleDateString()}
                  </p>
                </div>
                <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                  {comment.content}
                </p>
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