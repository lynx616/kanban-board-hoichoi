import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Circle, GripVertical, Pencil } from "lucide-react";
import { columns } from "../constants/board";

export default function TaskCard({ task, onOpen }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });
  const StatusIcon = columns.find((column) => column.id === task.status)?.icon || Circle;
  const taskNumber = task.id.startsWith("task-")
    ? task.id.replace("task-", "").padStart(3, "0")
    : task.id.slice(0, 6).toUpperCase();
  const updatedDate = task.updatedAt
    ? new Date(task.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "Recently";
  const taskType = (task.type || "task").toLowerCase();
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      onClick={() => onOpen(task)}
      className={`task-card group ${isDragging ? "is-dragging" : ""}`}
    >
      <div className="task-card-top">
        <span className={`task-type-badge task-type-${taskType}`}>{taskType}</span>
        <span className="task-id">DEMO-{taskNumber}</span>
        <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
        <button
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="drag-handle"
          aria-label="Drag task"
        >
          <GripVertical size={17} />
        </button>
      </div>
      <h3 className="task-title">
        <StatusIcon size={14} className={`task-status-icon status-${task.status}`} />
        {task.title}
      </h3>
      <p className="task-description">{task.description || "No description yet."}</p>
      <div className="task-tags">
        <span className="task-chip">
          <span className={`chip-dot priority-dot-${task.priority}`} />
          {task.priority}
        </span>
        <span className="task-chip">
          <span className="chip-dot assignee-dot" />
          {task.assignee || "Unassigned"}
        </span>
      </div>
      <div className="task-footer">
        <span>Updated {updatedDate}</span>
        <Pencil size={13} className="edit-icon" />
      </div>
    </article>
  );
}
