import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { MoreHorizontal, Plus } from "lucide-react";
import TaskCard from "./TaskCard";

export default function Column({ column, tasks, onOpen }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const iconPath = column.icon;
  return (
    <div ref={setNodeRef} className={`kanban-column ${isOver ? "is-over" : "is-idle"}`}>
      <div className="column-header">
        <div className="column-heading">
          <img className="column-status-icon" src={column.icon} alt="" />
          <h2 className="column-title">{column.label}</h2>
          <span className="column-count">{tasks.length}</span>
        </div>
        <div className="column-actions">
          <span className="column-add" aria-hidden="true">
            <MoreHorizontal size={18} />
          </span>
          <button
            onClick={() => onOpen({ status: column.id })}
            className="column-add"
            aria-label={`Add task to ${column.label}`}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="task-list">
          {tasks.length ? (
            tasks.map((task) => <TaskCard key={task.id} task={task} onOpen={onOpen} />)
          ) : (
            <div className="empty-column">Drop work here</div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
