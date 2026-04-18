import { useEffect, useMemo, useState } from "react";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SLOT_ORDER = Array.from({ length: 12 }, (_, index) => 8 + index);

export default function AdminTimetablePanel({ apiBaseUrl, token }) {
  const [cells, setCells] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [pickerError, setPickerError] = useState("");
  const [resourceQuery, setResourceQuery] = useState("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("all");
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [confirmResource, setConfirmResource] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTimetable = async (controller, preferredKey = null) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin-timetable/static-grid`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller?.signal,
      });
      const payload = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(resolveMessage(payload));
      }

      const nextCells = Array.isArray(payload) ? payload : [];
      setCells(nextCells);
      setSelectedCell(resolveSelectedCell(nextCells, preferredKey));
    } catch (requestError) {
      if (requestError.name === "AbortError") return;
      setCells([]);
      setSelectedCell(null);
      setError(requestError.message || "Unable to load the admin timetable right now.");
    } finally {
      if (!controller || !controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadTimetable(controller);
    return () => controller.abort();
  }, [apiBaseUrl, token]);

  const cellMap = useMemo(() => {
    const nextMap = new Map();
    cells.forEach((cell) => {
      nextMap.set(createKey(cell.day, cell.slot), cell);
    });
    return nextMap;
  }, [cells]);

  const normalizedQuery = resourceQuery.trim().toLowerCase();
  const visibleResources = useMemo(() => {
    const assignedIds = new Set(selectedCell?.resource_ids || []);

    return resources.filter((resource) => {
      const typeValue = (resource.type || "").trim().toLowerCase();
      const nameValue = (resource.name || "").trim().toLowerCase();
      const locationValue = (resource.location || "").trim().toLowerCase();
      const availableValue = resource.available === true;
      const matchesType = resourceTypeFilter === "all" || typeValue === resourceTypeFilter;
      const matchesQuery =
        !normalizedQuery || nameValue.includes(normalizedQuery) || locationValue.includes(normalizedQuery);
      const notAssignedYet = !assignedIds.has(resource.id);

      return availableValue && matchesType && matchesQuery && notAssignedYet;
    });
  }, [normalizedQuery, resourceTypeFilter, resources, selectedCell]);

  const selectedResource = useMemo(
    () => visibleResources.find((resource) => resource.id === selectedResourceId) || null,
    [selectedResourceId, visibleResources]
  );

  const openPicker = async () => {
    if (!selectedCell?.slot_id) return;

    setIsPickerOpen(true);
    setResourcesLoading(true);
    setPickerError("");
    setSelectedResourceId(null);
    setConfirmResource(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/facilities`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(resolveMessage(payload));
      }

      setResources(Array.isArray(payload) ? payload : []);
    } catch (requestError) {
      setResources([]);
      setPickerError(requestError.message || "Unable to load available resources right now.");
    } finally {
      setResourcesLoading(false);
    }
  };

  const closePicker = () => {
    if (isSubmitting) return;
    setIsPickerOpen(false);
    setPickerError("");
    setResourceQuery("");
    setResourceTypeFilter("all");
    setSelectedResourceId(null);
    setConfirmResource(null);
  };

  const submitAddResource = async () => {
    if (!selectedCell?.slot_id || !confirmResource?.id) return;

    setIsSubmitting(true);
    setPickerError("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/facilities/addresourcetoSlot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          slot_id: selectedCell.slot_id,
          resource_id: confirmResource.id,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(resolveMessage(payload));
      }

      const preferredKey = createKey(selectedCell.day, selectedCell.slot);
      setNotice(`${confirmResource.name} was added to ${selectedCell.day} ${formatSlotLabel(selectedCell.slot)}.`);
      setConfirmResource(null);
      setIsPickerOpen(false);
      setResourceQuery("");
      setResourceTypeFilter("all");
      setSelectedResourceId(null);
      await loadTimetable(null, preferredKey);
    } catch (requestError) {
      setPickerError(requestError.message || "Unable to add this resource to the selected slot right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="resource-management-shell">
      <div className="workspace-header">
        <div className="workspace-title-block">
          <h2>Static Timetable</h2>
          
        </div>
      </div>

      {loading ? (
        <div className="availability-feedback availability-feedback-neutral">Loading timetable grid...</div>
      ) : error ? (
        <div className="availability-feedback availability-feedback-error">{error}</div>
      ) : (
        <div className="resource-management-shell">
          <div className="admin-timetable-grid-wrap">
            <div className="admin-timetable-grid">
              <div className="admin-timetable-corner">Slot / Day</div>
              {DAY_ORDER.map((day) => (
                <div className="admin-timetable-day-head" key={day}>
                  {day}
                </div>
              ))}

              {SLOT_ORDER.map((slot) => (
                <AdminTimetableRow
                  cellMap={cellMap}
                  key={slot}
                  onSelect={(cell) => {
                    setSelectedCell(cell);
                    setNotice("");
                  }}
                  selectedCell={selectedCell}
                  slot={slot}
                />
              ))}
            </div>
          </div>

          {notice ? <div className="availability-feedback availability-feedback-neutral">{notice}</div> : null}

          <div className="book-resource-panel-card">
            <div className="admin-timetable-detail-header">
              <div>
                <h3>
                  {selectedCell ? `${selectedCell.day} ${formatSlotLabel(selectedCell.slot)}` : "Select a timetable cell"}
                </h3>
                <p>
                  {selectedCell
                    ? "Review assigned resources for this slot and add another valid resource if needed."
                    : "Click one square in the grid to see the resources assigned for that day and slot."}
                </p>
              </div>
            </div>

            {selectedCell ? (
              <div className="availability-slot-results">
                {selectedCell.resource_names?.length > 0 ? (
                  selectedCell.resource_names.map((resourceName, index) => (
                    <article className="availability-slot-card" key={`${selectedCell.slot_id}-${resourceName}-${index}`}>
                      <span className="availability-slot-card-label">Assigned Resource</span>
                      <strong>{resourceName}</strong>
                      <p>Slot: {formatSlotLabel(selectedCell.slot)}</p>
                    </article>
                  ))
                ) : (
                  <article className="availability-slot-card availability-slot-card-empty">
                    <span className="availability-slot-card-label">Assigned Resource</span>
                    <strong>No resources assigned yet</strong>
                    <p>This static timetable slot is still empty.</p>
                  </article>
                )}

                <button
                  className="admin-timetable-add-box admin-timetable-add-box-button"
                  onClick={openPicker}
                  type="button"
                >
                  <span className="admin-timetable-add-icon">+</span>
                  <div>
                    <strong>Add Resource</strong>
                    <p>Pick another resource for {selectedCell.day} {formatSlotLabel(selectedCell.slot)}.</p>
                  </div>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {isPickerOpen ? (
        <div className="modal-backdrop">
          <div aria-labelledby="admin-timetable-picker-title" aria-modal="true" className="modal-card" role="dialog">
            <div className="modal-header">
              <h3 id="admin-timetable-picker-title">Add Resource to Slot</h3>
              <p>Select an available resource for {selectedCell?.day} {formatSlotLabel(selectedCell?.slot)}.</p>
            </div>

            <div className="admin-timetable-resource-filters">
              <label className="availability-field">
                <span>Search</span>
                <input
                  onChange={(event) => setResourceQuery(event.target.value)}
                  placeholder="Filter by name or location"
                  type="text"
                  value={resourceQuery}
                />
              </label>
              <label className="availability-field">
                <span>Type</span>
                <select onChange={(event) => setResourceTypeFilter(event.target.value)} value={resourceTypeFilter}>
                  <option value="all">All Types</option>
                  <option value="lab">Lab</option>
                  <option value="lechall">LecHall</option>
                </select>
              </label>
            </div>

            {pickerError ? <div className="availability-feedback availability-feedback-error">{pickerError}</div> : null}

            {resourcesLoading ? (
              <div className="availability-feedback availability-feedback-neutral">Loading available resources...</div>
            ) : visibleResources.length > 0 ? (
              <div className="admin-timetable-resource-list">
                {visibleResources.map((resource) => {
                  const isSelected = resource.id === selectedResourceId;

                  return (
                    <label
                      className={`admin-timetable-resource-option ${isSelected ? "admin-timetable-resource-option-active" : ""}`}
                      key={resource.id}
                    >
                      <input
                        checked={isSelected}
                        name="admin-slot-resource"
                        onChange={() => setSelectedResourceId(resource.id)}
                        type="radio"
                      />
                      <div>
                        <strong>{resource.name || `Resource #${resource.id}`}</strong>
                        <span>{resource.type || "Unknown type"} | {resource.location || "No location"}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="admin-timetable-resource-empty">
                No available resources match the current filters for this slot.
              </div>
            )}

            <div className="modal-actions">
              <button className="modal-secondary-button" disabled={isSubmitting} onClick={closePicker} type="button">
                Cancel
              </button>
              <button
                className="modal-primary-button"
                disabled={!selectedResource || isSubmitting}
                onClick={() => setConfirmResource(selectedResource)}
                type="button"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmResource ? (
        <div className="modal-backdrop">
          <div aria-labelledby="admin-timetable-confirm-title" aria-modal="true" className="modal-card modal-card-confirm" role="dialog">
            <div className="modal-header">
              <h3 id="admin-timetable-confirm-title">Confirm Resource Assignment</h3>
              <p>Do you want to add this resource to the selected timetable slot?</p>
            </div>

            <div className="booking-admin-summary">
              <p>Resource: {confirmResource.name || `Resource #${confirmResource.id}`}</p>
              <p>Type: {confirmResource.type || "Unknown"}</p>
              <p>Slot: {selectedCell ? formatSlotLabel(selectedCell.slot) : "N/A"}</p>
              <p>Day: {selectedCell?.day || "N/A"}</p>
            </div>

            {pickerError ? <div className="modal-inline-error">{pickerError}</div> : null}

            <div className="modal-actions">
              <button
                className="modal-secondary-button"
                disabled={isSubmitting}
                onClick={() => setConfirmResource(null)}
                type="button"
              >
                Cancel
              </button>
              <button className="modal-primary-button" disabled={isSubmitting} onClick={submitAddResource} type="button">
                {isSubmitting ? "Adding..." : "OK"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AdminTimetableRow({ cellMap, onSelect, selectedCell, slot }) {
  return (
    <>
      <div className="admin-timetable-slot-head">{formatSlotLabel(slot)}</div>
      {DAY_ORDER.map((day) => {
        const cell = cellMap.get(createKey(day, slot)) || {
          day,
          slot,
          slot_id: null,
          resource_ids: [],
          resource_names: [],
        };
        const isActive =
          selectedCell?.day === cell.day &&
          Number(selectedCell?.slot) === Number(cell.slot) &&
          Number(selectedCell?.slot_id ?? -1) === Number(cell.slot_id ?? -1);

        return (
          <button
            className={`admin-timetable-cell ${isActive ? "admin-timetable-cell-active" : ""}`}
            key={createKey(day, slot)}
            onClick={() => onSelect(cell)}
            type="button"
          >
            <strong>{cell.resource_names?.length || 0}</strong>
            <span>{cell.resource_names?.length ? "resources" : "empty"}</span>
          </button>
        );
      })}
    </>
  );
}

function resolveSelectedCell(cells, preferredKey) {
  if (preferredKey) {
    const matched = cells.find((cell) => createKey(cell.day, cell.slot) === preferredKey);
    if (matched) return matched;
  }
  return cells[0] || null;
}

function createKey(day, slot) {
  return `${String(day).trim().toLowerCase()}:${slot}`;
}

function formatSlotLabel(slot) {
  if (slot == null || Number.isNaN(Number(slot))) return "Unknown slot";
  return `${slot}:00 - ${Number(slot) + 1}:00`;
}

function resolveMessage(payload) {
  const message = payload?.message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string" && message.trim()) return message;
  return "Unable to complete the request right now.";
}
