import { useEffect, useMemo, useState } from "react";

const BOOKING_SLOT_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const startHour = 8 + index;
  return {
    value: startHour,
    compactLabel: `${startHour}-${startHour + 1}`,
  };
});

const DEFAULT_BOOKING_DATE = getTomorrowDateInputValue();

export default function BookByTypePanel({ apiBaseUrl, roleName, token, userId }) {
  const [resourceTypes, setResourceTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [bookingDate, setBookingDate] = useState(DEFAULT_BOOKING_DATE);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedResourceName, setSelectedResourceName] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [attendees, setAttendees] = useState("");
  const [purpose, setPurpose] = useState("");

  const selectedSlotLabels = useMemo(
    () =>
      BOOKING_SLOT_OPTIONS.filter((slot) => selectedSlots.includes(slot.value)).map((slot) => slot.compactLabel),
    [selectedSlots]
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadResourceTypes() {
      if (!roleName) {
        setLoadingTypes(false);
        setResourceTypes([]);
        setError("Unable to determine the logged-in role for resource type lookup.");
        return;
      }

      setLoadingTypes(true);
      setError("");

      try {
        const params = new URLSearchParams({ roleName });
        const response = await fetch(`${apiBaseUrl}/api/bookings/getAllowedResourceTypesByRole?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(resolveMessage(payload));
        }

        const nextTypes = Array.isArray(payload) ? payload : [];
        setResourceTypes(nextTypes);
        setSelectedType((current) => (current && nextTypes.includes(current) ? current : nextTypes[0] || ""));
      } catch (requestError) {
        if (requestError.name === "AbortError") return;
        setResourceTypes([]);
        setSelectedType("");
        setError(requestError.message || "Unable to load resource types right now.");
      } finally {
        if (!controller.signal.aborted) {
          setLoadingTypes(false);
        }
      }
    }

    loadResourceTypes();
    return () => controller.abort();
  }, [apiBaseUrl, roleName, token]);

  const toggleSlot = (slotValue) => {
    setSelectedSlots((current) =>
      current.includes(slotValue)
        ? current.filter((value) => value !== slotValue)
        : [...current, slotValue].sort((left, right) => left - right)
    );
  };

  const submitSearch = async (event) => {
    event.preventDefault();

    if (!selectedType) {
      setError("Select a resource type before searching.");
      setResults([]);
      return;
    }

    if (!bookingDate) {
      setError("Select a date before searching.");
      setResults([]);
      return;
    }

    setLoadingResults(true);
    setError("");
    setResults([]);
    setSelectedResourceName("");
    setSuccessMessage("");
    setBookingError("");
    setIsBookingDialogOpen(false);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        type: selectedType,
        date: bookingDate,
      });

      selectedSlots.forEach((slot) => {
        params.append("slots", String(slot));
      });

      const response = await fetch(`${apiBaseUrl}/api/bookings/searchAvailabilityByType?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(resolveMessage(payload));
      }

      const nextResults = Array.isArray(payload) ? payload : [];
      setResults(nextResults);
      setSelectedResourceName("");
    } catch (requestError) {
      setResults([]);
      setSelectedResourceName("");
      setError(requestError.message || "Unable to search availability by type right now.");
    } finally {
      setLoadingResults(false);
    }
  };

  const clearFilters = () => {
    setSelectedType(resourceTypes[0] || "");
    setBookingDate(DEFAULT_BOOKING_DATE);
    setSelectedSlots([]);
    setResults([]);
    setSelectedResourceName("");
    setHasSearched(false);
    setError("");
    setBookingError("");
    setSuccessMessage("");
    setAttendees("");
    setPurpose("");
    setIsBookingDialogOpen(false);
  };

  const showingSlotMatches = selectedSlots.length > 0;
  const canBook = Boolean(selectedResourceName && selectedSlots.length > 0);

  const openBookingDialog = () => {
    if (!selectedResourceName) {
      setBookingError("Select one resource before booking.");
      return;
    }

    if (selectedSlots.length === 0) {
      setBookingError("Select one or more time slots before booking.");
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

    if (!selectedResourceName) {
      setBookingError("Select one resource before booking.");
      return;
    }

    if (selectedSlots.length === 0) {
      setBookingError("Select one or more time slots before booking.");
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
          resource_name: selectedResourceName,
          date: bookingDate,
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
      setSelectedResourceName("");
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
          <h3>Book by Type</h3>
          <p>Select a resource type, date, and optional time slots to find matching resources.</p>
        </div>
        <button className="book-by-name-clear" onClick={clearFilters} type="button">
          Clear
        </button>
      </div>

      <form className="availability-search-shell" onSubmit={submitSearch}>
        <div className="availability-search-grid">
          <label className="availability-field">
            <span>Resource Type</span>
            <select
              disabled={loadingTypes || resourceTypes.length === 0}
              onChange={(event) => setSelectedType(event.target.value)}
              style={selectStyle}
              value={selectedType}
            >
              {resourceTypes.length === 0 ? <option value="">No types available</option> : null}
              {resourceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
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
            <span>
              Leave slots empty to list resources with any free time on that day, or choose slots to find exact
              matches.
            </span>
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
          <button
            className="primary-button availability-search-button"
            disabled={loadingTypes || loadingResults || !selectedType}
            type="submit"
          >
            {loadingResults ? "Searching..." : "Search Availability"}
          </button>

          <div className="availability-selection-summary">
            <span>Selected</span>
            <strong>{selectedSlotLabels.length === 0 ? "Any available slot" : selectedSlotLabels.join(", ")}</strong>
          </div>
        </div>

        {error ? <div className="availability-feedback availability-feedback-error">{error}</div> : null}
        {loadingTypes ? <div className="availability-feedback availability-feedback-neutral">Loading resource types...</div> : null}
      </form>
      {successMessage ? (
        <div className="availability-feedback" style={successFeedbackStyle}>
          {successMessage}
        </div>
      ) : null}
      {bookingError && !isBookingDialogOpen ? (
        <div className="availability-feedback availability-feedback-error">{bookingError}</div>
      ) : null}

      {results.length > 0 ? (
        <div className="availability-results">
          <div className="availability-results-header">
            <div>
              <span className="availability-results-eyebrow">Search Result</span>
              <h4>{selectedType || "Resource Type"}</h4>
            </div>
            <div className="availability-results-meta">
              <span>{formatBookingDate(bookingDate)}</span>
              <span>{results.length} resource(s)</span>
            </div>
          </div>

          <div className="availability-actions">
            <div className="availability-selection-summary">
              <span>Selected Resource</span>
              <strong>{selectedResourceName || "Choose a resource below"}</strong>
            </div>
            <button className="primary-button" disabled={!canBook} onClick={openBookingDialog} type="button">
              Book
            </button>
          </div>

          <div className="availability-slot-results">
            {showingSlotMatches
              ? results.map((resource) => (
                  <article className="availability-slot-card" key={resource.resource_id ?? resource.resource_name}>
                    <span className="availability-slot-card-label">Match</span>
                    <strong>{resource.resource_name || "Unnamed Resource"}</strong>
                    <p>{formatSelectedSlots(resource.slots)}</p>
                    <label style={choiceStyle}>
                      <input
                        checked={selectedResourceName === resource.resource_name}
                        name="type-resource"
                        onChange={() => setSelectedResourceName(resource.resource_name || "")}
                        type="radio"
                      />
                      <span>Select this resource</span>
                    </label>
                  </article>
                ))
              : results.map((resource) => (
                  <article className="availability-slot-card" key={resource.resource_id ?? resource.resource_name}>
                    <span className="availability-slot-card-label">Available</span>
                    <strong>{resource.resource_name || "Unnamed Resource"}</strong>
                    <p>{formatFreeSlots(resource.free_slots)}</p>
                    <label style={choiceStyle}>
                      <input
                        checked={selectedResourceName === resource.resource_name}
                        name="type-resource"
                        onChange={() => setSelectedResourceName(resource.resource_name || "")}
                        type="radio"
                      />
                      <span>Select this resource</span>
                    </label>
                  </article>
                ))}
          </div>
        </div>
      ) : null}

      {!loadingResults && !error && results.length === 0 && hasSearched ? (
        <div className="availability-feedback availability-feedback-neutral">
          No matching resources were returned for the selected type, date, and slot combination.
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
                  <strong style={dialogValueStyle}>{selectedResourceName}</strong>
                  <span>Date</span>
                  <strong style={dialogValueStyle}>{formatBookingDate(bookingDate)}</strong>
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

function formatSelectedSlots(slots) {
  if (!Array.isArray(slots) || slots.length === 0) return "No matching slots returned.";
  return slots.map((slot) => `${slot}-${slot + 1}`).join(", ");
}

function formatFreeSlots(slots) {
  if (!Array.isArray(slots) || slots.length === 0) return "No free slots returned.";
  return slots.map((slot) => `${slot.slot}-${slot.slot + 1}`).join(", ");
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

function resolveMessage(payload) {
  const message = payload?.message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string" && message.trim()) return message;
  return "Unable to complete the request right now.";
}

const selectStyle = {
  minHeight: "56px",
  padding: "0 18px",
  borderRadius: "18px",
  border: "1px solid rgba(152, 171, 214, 0.3)",
  background: "rgba(255, 255, 255, 0.92)",
  color: "inherit",
  font: "inherit",
};

const choiceStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "10px",
  fontWeight: 700,
};

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

const successFeedbackStyle = {
  border: "1px solid rgba(87, 214, 154, 0.28)",
  background: "rgba(87, 214, 154, 0.12)",
  color: "#1a8a56",
};
