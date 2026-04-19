import { useEffect, useState, useCallback } from "react";
import CommentList from "./CommentList";
import CommentInput from "./CommentInput";

/**
 * Main wrapper for the comment system. 
 * Handles fetching, adding, and updating comments.
 */
export default function CommentSection({ ticketId, apiBaseUrl, token, currentUser }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingUpdateId, setLoadingUpdateId] = useState(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/tickets/${ticketId}/comments?pageNumber=0&pageSize=100`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Could not load comments");
      const data = await response.json();
      // Backend returns DESC (newest first), reverse to show oldest first
      const comments = (data.content || []);
      const sorted = comments.length > 0 ? comments.reverse() : [];
      setComments(sorted);
    } catch (err) {
      setError(err.message);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, ticketId, token]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = async (message) => {
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ comment: message }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to add comment");
      }
      
      // Refresh list to show new comment with full data from backend
      await fetchComments();
    } catch (err) {
      setError(err.message || "Error adding comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId, nextMessage, onSuccess) => {
    setLoadingUpdateId(commentId);
    try {
      const response = await fetch(`${apiBaseUrl}/api/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ comment: nextMessage }),
      });
      if (!response.ok) throw new Error("Failed to update comment");
      
      const updated = await response.json();
      // Update the comment in the local state with the new message and mark as edited
      setComments(prev => prev.map(c => 
        c.commentId === commentId 
          ? { ...c, comment: updated.comment || nextMessage, isEdited: true } 
          : c
      ));
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to update comment");
    } finally {
      setLoadingUpdateId(null);
    }
  };

  return (
    <section className="comment-section-wrapper">
      <div className="comment-section-header">
        <h4>Discussion</h4>
        <span className="comment-count-badge">{comments.length}</span>
      </div>

      <div className="comment-list-container">
        {loading && comments.length === 0 ? (
          <div className="comment-loading">Loading discussion...</div>
        ) : error ? (
          <div className="comment-error">{error}</div>
        ) : (
          <CommentList 
            comments={comments} 
            currentUser={currentUser} 
            onUpdate={handleUpdateComment}
            loadingUpdateId={loadingUpdateId}
          />
        )}
      </div>

      <div className="comment-input-container">
        <CommentInput 
          onSubmit={handleAddComment} 
          loading={isSubmitting} 
          placeholder="Add to the discussion..."
        />
      </div>
    </section>
  );
}
