import { useState, useEffect, useRef } from "react";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];
const CATEGORIES = ["Hardware", "Facilities", "IT Support", "Maintenance", "Infrastructure", "Other"];

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

export default function RaiseTicketPanel({ apiBaseUrl, token, userId }) {
  const [resources, setResources] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [category, setCategory] = useState("Facilities");
  const [contactNumber, setContactNumber] = useState("");
  const [attachments, setAttachments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [fetchingResources, setFetchingResources] = useState(false);
  const [errorDialog, setErrorDialog] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const normalizedContactNumber = contactNumber.replace(/\D/g, "");

  // Fetch resources on load to populate the dropdown
  useEffect(() => {
    const fetchResources = async () => {
      setFetchingResources(true);
      try {
        const response = await fetch(`${apiBaseUrl}/api/facilities`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Error ${response.status}: Failed to load campus resources.`);
        }
        const data = await response.json();
        console.log("Fetched resources:", data); // Debug log
        setResources(data || []);
      } catch (err) {
        console.error("Resource fetch error:", err);
        setErrorDialog({ title: "Connection Failed", message: `${err.message}. Please check if the backend is running.` });
      } finally {
        setFetchingResources(false);
      }
    };

    if (apiBaseUrl !== undefined) {
      fetchResources();
    }
  }, [apiBaseUrl, token]);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (attachments.length + files.length > 3) {
      setErrorDialog({
        title: "Maximum Attachment Limit Reached",
        message: "We currently limit each ticket to a maximum of 3 supporting images. Please select only the most relevant photos."
      });
      return;
    }
    setAttachments((prev) => [...prev, ...files].slice(0, 3));
  };

  const removeAttachment = (index) => {
    setAttachments((current) => current.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage("");

    if (!selectedResourceId) {
      setErrorDialog({ title: "Validation Error", message: "Please select a campus resource." });
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setErrorDialog({ title: "Validation Error", message: "Description must be at least 10 characters." });
      return;
    }

    if (!userId) {
      setErrorDialog({ title: "Authentication Error", message: "Unable to identify the logged-in user." });
      return;
    }

    if (normalizedContactNumber && !/^\d{10}$/.test(normalizedContactNumber)) {
      setErrorDialog({ title: "Validation Error", message: "Contact number must be exactly 10 digits." });
      return;
    }

    if (attachments.length > 3) {
      setErrorDialog({
        title: "Maximum Attachment Limit Reached",
        message: "To ensure fast processing times, we currently limit each ticket to a maximum of 3 supporting images. Please select only the most relevant photos."
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      const ticketData = {
        resourceId: parseInt(selectedResourceId),
        description: description.trim(),
        priority: priority,
        contactNumber: normalizedContactNumber,
        category: category
      };

      formData.append("ticket", JSON.stringify(ticketData));

      attachments.forEach((file) => {
        formData.append("file", file);
      });

      const response = await fetch(`${apiBaseUrl}/api/tickets`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        let errMsg = "Unable to raise ticket.";
        if (payload?.message) errMsg = payload.message;
        else if (payload?.error) errMsg = payload.error;
        else if (typeof payload === "string") errMsg = payload;

        throw new Error(errMsg);
      }

      setSuccessMessage("Ticket raised successfully! You can track its status in the 'My Tickets' section.");

      setSelectedResourceId("");
      setDescription("");
      setContactNumber("");
      setAttachments([]);
      setPriority("MEDIUM");
      setCategory("Facilities");
    } catch (err) {
      setErrorDialog({ title: "Ticket Creation Failed", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const priorityLabels = {
    LOW: "Low - Routine Maintenance",
    MEDIUM: "Medium - Operational Impact",
    HIGH: "High - Urgent / Critical",
  };

  return (
    <div className="raise-ticket-panel">
      <div className="raise-ticket-header">
        <h3>Raise a Ticket</h3>
        <p>Report issues with campus facilities, hardware, or IT services.</p>

      </div>

      <div className="raise-ticket-status" style={{ marginTop: '16px' }}>
        {successMessage && <div className="success-alert">{successMessage}</div>}
      </div>

      <form className="raise-ticket-form" onSubmit={handleSubmit}>
        <div className="raise-ticket-fields">

          <div className="raise-ticket-meta-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
            <label className="field raise-ticket-field">
              <span>Campus Resource</span>
              <select
                className="raise-ticket-select"
                value={selectedResourceId}
                onChange={(e) => setSelectedResourceId(e.target.value)}
                disabled={loading || fetchingResources}
                required
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--input)', color: 'var(--text)' }}
              >
                <option value="">{fetchingResources ? "Fetching resources..." : resources.length === 0 ? "No resources found" : "Select Resource..."}</option>
                {resources.map((res) => (
                  <option key={res.id} value={res.id}>
                    [{res.type}] {res.name} {res.location ? `— ${res.location}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="field raise-ticket-field">
              <span>Category</span>
              <select
                className="raise-ticket-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loading}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--input)', color: 'var(--text)' }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="raise-ticket-meta-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
            <label className="field raise-ticket-field">
              <span>Importance / Priority</span>
              <select
                className="raise-ticket-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={loading}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--input)', color: 'var(--text)' }}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{priorityLabels[p]}</option>
                ))}
              </select>
            </label>

            <label className="field raise-ticket-field">
              <span>Contact Number</span>
              <input
                type="tel"
                placeholder="Enter your Contact Number"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                disabled={loading}
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--input)', color: 'var(--text)' }}
              />
            </label>
          </div>

          <label className="field raise-ticket-field">
            <span>Detailed Description</span>
            <textarea
              className="raise-ticket-textarea"
              placeholder="Please explain the issue or request in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              style={{ minHeight: '130px', resize: 'vertical' }}
            />
          </label>

          <label className="field raise-ticket-field">
            <span className="field-label-wrapper">
              <span>Supporting Photos</span>
              <span className="field-optional-tag">(Optional)</span>
            </span>

            <div className="raise-ticket-attachment-input-container">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                disabled={loading}
                className="raise-ticket-file-input"
              />
              <div className="raise-ticket-attachment-button">
                <svg className="attachment-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
                <span>Add photos of the issue</span>
              </div>
            </div>
          </label>

          {attachments.length > 0 && (
            <div className="raise-ticket-attachments-list">
              <span className="attachments-count">{attachments.length} file(s) selected</span>
              <ul className="attachments-items">
                {attachments.map((file, i) => (
                  <li key={i} className="attachment-item">
                    <span className="attachment-name">{file.name}</span>
                    <button type="button" className="attachment-remove" onClick={() => removeAttachment(i)} title="Remove file">✕</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {successMessage && <div className="raise-ticket-feedback success">{successMessage}</div>}

        <button type="submit" className="primary-button raise-ticket-submit" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
          {loading ? "Submitting Request..." : "Submit Ticket"}
        </button>
      </form>

      <ErrorModal
        open={!!errorDialog}
        title={errorDialog?.title || "Error"}
        message={errorDialog?.message || ""}
        onClose={() => setErrorDialog(null)}
      />
    </div>
  );
}