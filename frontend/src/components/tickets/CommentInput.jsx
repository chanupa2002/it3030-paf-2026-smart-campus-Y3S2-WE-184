import { useState } from "react";

/**
 * Reusable input for adding or editing comments.
 */
export default function CommentInput({ 
  initialValue = "", 
  placeholder = "Write a comment...", 
  submitLabel = "Post", 
  onSubmit, 
  onCancel,
  loading = false 
}) {
  const [text, setText] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    onSubmit(text.trim());
    if (!initialValue) setText(""); // Only clear if it's a new comment input
  };

  return (
    <form className="comment-input-form" onSubmit={handleSubmit}>
      <textarea
        className="comment-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        disabled={loading}
      />
      <div className="comment-input-actions">
        {onCancel && (
          <button 
            type="button" 
            className="comment-button comment-button-secondary" 
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
        )}
        <button 
          type="submit" 
          className="comment-button comment-button-primary" 
          disabled={!text.trim() || loading}
        >
          {loading ? "..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
