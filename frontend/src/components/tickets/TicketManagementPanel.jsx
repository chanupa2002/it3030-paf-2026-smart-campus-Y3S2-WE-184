import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CommentSection from "./CommentSection";

/* ─────────────────────────── constants ─────────────────────────── */

const STATUSES = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  REJECTED: "REJECTED",
  CLOSED: "CLOSED",
};

const STATUS_LABELS = {
  [STATUSES.OPEN]: "Open",
  [STATUSES.IN_PROGRESS]: "In Progress",
  [STATUSES.RESOLVED]: "Resolved",
  [STATUSES.REJECTED]: "Rejected",
  [STATUSES.CLOSED]: "Closed",
};

const TAB_TO_STATUS = {
  open: STATUSES.OPEN,
  "in-progress": STATUSES.IN_PROGRESS,
  resolved: STATUSES.RESOLVED,
  rejected: STATUSES.REJECTED,
  closed: STATUSES.CLOSED,
};

const VALID_TRANSITIONS = {
  [STATUSES.OPEN]: [STATUSES.IN_PROGRESS, STATUSES.REJECTED],
  [STATUSES.IN_PROGRESS]: [STATUSES.RESOLVED, STATUSES.REJECTED],
  [STATUSES.RESOLVED]: [STATUSES.CLOSED],
  [STATUSES.REJECTED]: [STATUSES.OPEN],
  [STATUSES.CLOSED]: [],
};

const ACTION_LABELS = {
  [STATUSES.REJECTED]: "Reject",
  [STATUSES.IN_PROGRESS]: "Start Progress",
  [STATUSES.RESOLVED]: "Mark as Resolved",
  [STATUSES.CLOSED]: "Close Ticket",
  [STATUSES.OPEN]: "Re-open",
};

/* ─────────────────────────── helpers ─────────────────────────── */

function formatDate(iso) {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(iso) {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleString([], { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ─────────────────── confirm modal ─────────────────── */

function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel, showResolutionInput, resolutionNotes, setResolutionNotes }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (open && !ref.current.open) ref.current.showModal();
    else if (!open && ref.current.open) ref.current.close();
  }, [open]);

  if (!open) return null;

  return (
    <dialog className="ticket-confirm-dialog" ref={ref} onCancel={onCancel}>
      <div className="ticket-confirm-body">
        <h4>{title}</h4>
        <p>{message}</p>

        {showResolutionInput && (
          <div className="raise-ticket-field" style={{ marginTop: '16px', textAlign: 'left' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '4px', display: 'block' }}>Resolution Notes</span>
            <textarea
              className="raise-ticket-textarea"
              placeholder="Explain how the issue was resolved..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              style={{ minHeight: '80px', width: '100%' }}
            />
          </div>
        )}

        <div className="ticket-confirm-actions">
          <button className="book-by-name-clear" onClick={onCancel} type="button">Cancel</button>
          <button
            className="primary-button ticket-confirm-yes"
            onClick={onConfirm}
            type="button"
            disabled={showResolutionInput && !resolutionNotes.trim()}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

/* ─────────────────── error modal ─────────────────── */

function ErrorModal({ open, title, message, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (open && !ref.current.open) ref.current.showModal();
    else if (!open && ref.current.open) ref.current.close();
  }, [open]);

  if (!open) return null;

  return (
    <dialog className="ticket-confirm-dialog" ref={ref} onCancel={onClose}>
      <div className="ticket-confirm-body" style={{ borderColor: 'var(--accent-red)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-red)', marginBottom: '16px' }}>
          <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h4 style={{ margin: 0, fontWeight: 700 }}>{title}</h4>
        </div>
        <p style={{ margin: 0, marginBottom: '24px', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {message}
        </p>
        <div className="ticket-confirm-actions">
          <button className="primary-button" onClick={onClose} type="button" style={{ backgroundColor: 'var(--accent-red)', float: 'right' }}>
            Dismiss
          </button>
        </div>
      </div>
    </dialog>
  );
}

/* ─────────────────────────── component ─────────────────────────── */

export default function TicketManagementPanel({ statusFilter, apiBaseUrl, token, user }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorDialog, setErrorDialog] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [assignState, setAssignState] = useState(null); // { ticketId }
  const [selectedTechId, setSelectedTechId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  const activeStatus = TAB_TO_STATUS[statusFilter] || STATUSES.OPEN;

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/tickets?status=${activeStatus}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Failed to fetch tickets");
      const data = await response.json();
      console.log('Fetched tickets:', data.content?.length || 0);
      if (data.content && data.content.length > 0) {
        console.log('First ticket attachments:', data.content[0].attachments);
      }
      setTickets(data.content || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, token, activeStatus]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (user?.roleName?.toLowerCase() === "admin") {
      const loadTechnicians = async () => {
        try {
          const response = await fetch(`${apiBaseUrl}/api/users`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (response.ok) {
            const data = await response.json();
            // Filter technicians (roleName is usually 'technician')
            setTechnicians(data.filter(u => u.roleName?.toLowerCase() === "technician"));
          }
        } catch (err) {
          console.error("Failed to fetch technicians:", err);
        }
      };
      loadTechnicians();
    }
  }, [apiBaseUrl, token, user]);

  const handleTransition = async () => {
    if (!confirmState) return;
    const { ticketId, nextStatus } = confirmState;

    try {
      let endpoint = `${apiBaseUrl}/api/tickets/${ticketId}/status`;
      let body = { status: nextStatus };

      if (nextStatus === STATUSES.RESOLVED) {
        endpoint = `${apiBaseUrl}/api/tickets/${ticketId}/resolve`;
        body = { resolutionNotes: resolutionNotes.trim() };
      }

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errMsg = "Failed to update ticket status";
        try {
          const errData = await response.json();
          if (errData.message) errMsg = errData.message;
          else if (errData.error) errMsg = errData.error;
          else if (typeof errData === "string") errMsg = errData;
          else if (errData.errors && Array.isArray(errData.errors)) {
            errMsg = Object.values(errData.errors).join(", ");
          }
        } catch (e) {
          // ignore
        }
        throw new Error(errMsg);
      }

      setConfirmState(null);
      setResolutionNotes("");
      fetchTickets();
    } catch (err) {
      setConfirmState(null);
      setErrorDialog({ title: "Action Failed", message: err.message });
    }
  };

  const handleAssign = async () => {
    if (!assignState || !selectedTechId) return;
    setAssignLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/tickets/${assignState.ticketId}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ assignedUserId: parseInt(selectedTechId) }),
      });

      if (!response.ok) throw new Error("Failed to assign technician");

      setAssignState(null);
      setSelectedTechId("");
      fetchTickets();
    } catch (err) {
      alert(err.message);
    } finally {
      setAssignLoading(false);
    }
  };

  const statusDescription = {
    [STATUSES.OPEN]: "Review newly raised tickets and decide whether to start progress or reject them.",
    [STATUSES.IN_PROGRESS]: "Active tickets currently being addressed by the assigned personnel.",
    [STATUSES.RESOLVED]: "Tickets that have been fixed. Pending final closure.",
    [STATUSES.REJECTED]: "Tickets that were not approved for work. Pending closure.",
    [STATUSES.CLOSED]: "Completed workflow history. No further actions allowed.",
  };

  if (loading && tickets.length === 0) {
    return <div className="availability-feedback availability-feedback-neutral">Loading tickets...</div>;
  }

  return (
    <div className="book-resource-panel-card book-by-name-card ticket-panel-fullbleed">
      <div className="book-by-name-header">
        <div>
          <h3>{STATUS_LABELS[activeStatus]} Tickets</h3>
          <p>{statusDescription[activeStatus]}</p>
        </div>
      </div>

      {error && <div className="raise-ticket-feedback error" style={{ marginBottom: '16px' }}>{error}</div>}

      {tickets.length > 0 ? (
        <div className="ticket-list-results">
          {tickets.map((ticket) => {
            const allowed = VALID_TRANSITIONS[ticket.status] || [];
            const isExpanded = expandedId === ticket.ticketId;
            const canManage = user?.roleName?.toLowerCase() === "admin" || user?.roleName?.toLowerCase() === "technician";

            return (
              <article className="availability-slot-card ticket-bar-card" key={ticket.ticketId}>
                <div className="ticket-bar-main">
                  <div className="ticket-bar-left">
                    <span className="availability-slot-card-label">{STATUS_LABELS[ticket.status]}</span>
                    <strong>#{ticket.ticketId}: {ticket.description?.substring(0, 40)}{ticket.description?.length > 40 ? '...' : ''}</strong>
                    <div style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>
                      Raised by {ticket.raisedUser?.name || "Unknown"}
                    </div>
                  </div>

                  <div className="ticket-bar-attributes">
                    <p><span>Incident:</span> {ticket.description}</p>
                    <div className="ticket-bar-meta-grid">
                      <p><span>Resource ID:</span> <strong>{ticket.resource?.resourceId || "N/A"}</strong></p>
                      <p><span>Contact:</span> {ticket.contactNumber || "N/A"}</p>
                      <p><span>Category:</span> {ticket.category || "General"}</p>
                      <p><span>Priority:</span> <span className={`ticket-priority-${(ticket.priority || "MEDIUM").toLowerCase()}`}>{ticket.priority || "MEDIUM"}</span></p>
                      <p><span>Created:</span> {formatDate(ticket.createdAt)}</p>
                      <p><span>Assigned:</span> {ticket.assignedUser?.name || "Unassigned"}</p>
                    </div>
                  </div>

                  <div className="ticket-bar-side-actions">
                    <button
                      className="ticket-expand-btn"
                      onClick={() => setExpandedId(isExpanded ? null : ticket.ticketId)}
                      type="button"
                    >
                      {isExpanded ? "Hide Details" : "View Details"}
                    </button>

                    <div className="ticket-bar-workflow-actions">
                      {/* Admin Specific Actions: Assign & Reject */}
                      {user?.roleName?.toLowerCase() === "admin" && ticket.status === STATUSES.OPEN && (
                        <>
                          <button
                            className={`book-by-name-clear ticket-action-btn-assign`}
                            onClick={() => setAssignState({ ticketId: ticket.ticketId })}
                            type="button"
                            disabled={!!ticket.assignedUser}
                            style={{ opacity: ticket.assignedUser ? 0.6 : 1, cursor: ticket.assignedUser ? 'not-allowed' : 'pointer' }}
                          >
                            {ticket.assignedUser ? "Technician Assigned" : "Assign Technician"}
                          </button>
                          <button
                            className="book-by-name-clear ticket-action-btn-rejected"
                            onClick={() =>
                              setConfirmState({
                                ticketId: ticket.ticketId,
                                nextStatus: STATUSES.REJECTED,
                                title: "Confirm Rejection?",
                                message: `Are you sure you want to reject ticket #${ticket.ticketId}?`,
                              })
                            }
                            type="button"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {/* General Workflow Actions (Technician Only) */}
                      {user?.roleName?.toLowerCase() === "technician" && allowed.map((nextStatus) => {
                        if (nextStatus === STATUSES.REJECTED) return null;
                        return (
                          <button
                            key={nextStatus}
                            className={`book-by-name-clear ticket-action-btn-${(nextStatus || "").replace("_", "-").toLowerCase()}`}
                            onClick={() =>
                              setConfirmState({
                                ticketId: ticket.ticketId,
                                nextStatus,
                                title: `Confirm ${ACTION_LABELS[nextStatus]}?`,
                                message: `Are you sure you want to transition #${ticket.ticketId} to "${STATUS_LABELS[nextStatus]}"?`,
                              })
                            }
                            type="button"
                          >
                            {ACTION_LABELS[nextStatus]}
                          </button>
                        );
                      })}
                    </div>

                    {ticket.status === STATUSES.CLOSED && (
                      <p className="ticket-bar-final-msg">Workflow complete.</p>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="ticket-expanded-detail">
                    {/* Resolution Notes Section */}
                    {ticket.resolutionNotes && (
                      <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.15)' }}>
                        <span className="ticket-detail-label" style={{ color: '#16a34a' }}>Resolution Notes</span>
                        <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text)' }}>{ticket.resolutionNotes}</p>
                      </div>
                    )}

                    {/* Images Section */}
                    {ticket.attachments && ticket.attachments.length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <span className="ticket-detail-label">Attached Images</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
                          {ticket.attachments.map((file, idx) => {
                            const handleDownload = async (e) => {
                              e.preventDefault();
                              try {
                                console.log('Downloading from:', file.filePath);
                                
                                // Try direct download from Supabase signed URL
                                const response = await fetch(file.filePath);
                                
                                console.log('Response status:', response.status);
                                console.log('Response headers:', Object.fromEntries(response.headers.entries()));
                                
                                if (!response.ok) {
                                  const text = await response.text();
                                  console.error('Error response:', text.substring(0, 500));
                                  throw new Error(`Download failed: ${response.status}`);
                                }
                                
                                const blob = await response.blob();
                                console.log('Blob size:', blob.size, 'type:', blob.type);
                                
                                // Check if blob is actually an image
                                if (blob.size < 100 || !blob.type.startsWith('image/')) {
                                  console.error('Invalid blob - might be HTML error page');
                                  const text = await blob.text();
                                  console.error('Blob content:', text.substring(0, 500));
                                  throw new Error('Downloaded file is not a valid image');
                                }
                                
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = file.fileName || 'attachment.png';
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                                console.log('Download completed');
                              } catch (err) {
                                console.error('Download error:', err);
                                alert(`Failed to download image: ${err.message}`);
                              }
                            };
                            return (
                              <div key={idx} style={{ width: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--line)', background: '#f8fafc' }}>
                                <div style={{ width: '120px', height: '90px', position: 'relative' }}>
                                  <img
                                    src={file.filePath}
                                    alt={file.fileName}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { 
                                      console.log('Image load failed, trying direct URL:', file.filePath);
                                      e.target.src = 'https://placehold.co/120x90?text=No+Preview'; 
                                    }}
                                  />
                                </div>
                                <button
                                  onClick={handleDownload}
                                  style={{ 
                                    display: 'block', 
                                    width: '100%',
                                    padding: '8px 12px', 
                                    fontSize: '0.75rem', 
                                    textAlign: 'center', 
                                    background: '#3b82f6', 
                                    color: '#ffffff', 
                                    border: 'none',
                                    fontWeight: 600,
                                    borderRadius: '0 0 8px 8px',
                                    transition: 'background 0.2s',
                                    cursor: 'pointer'
                                  }}
                                  onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                                  onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
                                >
                                  📥 Download
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <span className="ticket-detail-label">Status History</span>
                    <div className="ticket-history-list">
                      {/* In a real implementation, history might come from a separate comments/audit log. 
                           For now, we'll show a basic created-at entry since mapToResponse builds it from entity fields. */}
                      <div className="ticket-history-row">
                        <span className="ticket-history-status">OPEN</span>
                        <span className="ticket-history-time">{formatDateTime(ticket.createdAt)}</span>
                        <span className="ticket-history-note">Ticket raised in the system.</span>
                      </div>
                      {ticket.resolutionNotes && (
                        <div className="ticket-history-row">
                          <span className="ticket-history-status">RESOLVED</span>
                          <span className="ticket-history-time">{formatDateTime(ticket.createdAt)}</span>
                          <span className="ticket-history-note">Resolved with notes: {ticket.resolutionNotes.substring(0, 50)}...</span>
                        </div>
                      )}
                    </div>

                    <CommentSection 
                      ticketId={ticket.ticketId} 
                      apiBaseUrl={apiBaseUrl} 
                      token={token} 
                      currentUser={user} 
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="availability-feedback availability-feedback-neutral">
          No {STATUS_LABELS[activeStatus].toLowerCase()} tickets found.
        </div>
      )}

      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.title || ""}
        message={confirmState?.message || ""}
        confirmLabel={confirmState ? ACTION_LABELS[confirmState.nextStatus] : "Confirm"}
        showResolutionInput={confirmState?.nextStatus === STATUSES.RESOLVED}
        resolutionNotes={resolutionNotes}
        setResolutionNotes={setResolutionNotes}
        onConfirm={handleTransition}
        onCancel={() => {
          setConfirmState(null);
          setResolutionNotes("");
        }}
      />

      <ErrorModal
        open={!!errorDialog}
        title={errorDialog?.title || "Error"}
        message={errorDialog?.message || ""}
        onClose={() => setErrorDialog(null)}
      />

      {/* Assign Technician Modal */}
      {assignState && (
        <div className="modal-backdrop">
          <div aria-labelledby="assign-technician-title" aria-modal="true" className="modal-card" role="dialog">
            <button className="modal-close" onClick={() => setAssignState(null)} type="button">
              <span aria-hidden="true">x</span>
            </button>

            <div className="modal-header">
              <h3 id="assign-technician-title">Assign Technician</h3>
              <p>Select a technician to handle ticket #{assignState.ticketId}.</p>
            </div>

            <div className="modal-form-grid" style={{ marginBottom: "24px" }}>
              <label className="modal-field modal-field-full">
                <span>Available Personnel</span>
                <select
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                >
                  <option value="">-- Choose a Technician --</option>
                  {technicians.map(tech => (
                    <option key={tech.userId} value={tech.userId}>
                      {tech.name} ({tech.email})
                    </option>
                  ))}
                  {technicians.length === 0 && (
                    <option disabled>No technicians found in system</option>
                  )}
                </select>
              </label>
            </div>

            <div className="modal-actions">
              <button className="modal-secondary-button" onClick={() => setAssignState(null)} type="button">
                Cancel
              </button>
              <button
                className="modal-primary-button"
                onClick={handleAssign}
                type="button"
                disabled={!selectedTechId || assignLoading}
              >
                {assignLoading ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
