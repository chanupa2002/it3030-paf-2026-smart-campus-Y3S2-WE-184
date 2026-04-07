import { useEffect, useMemo, useState } from "react";

const DEFAULT_FILTER_DATE = getLocalDateInputValue();

export default function PendingBookingsPanel({ apiBaseUrl, token, userId }) {
  const [filterDate, setFilterDate] = useState(DEFAULT_FILTER_DATE);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const visibleBookings = useMemo(
    () => pendingBookings.filter((booking) => !userId || booking.user_id === userId),
    [pendingBookings, userId]
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadPendingBookings() {
      setLoading(true);
      setError("");
      setNotice("");

      try {
        const params = new URLSearchParams({ created_date: filterDate });
        const response = await fetch(`${apiBaseUrl}/api/bookings/ViewPendingBookings?${params.toString()}`, {
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
  }, [apiBaseUrl, filterDate, token]);

  const handleCancelClick = (bookingGroupId) => {
    setNotice(
      `Cancel action is not connected yet for booking group #${bookingGroupId} because the backend does not expose a cancel booking endpoint yet.`
    );
  };

  return (
    <div className="book-resource-panel-card book-by-name-card">
      <div className="book-by-name-header">
        <div>
          <h3>Pending Bookings</h3>
          <p>Review your pending booking requests for a selected created date.</p>
        </div>
      </div>

      <div className="availability-search-shell">
        <div className="availability-search-grid">
          <label className="availability-field">
            <span>Created Date</span>
            <input
              max={DEFAULT_FILTER_DATE}
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
          {visibleBookings.map((booking) => (
            <article className="availability-slot-card" key={booking.booking_group_id ?? booking.booking_ids?.join("-")}>
              <span className="availability-slot-card-label">Pending</span>
              <strong>Booking Group #{booking.booking_group_id ?? "N/A"}</strong>
              <p>Purpose: {booking.purpose || "Not provided"}</p>
              <p>Date: {formatBookingDate(booking.date)}</p>
              <p>Created: {formatCreatedAt(booking.created_at)}</p>
              <p>Attendees: {booking.attendees ?? "N/A"}</p>
              <p>Resource ID: {booking.resource_id ?? "N/A"}</p>
              <p>Slots: {formatIds(booking.slots)}</p>
              <button className="book-by-name-clear" onClick={() => handleCancelClick(booking.booking_group_id)} type="button">
                Cancel
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="availability-feedback availability-feedback-neutral">
          No pending bookings were found for this user on the selected date.
        </div>
      )}
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
