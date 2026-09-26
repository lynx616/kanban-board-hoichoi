import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil } from "lucide-react";
import { columns } from "../constants/board";

const PriorityBars = ({ priority }) => {
  const opacities = {
    high: [1, 1, 1],
    medium: [1, 1, 0.3],
    low: [1, 0.3, 0.3],
  };
  const opacityValues = opacities[priority] || opacities.medium;

  return (
    <svg className="task-network-icon-image" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {opacityValues.map((opacity, index) => (
        <rect
          key={index}
          x={2.5 + index * 4}
          y={16 - (4 + index * 4)}
          width="3"
          height={4 + index * 4}
          rx="1"
          fill="currentColor"
          style={{ opacity }}
        />
      ))}
    </svg>
  );
};

export default function TaskCard({ task, onOpen }) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });
  const statusIconPath =
    columns.find((column) => column.id === task.status)?.icon || "/backlog.svg";
  const updatedDate = task.updatedAt
    ? new Date(task.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "Recently";
  const taskType = (task.type || "task").toLowerCase();
  const taskNumber = task.id.startsWith("task-")
    ? task.id.replace("task-", "").padStart(3, "0")
    : task.id.slice(0, 6).toUpperCase();

  return (
    <article
      ref={(node) => {
        setNodeRef(node);
        setActivatorNodeRef(node);
      }}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(task);
        }
      }}
      className={`task-card group ${isDragging ? "is-dragging" : ""}`}
    >
      <span className="task-id">DEMO-{taskNumber}</span>
      <h3 className="task-title">
        <img className={`task-status-icon status-${task.status}`} src={statusIconPath} alt="" />
        {task.title}
      </h3>
      <div className="task-tags">
        <span className={`task-network-icon priority-${task.priority}`} aria-hidden="true">
          <PriorityBars priority={task.priority} />
        </span>
        <span className={`task-chip priority-badge priority-${task.priority}`}>
          <span className="chip-dot" />
          {task.priority}
        </span>
        <span className={`task-chip task-type-badge task-type-${taskType}`}>
          <span className="chip-dot" />
          {taskType}
        </span>
        <span className="task-chip">
          <span className="chip-dot assignee-dot" />
          {task.assignee || "Unassigned"}
        </span>
      </div>
      <div className="task-footer">
        <span>Created {updatedDate}</span>
        <Pencil size={13} className="edit-icon" />
      </div>
    </article>
  );
}