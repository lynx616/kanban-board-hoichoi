import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CirclePlus } from "lucide-react";
import TaskCard from "./TaskCard";

export default function Column({ column, tasks, onOpen }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const Icon = column.icon;
  return (
    <div ref={setNodeRef} className={`kanban-column ${isOver ? "is-over" : "is-idle"}`}>
      <div className="column-header">
        <div className="column-heading">
          <span className={`column-icon ${column.color}`}>
            <Icon size={16} />
          </span>
          <h2 className="column-title">{column.label}</h2>
          <span className="column-count">{tasks.length}</span>
        </div>
        <button
          onClick={() => onOpen({ status: column.id })}
          className="column-add"
          aria-label={`Add task to ${column.label}`}
        >
          <CirclePlus size={18} />
        </button>
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
