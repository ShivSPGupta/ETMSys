import { StatusBadge } from "../common/index.jsx";

export default function TaskStatusControl({
  status,
  nextStatuses,
  busy,
  onChange,
}) {
  return (
    <div className="task-status-control">
      <div>
        <b>Update status</b>
        <span>Move this task forward.</span>
      </div>
      {nextStatuses.length ? (
        <select
          disabled={busy}
          value=""
          onChange={(event) =>
            event.target.value && onChange(event.target.value)
          }
        >
          <option value="">{busy ? "Updating…" : "Choose next status"}</option>
          {nextStatuses.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      ) : (
        <StatusBadge status={status} />
      )}
    </div>
  );
}
