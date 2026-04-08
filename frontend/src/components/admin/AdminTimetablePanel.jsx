import { useEffect, useMemo, useState } from "react";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SLOT_ORDER = Array.from({ length: 12 }, (_, index) => 8 + index);

export default function AdminTimetablePanel({ apiBaseUrl, token }) {
  const [cells, setCells] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadTimetable() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${apiBaseUrl}/api/admin-timetable/static-grid`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(resolveMessage(payload));
        }

        const nextCells = Array.isArray(payload) ? payload : [];
        setCells(nextCells);
        setSelectedCell(nextCells[0] || null);
      } catch (requestError) {
        if (requestError.name === "AbortError") return;
        setCells([]);
        setSelectedCell(null);
        setError(requestError.message || "Unable to load the admin timetable right now.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadTimetable();
    return () => controller.abort();
  }, [apiBaseUrl, token]);

  const cellMap = useMemo(() => {
    const nextMap = new Map();
    cells.forEach((cell) => {
      nextMap.set(createKey(cell.day, cell.slot), cell);
    });
    return nextMap;
  }, [cells]);

  return (
    <div className="resource-management-shell">
      <div className="workspace-header">
        <div className="workspace-title-block">
          <h2>Static Timetable</h2>
          <p>Select a day and slot cell to view the resources assigned through `Ds_resource` and `Resource`.</p>
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
                  onSelect={setSelectedCell}
                  selectedCell={selectedCell}
                  slot={slot}
                />
              ))}
            </div>
          </div>

          <div className="book-resource-panel-card">
            <h3>
              {selectedCell ? `${selectedCell.day} ${formatSlotLabel(selectedCell.slot)}` : "Select a timetable cell"}
            </h3>
            {selectedCell ? (
              selectedCell.resource_names?.length > 0 ? (
                <div className="availability-slot-results">
                  {selectedCell.resource_names.map((resourceName) => (
                    <article className="availability-slot-card" key={`${selectedCell.slot_id}-${resourceName}`}>
                      <span className="availability-slot-card-label">Assigned Resource</span>
                      <strong>{resourceName}</strong>
                      <p>Slot ID: {selectedCell.slot_id}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p>No resources are assigned to this static timetable slot.</p>
              )
            ) : (
              <p>Click one square in the grid to see the resources assigned for that day and slot.</p>
            )}
          </div>
        </div>
      )}
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

function createKey(day, slot) {
  return `${String(day).trim().toLowerCase()}:${slot}`;
}

function formatSlotLabel(slot) {
  return `${slot}:00 - ${Number(slot) + 1}:00`;
}

function resolveMessage(payload) {
  const message = payload?.message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string" && message.trim()) return message;
  return "Unable to complete the request right now.";
}
