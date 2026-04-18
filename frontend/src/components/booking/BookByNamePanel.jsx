import { useMemo, useState } from "react";

const BOOKING_SLOT_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const startHour = 8 + index;
  return {
    value: startHour,
    compactLabel: `${startHour}-${startHour + 1}`,
  };
});

const DEFAULT_BOOKING_DATE = getTomorrowDateInputValue();

export default function BookByNamePanel({ apiBaseUrl, token, userId, roleName }) {
  const [resourceName, setResourceName] = useState("");
  const [bookingDate, setBookingDate] = useState(DEFAULT_BOOKING_DATE);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [searchContext, setSearchContext] = useState(null);
  const [availabilityMatch, setAvailabilityMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [attendees, setAttendees] = useState("");
  const [purpose, setPurpose] = useState("");

  const selectedSlotLabels = useMemo(
    () =>
      BOOKING_SLOT_OPTIONS.filter((slot) => selectedSlots.includes(slot.value)).map((slot) => slot.compactLabel),
    [selectedSlots]
  );

  const toggleSlot = (slotValue) => {
    setSelectedSlots((current) =>
      current.includes(slotValue)
        ? current.filter((value) => value !== slotValue)
        : [...current, slotValue].sort((left, right) => left - right)
    );
  };

  const submitSearch = async (event) => {
    event.preventDefault();

    const trimmedName = resourceName.trim();
    if (!trimmedName) {
      setError("Enter a resource name before searching.");
      setSearchContext(null);
      setAvailableSlots([]);
      setSelectedSlots([]);
      setAvailabilityMatch(null);
      return;
    }

    if (!bookingDate) {
      setError("Select a date before searching.");
      setSearchContext(null);
      setAvailableSlots([]);
      setSelectedSlots([]);
      setAvailabilityMatch(null);
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");
    setBookingError("");
    setIsBookingDialogOpen(false);
    setAvailabilityMatch(null);

    try {
      const params = new URLSearchParams({
        name: trimmedName,
        roleName: roleName || "",
        date: bookingDate,
      });

      selectedSlots.forEach((slot) => {
        params.append("slots", String(slot));
      });

      const response = await fetch(`${apiBaseUrl}/api/bookings/checkAvailabilityByResourceName?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = await parseApiPayload(response);

      if (!response.ok) {
        throw new Error(resolveMessage(payload));
      }

      setSearchContext({
        resourceName: trimmedName,
        date: bookingDate,
      });
      setAvailabilityMatch(typeof payload === "boolean" ? payload : null);
      setAvailableSlots(Array.isArray(payload) ? payload : []);
    } catch (requestError) {
      setSearchContext(null);
      setAvailableSlots([]);
      setAvailabilityMatch(null);
      setError(requestError.message || "Unable to check availability right now.");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setResourceName("");
    setBookingDate(DEFAULT_BOOKING_DATE);
    setAvailableSlots([]);
    setSelectedSlots([]);
    setSearchContext(null);
    setAvailabilityMatch(null);
    setError("");
    setSuccessMessage("");
    setBookingError("");
    setAttendees("");
    setPurpose("");
    setIsBookingDialogOpen(false);
  };

  const openBookingDialog = () => {
    if (!searchContext) {
      setBookingError("Search availability before creating a booking.");
      return;
    }

    if (selectedSlots.length === 0) {
      setBookingError("Select at least one available slot before booking.");
      return;
    }

    setBookingError("");
    setSuccessMessage("");
    setIsBookingDialogOpen(true);
  };

  const closeBookingDialog = () => {
    if (bookingLoading) return;
    setIsBookingDialogOpen(false);
    setBookingError("");
  };

  const submitBooking = async (event) => {
    event.preventDefault();

    if (!userId) {
      setBookingError("Unable to identify the logged-in user for this booking.");
      return;
    }

    if (!searchContext) {
      setBookingError("Search availability before creating a booking.");
      return;
    }

    if (selectedSlots.length === 0) {
      setBookingError("Select at least one slot before booking.");
      return;
    }

    const parsedAttendees = Number(attendees);
    if (!Number.isInteger(parsedAttendees) || parsedAttendees <= 0) {
      setBookingError("Enter a valid number of attendees greater than 0.");
      return;
    }

    if (!purpose.trim()) {
      setBookingError("Enter the booking purpose.");
      return;
    }

    setBookingLoading(true);
    setBookingError("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/bookings/createBookingGroup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          user_id: userId,
          resource_name: searchContext.resourceName,
          date: searchContext.date,
          attendees: parsedAttendees,
          purpose: purpose.trim(),
          slots: selectedSlots,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(resolveMessage(payload));
      }

      setSuccessMessage(payload?.message || "Booking group created successfully.");
      setIsBookingDialogOpen(false);
      setAttendees("");
      setPurpose("");

      const remainingSlots = availableSlots.filter((slot) => !selectedSlots.includes(Number(slot.slot)));
      setAvailableSlots(remainingSlots);
      setSelectedSlots([]);
      setAvailabilityMatch(null);
    } catch (requestError) {
      setBookingError(requestError.message || "Unable to create the booking right now.");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="book-resource-panel-card book-by-name-card">
      <div className="book-by-name-header">
        <div>
          <h3>Book by Name</h3>
          <p>Search a resource by name and date, then choose from the slots that are currently available.</p>
        </div>
        <button className="book-by-name-clear" onClick={clearFilters} type="button">
          Clear
        </button>
      </div>

      <form className="availability-search-shell" onSubmit={submitSearch}>
        <div className="availability-search-grid">
          <label className="availability-field">
            <span>Resource Name</span>
            <input
              onChange={(event) => setResourceName(event.target.value)}
              placeholder="Enter exact resource name"
              type="text"
              value={resourceName}
            />
          </label>

          <label className="availability-field">
            <span>Date</span>
            <input
              min={DEFAULT_BOOKING_DATE}
              onChange={(event) => setBookingDate(event.target.value)}
              type="date"
              value={bookingDate}
            />
          </label>
        </div>

        <div className="availability-slot-section">
          <div className="availability-slot-copy">
            <strong>Preferred Slots</strong>
            <span>Select the slot checkboxes you want to validate for this resource and date.</span>
          </div>

          <div className="availability-slot-grid">
            {BOOKING_SLOT_OPTIONS.map((slot) => (
              <label className="availability-slot-option" key={slot.value}>
                <input
                  checked={selectedSlots.includes(slot.value)}
                  onChange={() => toggleSlot(slot.value)}
                  type="checkbox"
                />
                <span>{slot.compactLabel}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="availability-actions">
          <button className="primary-button availability-search-button" disabled={loading} type="submit">
            {loading ? "Checking..." : "Search Availability"}
          </button>

          <div className="availability-selection-summary">
            <span>Selected</span>
            <strong>{selectedSlotLabels.length === 0 ? "Any available slot" : selectedSlotLabels.join(", ")}</strong>
          </div>
        </div>

        {error ? <div className="availability-feedback availability-feedback-error">{error}</div> : null}
      </form>
      {successMessage ? (
        <div className="availability-feedback" style={successFeedbackStyle}>
          {successMessage}
        </div>
      ) : null}
      {bookingError && !isBookingDialogOpen ? (
        <div className="availability-feedback availability-feedback-error">{bookingError}</div>
      ) : null}

      {searchContext ? (
        <div className="availability-results">
          <div className="availability-results-header">
            <div>
              <span className="availability-results-eyebrow">Search Result</span>
              <h4>{searchContext.resourceName}</h4>
            </div>
            <div className="availability-results-meta">
              <span>{formatBookingDate(searchContext.date)}</span>
              <span>
                {selectedSlotLabels.length === 0
                  ? `${availableSlots.length} available slot(s)`
                  : `${selectedSlotLabels.length} slot(s) checked`}
              </span>
            </div>
          </div>
          {availabilityMatch !== null ? (
            <article
              className={`availability-status-card ${
                availabilityMatch ? "availability-status-card-success" : "availability-status-card-danger"
              }`}
            >
              <div className="availability-status-badge">{availabilityMatch ? "Available" : "Unavailable"}</div>
              <strong>
                {availabilityMatch
                  ? "The selected slots are available for this resource."
                  : "One or more selected slots are not available."}
              </strong>
              <p>
                {selectedSlotLabels.length === 0
                  ? "Choose slots above to validate specific time blocks."
                  : `Requested slots: ${selectedSlotLabels.join(", ")}.`}
              </p>
              {availabilityMatch && selectedSlots.length > 0 ? (
                <button className="primary-button" onClick={openBookingDialog} style={inlineButtonStyle} type="button">
                  Book
                </button>
              ) : null}
            </article>
          ) : (
            <div className="availability-results-body">
              <div className="availability-summary-card">
                <span>Selected Slots</span>
                <strong>{selectedSlots.length || availableSlots.length}</strong>
                <p>
                  {availableSlots.length > 0
                    ? selectedSlots.length > 0
                      ? `Ready to book: ${selectedSlotLabels.join(", ")}.`
                      : "Select one or more free slots from the results, then click Book."
                    : "No free slots were returned for this date."}
                </p>
                {availableSlots.length > 0 ? (
                  <button
                    className="primary-button"
                    disabled={selectedSlots.length === 0}
                    onClick={openBookingDialog}
                    style={inlineButtonStyle}
                    type="button"
                  >
                    Book
                  </button>
                ) : null}
              </div>

              <div className="availability-slot-results">
                {availableSlots.length > 0 ? (
                  availableSlots.map((slot) => (
                    <label className="availability-slot-card" key={slot.slot_id ?? slot.slot}>
                      <span className="availability-slot-card-label">Available</span>
                      <strong>{formatSlotRange(slot.slot)}</strong>
                      <p>Slot #{slot.slot_id ?? "N/A"}</p>
                      <span style={slotChoiceStyle}>
                        <input
                          checked={selectedSlots.includes(Number(slot.slot))}
                          onChange={() => toggleSlot(Number(slot.slot))}
                          type="checkbox"
                        />
                        <span>Select this slot</span>
                      </span>
                    </label>
                  ))
                ) : (
                  <div className="availability-feedback availability-feedback-neutral">
                    No free slots were returned for this date.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {isBookingDialogOpen ? (
        <div aria-modal="true" role="dialog" style={dialogOverlayStyle}>
          <div className="book-resource-panel-card" style={dialogCardStyle}>
            <div className="book-by-name-header">
              <div>
                <h3>Confirm Booking</h3>
                <p>Enter the booking details and review the selected resource, date, and slots.</p>
              </div>
              <button className="book-by-name-clear" onClick={closeBookingDialog} type="button">
                Close
              </button>
            </div>

            <form className="availability-search-shell" onSubmit={submitBooking}>
              <div className="availability-results-body">
                <div className="availability-summary-card">
                  <span>Resource Name</span>
                  <strong style={dialogValueStyle}>{searchContext.resourceName}</strong>
                  <span>Date</span>
                  <strong style={dialogValueStyle}>{formatBookingDate(searchContext.date)}</strong>
                  <span>Selected Slots</span>
                  <p>{selectedSlotLabels.join(", ")}</p>
                </div>

                <div className="availability-search-shell">
                  <label className="availability-field">
                    <span>Number of Attendees</span>
                    <input
                      min="1"
                      onChange={(event) => setAttendees(event.target.value)}
                      placeholder="Enter attendee count"
                      type="number"
                      value={attendees}
                    />
                  </label>

                  <label className="availability-field">
                    <span>Purpose</span>
                    <textarea
                      onChange={(event) => setPurpose(event.target.value)}
                      placeholder="Why are you booking this resource?"
                      style={textareaStyle}
                      value={purpose}
                    />
                  </label>
                </div>
              </div>

              {bookingError ? <div className="availability-feedback availability-feedback-error">{bookingError}</div> : null}

              <div className="availability-actions">
                <button className="book-by-name-clear" onClick={closeBookingDialog} type="button">
                  Cancel
                </button>
                <button className="primary-button availability-search-button" disabled={bookingLoading} type="submit">
                  {bookingLoading ? "Booking..." : "Book"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatSlotRange(slotNumber) {
  const slot = Number(slotNumber);
  if (!Number.isFinite(slot)) return "Unknown slot";
  return `${slot}:00 - ${slot + 1}:00`;
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

function getLocalDateInputValue() {
  const current = new Date();
  const year = current.getFullYear();
  const month = String(current.getMonth() + 1).padStart(2, "0");
  const day = String(current.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTomorrowDateInputValue() {
  const current = new Date();
  current.setDate(current.getDate() + 1);
  const year = current.getFullYear();
  const month = String(current.getMonth() + 1).padStart(2, "0");
  const day = String(current.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function parseApiPayload(response) {
  const raw = await response.text();
  if (!raw.trim()) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw.trim() || response.statusText };
  }
}

function resolveMessage(payload) {
  if (typeof payload === "string" && payload.trim()) return payload;
  const message = payload?.message;
  const detail = payload?.detail;
  const error = payload?.error;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string" && message.trim()) return message;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (typeof error === "string" && error.trim()) return error;
  return "Unable to complete the request right now.";
}

const dialogOverlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "grid",
  placeItems: "center",
  padding: "24px",
  background: "rgba(9, 16, 31, 0.5)",
};

const dialogCardStyle = {
  width: "min(900px, 100%)",
  maxHeight: "calc(100vh - 48px)",
  overflow: "auto",
};

const textareaStyle = {
  minHeight: "120px",
  padding: "16px 18px",
  borderRadius: "18px",
  border: "1px solid rgba(152, 171, 214, 0.3)",
  background: "rgba(255, 255, 255, 0.92)",
  color: "inherit",
  font: "inherit",
  resize: "vertical",
};

const dialogValueStyle = {
  fontSize: "1rem",
};

const slotChoiceStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "10px",
  fontWeight: 700,
};

const successFeedbackStyle = {
  border: "1px solid rgba(87, 214, 154, 0.28)",
  background: "rgba(87, 214, 154, 0.12)",
  color: "#1a8a56",
};

const inlineButtonStyle = {
  width: "fit-content",
  marginTop: "8px",
};
