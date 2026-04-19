import CommentItem from "./CommentItem";

/**
 * Renders the collection of comments.
 */
export default function CommentList({ comments, currentUser, onUpdate, loadingUpdateId }) {
  if (comments.length === 0) {
    return (
      <div className="comments-empty">
        <p>No comments yet. Be the first to start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="comment-list">
      {comments.map((comment) => (
        <CommentItem 
          key={comment.commentId} 
          comment={comment} 
          currentUser={currentUser}
          onUpdate={onUpdate}
          loadingUpdateId={loadingUpdateId}
        />
      ))}
    </div>
  );
}
