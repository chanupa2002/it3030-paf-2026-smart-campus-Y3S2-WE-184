import { useEffect, useMemo, useState } from "react";

const DEFAULT_FILTER_DATE = getLocalDateInputValue();

export default function CancelledBookingsPanel({ apiBaseUrl, token, userId }) {
  const [filterDate, setFilterDate] = useState(DEFAULT_FILTER_DATE);
  const [cancelledBookings, setCancelledBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const visibleBookings = useMemo(
    () =>
      cancelledBookings.filter((booking) => {
        const matchesUser = !userId || booking.user_id === userId;
        const matchesDate = !filterDate || booking.date === filterDate;
        return matchesUser && matchesDate;
      }),
    [cancelledBookings, filterDate, userId]
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadCancelledBookings() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${apiBaseUrl}/api/bookings/ViewCancelledBookings`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(resolveMessage(payload));
        }

        setCancelledBookings(Array.isArray(payload) ? payload : []);
      } catch (requestError) {
        if (requestError.name === "AbortError") return;
        setCancelledBookings([]);
        setError(requestError.message || "Unable to load cancelled bookings right now.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadCancelledBookings();
    return () => controller.abort();
  }, [apiBaseUrl, token]);

  return (
    <div className="book-resource-panel-card book-by-name-card">
      <div className="book-by-name-header">
        <div>
          <h3>Cancelled Bookings</h3>
          <p>Review your cancelled bookings and filter them by booking date.</p>
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
      </div>

      {loading ? (
        <div className="availability-feedback availability-feedback-neutral">Loading cancelled bookings...</div>
      ) : visibleBookings.length > 0 ? (
        <div className="availability-slot-results">
          {visibleBookings.map((booking) => (
            <article className="availability-slot-card" key={booking.booking_group_id ?? booking.booking_ids?.join("-")}>
              <span className="availability-slot-card-label">Cancelled</span>
              <strong>Booking Group #{booking.booking_group_id ?? "N/A"}</strong>
              <p>Purpose: {booking.purpose || "Not provided"}</p>
              <p>Date: {formatBookingDate(booking.date)}</p>
              <p>Created: {formatCreatedAt(booking.created_at)}</p>
              <p>Attendees: {booking.attendees ?? "N/A"}</p>
              <p>Resource: {booking.resource_name || `Resource #${booking.resource_id ?? "N/A"}`}</p>
              <p>Slots: {formatIds(booking.slots)}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="availability-feedback availability-feedback-neutral">
          No cancelled bookings were found for this user on the selected booking date.
        </div>
      )}
    </div>
  );
}

function formatBookingDate(value) {
  if (!value) return "No date selected";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function formatCreatedAt(value) {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString([], { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
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
