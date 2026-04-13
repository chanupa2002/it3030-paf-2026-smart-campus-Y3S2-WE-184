import { useState } from "react";
import CommentInput from "./CommentInput";

/**
 * Displays a single comment with role badges and inline editing.
 */
export default function CommentItem({ comment, currentUser, onUpdate, loadingUpdateId }) {
  const [isEditing, setIsEditing] = useState(false);
  
  // Get current user ID with fallback
  const currentUserId = currentUser?.userId || currentUser?.id;
  // Get comment author user ID
  const commentAuthorId = comment.user?.userId;
  
  // Check if current user owns this comment
  const isOwner = currentUserId && commentAuthorId && currentUserId === commentAuthorId;
  const isUpdating = loadingUpdateId === comment.commentId;

  const handleUpdate = (newText) => {
    onUpdate(comment.commentId, newText, () => setIsEditing(false));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Unknown date";
    return new Date(dateStr).toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getRoleName = (roleName) => {
    if (!roleName) return "User";
    if (roleName === "ADMIN") return "Admin";
    if (roleName === "TECHNICIAN") return "Technician";
    return "User";
  };

  return (
    <div className={`comment-item ${isOwner ? "comment-item-owner" : "comment-item-other"}`}>
      {isEditing ? (
        <div className="comment-edit-wrapper">
          <CommentInput
            initialValue={comment.comment}
            submitLabel="Save"
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            loading={isUpdating}
          />
        </div>
      ) : (
        <div className="comment-bubble-wrapper">
          <div className="comment-bubble">
            {!isOwner && (
              <div className="comment-header">
                <span className="comment-username">{comment.user?.name || "Anonymous"}</span>
                <span className={`comment-role-badge role-${(comment.user?.roleName || "USER").toLowerCase()}`}>
                  {getRoleName(comment.user?.roleName)}
                </span>
              </div>
            )}
            <p className="comment-text">{comment.comment}</p>
            <div className="comment-footer">
              <span className="comment-timestamp">{formatDate(comment.createdAt)}</span>
              {comment.isEdited && <span className="comment-edited-label">(edited)</span>}
            </div>
          </div>
          {isOwner && !isEditing && (
            <button 
              className="comment-edit-btn" 
              onClick={() => setIsEditing(true)}
              type="button"
              title="Edit comment"
            >
              ✎
            </button>
          )}
        </div>
      )}
    </div>
  );
}
