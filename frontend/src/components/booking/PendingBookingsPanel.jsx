import { useEffect, useMemo, useState } from "react";

const DEFAULT_FILTER_DATE = getLocalDateInputValue();

export default function PendingBookingsPanel({ apiBaseUrl, token, userId }) {
  const [filterDate, setFilterDate] = useState(DEFAULT_FILTER_DATE);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  const visibleBookings = useMemo(
    () =>
      pendingBookings.filter((booking) => {
        const matchesUser = !userId || Number(booking.user_id) === Number(userId);
        const matchesDate = !filterDate || booking.date === filterDate;
        return matchesUser && matchesDate;
      }),
    [filterDate, pendingBookings, userId]
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

  const handleCancelClick = (bookingGroupId) => {
    if (!userId) {
      setNotice("Unable to identify the logged-in user for cancellation.");
      return;
    }

    const target = pendingBookings.find((booking) => booking.booking_group_id === bookingGroupId) || null;
    setCancelTarget(target);
    setNotice("");
    setError("");
    setActionError("");
  };

  const cancelBookingGroup = async (bookingGroupId) => {
    console.log("Cancel clicked:", bookingGroupId);
    setNotice("");
    setError("");
    setActionError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/bookings/cancelBooking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          booking_group_id: bookingGroupId,
          user_id: userId,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(resolveMessage(payload));
      }

      setPendingBookings((current) =>
        current.filter((booking) => booking.booking_group_id !== bookingGroupId)
      );
      setNotice(payload?.message || `Booking group #${bookingGroupId} was cancelled successfully.`);
      setCancelTarget(null);
    } catch (requestError) {
      setActionError(requestError.message || "Unable to cancel this booking group right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeCancelModal = () => {
    if (isSubmitting) return;
    setCancelTarget(null);
    setActionError("");
  };

  return (
    <div className="book-resource-panel-card book-by-name-card">
      <div className="book-by-name-header">
        <div>
          <h3>Pending Bookings</h3>
          <p>Review your pending booking requests and filter them by booking date.</p>
        </div>
      </div>

      <div className="availability-search-shell">
        <div className="availability-search-grid">
          <label className="availability-field">
            <span>Booking Date</span>
            <input
              onChange={(event) => setFilterDate(event.target.value)}
              type="date"
              value={filterDate}
            />
          </label>
        </div>

        {error ? <div className="availability-feedback availability-feedback-error">{error}</div> : null}
        {notice ? <div className="availability-feedback availability-feedback-neutral">{notice}</div> : null}
      </div>

      {loading ? (
        <div className="availability-feedback availability-feedback-neutral">Loading pending bookings...</div>
      ) : visibleBookings.length > 0 ? (
        <div className="availability-slot-results">
          {visibleBookings.map((booking) => {
            const cancellationLocked = isCancellationLocked(booking.date);

            return (
              <article
                className={`availability-slot-card ${cancellationLocked ? "availability-slot-card-disabled" : ""}`}
                key={booking.booking_group_id ?? booking.booking_ids?.join("-")}
              >
                <span className="availability-slot-card-label">{cancellationLocked ? "Locked" : "Pending"}</span>
                <strong>Booking Group #{booking.booking_group_id ?? "N/A"}</strong>
                <p>Purpose: {booking.purpose || "Not provided"}</p>
                <p>Date: {formatBookingDate(booking.date)}</p>
                <p>Created: {formatCreatedAt(booking.created_at)}</p>
                <p>Attendees: {booking.attendees ?? "N/A"}</p>
                <p>Resource: {booking.resource_name || `Resource #${booking.resource_id ?? "N/A"}`}</p>
                <p>Slots: {formatIds(booking.slots)}</p>
                {cancellationLocked ? (
                  <p>Cancellation is only allowed more than 48 hours before the booking date.</p>
                ) : null}
                <button
                  className={`book-by-name-clear ${cancellationLocked ? "book-by-name-clear-disabled" : ""}`}
                  disabled={cancellationLocked}
                  onClick={() => handleCancelClick(booking.booking_group_id)}
                  type="button"
                >
                  Cancel
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="availability-feedback availability-feedback-neutral">
          No pending bookings were found for this user on the selected booking date.
        </div>
      )}

      {cancelTarget ? (
        <div className="modal-backdrop">
          <div aria-labelledby="cancel-booking-title" aria-modal="true" className="modal-card modal-card-confirm" role="dialog">
            <div className="modal-header">
              <h3 id="cancel-booking-title">Cancel Booking Group</h3>
              <p>Do you want to cancel booking group #{cancelTarget.booking_group_id}?</p>
            </div>
            <div className="booking-admin-summary">
              <p>Resource: {cancelTarget.resource_name || `Resource #${cancelTarget.resource_id ?? "N/A"}`}</p>
              <p>Date: {formatBookingDate(cancelTarget.date)}</p>
              <p>Slots: {formatIds(cancelTarget.slots)}</p>
            </div>
            {actionError ? <div className="modal-inline-error">{actionError}</div> : null}
            <div className="modal-actions">
              <button className="modal-secondary-button" disabled={isSubmitting} onClick={closeCancelModal} type="button">
                Keep Booking
              </button>
              <button
                className="modal-primary-button"
                disabled={isSubmitting}
                onClick={() => cancelBookingGroup(cancelTarget.booking_group_id)}
                type="button"
              >
                {isSubmitting ? "Cancelling..." : "Yes, Cancel"}
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

function isCancellationLocked(value) {
  if (!value) return false;
  const bookingDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(bookingDate.getTime())) return false;

  const cancellationDeadline = new Date(bookingDate);
  cancellationDeadline.setHours(cancellationDeadline.getHours() - 48);

  return new Date() >= cancellationDeadline;
}

function resolveMessage(payload) {
  const message = payload?.message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string" && message.trim()) return message;
  return "Unable to complete the request right now.";
}

