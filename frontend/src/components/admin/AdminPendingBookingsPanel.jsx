import { useEffect, useMemo, useState } from "react";

const DEFAULT_FILTER_DATE = getLocalDateInputValue();

export default function AdminPendingBookingsPanel({ apiBaseUrl, token }) {
  const [filterDate, setFilterDate] = useState(DEFAULT_FILTER_DATE);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedBookings = useMemo(
    () =>
      [...pendingBookings].sort((left, right) => {
        const leftId = left.booking_group_id ?? 0;
        const rightId = right.booking_group_id ?? 0;
        return rightId - leftId;
      }),
    [pendingBookings]
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadPendingBookings() {
      setLoading(true);
      setError("");
      setNotice("");

      try {
        const response = await fetch(`${apiBaseUrl}/api/bookings/ViewPendingBookings`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(resolveMessage(payload));
        }

        setPendingBookings(Array.isArray(payload) ? payload : []);
      } catch (requestError) {
        if (requestError.name === "AbortError") return;
        setPendingBookings([]);
        setError(requestError.message || "Unable to load pending bookings right now.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadPendingBookings();
    return () => controller.abort();
  }, [apiBaseUrl, token]);

  const visibleBookings = useMemo(
    () => sortedBookings.filter((booking) => !filterDate || booking.date === filterDate),
    [filterDate, sortedBookings]
  );

  const closeApproveModal = () => {
    if (isSubmitting) return;
    setApproveTarget(null);
    setActionError("");
  };

  const closeRejectModal = () => {
    if (isSubmitting) return;
    setRejectTarget(null);
    setRejectReason("");
    setActionError("");
  };

  const approveBookingGroup = async () => {
    if (!approveTarget?.booking_group_id || !approveTarget?.user_id) return;

    setIsSubmitting(true);
    setActionError("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/bookings/approveBooking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          booking_group_id: approveTarget.booking_group_id,
          user_id: approveTarget.user_id,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(resolveMessage(payload));
      }

      setPendingBookings((current) =>
        current.filter((booking) => booking.booking_group_id !== approveTarget.booking_group_id)
      );
      setNotice(payload?.message || `Booking group #${approveTarget.booking_group_id} approved successfully.`);
      setApproveTarget(null);
    } catch (requestError) {
      setActionError(requestError.message || "Unable to approve this booking group right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const rejectBookingGroup = async () => {
    const trimmedReason = rejectReason.trim();

    if (!rejectTarget?.booking_group_id) return;
    if (!trimmedReason) {
      setActionError("Please enter a reason before rejecting this booking group.");
      return;
    }

    setIsSubmitting(true);
    setActionError("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/bookings/rejectBooking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          booking_group_id: rejectTarget.booking_group_id,
          reject_reason: trimmedReason,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(resolveMessage(payload));
      }

      setPendingBookings((current) =>
        current.filter((booking) => booking.booking_group_id !== rejectTarget.booking_group_id)
      );
      setNotice(payload?.message || `Booking group #${rejectTarget.booking_group_id} rejected successfully.`);
      setRejectTarget(null);
      setRejectReason("");
    } catch (requestError) {
      setActionError(requestError.message || "Unable to reject this booking group right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="book-resource-panel-card book-by-name-card">
      <div className="book-by-name-header">
        <div>
          <h3>Pending Booking Approvals</h3>
          <p>Review pending booking groups, approve them, or reject them with a reason.</p>
        </div>
      </div>

      <div className="availability-search-shell">
        <div className="availability-search-grid">
          <label className="availability-field">
            <span>Booking Date</span>
            <input onChange={(event) => setFilterDate(event.target.value)} type="date" value={filterDate} />
          </label>
        </div>

        {error ? <div className="availability-feedback availability-feedback-error">{error}</div> : null}
        {notice ? <div className="availability-feedback availability-feedback-neutral">{notice}</div> : null}
      </div>

      {loading ? (
        <div className="availability-feedback availability-feedback-neutral">Loading pending bookings...</div>
      ) : visibleBookings.length > 0 ? (
        <div className="availability-slot-results">
          {visibleBookings.map((booking) => (
            <article className="availability-slot-card" key={booking.booking_group_id ?? booking.booking_ids?.join("-")}>
              <span className="availability-slot-card-label">Pending</span>
              <strong>Booking Group #{booking.booking_group_id ?? "N/A"}</strong>
              <p>Purpose: {booking.purpose || "Not provided"}</p>
              <p>Date: {formatBookingDate(booking.date)}</p>
              <p>Created: {formatCreatedAt(booking.created_at)}</p>
              <p>Attendees: {booking.attendees ?? "N/A"}</p>
              <p>Resource: {booking.resource_name || `Resource #${booking.resource_id ?? "N/A"}`}</p>
              <p>User ID: {booking.user_id ?? "N/A"}</p>
              <p>Slots: {formatIds(booking.slots)}</p>
              <div className="booking-admin-actions">
                <button
                  className="booking-admin-primary"
                  onClick={() => {
                    setApproveTarget(booking);
                    setActionError("");
                  }}
                  type="button"
                >
                  Approve
                </button>
                <button
                  className="booking-admin-danger"
                  onClick={() => {
                    setRejectTarget(booking);
                    setActionError("");
                  }}
                  type="button"
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="availability-feedback availability-feedback-neutral">
          No pending bookings were found for the selected booking date.
        </div>
      )}

      {approveTarget ? (
        <div className="modal-backdrop">
          <div aria-labelledby="approve-booking-title" aria-modal="true" className="modal-card modal-card-confirm" role="dialog">
            <div className="modal-header">
              <h3 id="approve-booking-title">Approve Booking Group</h3>
              <p>Do you want to approve booking group #{approveTarget.booking_group_id}?</p>
            </div>
            <div className="booking-admin-summary">
              <p>Resource: {approveTarget.resource_name || `Resource #${approveTarget.resource_id ?? "N/A"}`}</p>
              <p>Date: {formatBookingDate(approveTarget.date)}</p>
              <p>Slots: {formatIds(approveTarget.slots)}</p>
            </div>
            {actionError ? <div className="modal-inline-error">{actionError}</div> : null}
            <div className="modal-actions">
              <button className="modal-secondary-button" disabled={isSubmitting} onClick={closeApproveModal} type="button">
                Cancel
              </button>
              <button className="modal-primary-button" disabled={isSubmitting} onClick={approveBookingGroup} type="button">
                {isSubmitting ? "Approving..." : "Yes, Approve"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {rejectTarget ? (
        <div className="modal-backdrop">
          <div aria-labelledby="reject-booking-title" aria-modal="true" className="modal-card" role="dialog">
            <div className="modal-header">
              <h3 id="reject-booking-title">Reject Booking Group</h3>
              <p>Do you want to reject booking group #{rejectTarget.booking_group_id}? Add the reason below.</p>
            </div>
            <div className="modal-form-grid">
              <label className="modal-field">
                <span>Date</span>
                <input readOnly type="text" value={formatBookingDate(rejectTarget.date)} />
              </label>
              <label className="modal-field">
                <span>Slots</span>
                <input readOnly type="text" value={formatIds(rejectTarget.slots)} />
              </label>
              <label className="modal-field modal-field-full">
                <span>Reject Reason</span>
                <input
                  maxLength={255}
                  onChange={(event) => setRejectReason(event.target.value)}
                  placeholder="Enter the reason for rejecting this booking group"
                  type="text"
                  value={rejectReason}
                />
              </label>
            </div>
            {actionError ? <div className="modal-inline-error">{actionError}</div> : null}
            <div className="modal-actions">
              <button className="modal-secondary-button" disabled={isSubmitting} onClick={closeRejectModal} type="button">
                Cancel
              </button>
              <button className="modal-primary-button" disabled={isSubmitting} onClick={rejectBookingGroup} type="button">
                {isSubmitting ? "Rejecting..." : "Yes, Reject"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatBookingDate(value) {
  if (!value) return "No date selected";

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCreatedAt(value) {
  if (!value) return "Unknown";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatIds(values) {
  if (!Array.isArray(values) || values.length === 0) return "N/A";
  return values.join(", ");
}

function getLocalDateInputValue() {
  const current = new Date();
  const year = current.getFullYear();
  const month = String(current.getMonth() + 1).padStart(2, "0");
  const day = String(current.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resolveMessage(payload) {
  const message = payload?.message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string" && message.trim()) return message;
  return "Unable to complete the request right now.";
}
