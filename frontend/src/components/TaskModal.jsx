import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { columns, issueTypes } from "../constants/board";

export default function TaskModal({ task, onClose, onSave, onDelete }) {
  const editing = Boolean(task?.id);
  const [draft, setDraft] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "medium",
    assignee: task?.assignee || "",
    status: task?.status || "backlog",
    type: task?.type || "task",
  });
  const [saving, setSaving] = useState(false);
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const submit = async (e) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    setSaving(true);
    await onSave({ ...draft, title: draft.title.trim() });
    setSaving(false);
  };
  return (
    <div className="modal-backdrop">
      <form onSubmit={submit} className="task-modal">
        <div className="modal-header">
          <div>
            <p className="modal-eyebrow">{editing ? "Task details" : "New task"}</p>
            <h2 className="modal-title">
              {editing ? "Shape the next move" : "Add work to the board"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="modal-close" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="task-form">
          <label className="form-label">
            Title
            <input
              autoFocus
              value={draft.title}
              onChange={(e) => update("title", e.target.value)}
              className="form-control"
              required
              maxLength={120}
            />
          </label>
          <label className="form-label">
            Description
            <textarea
              value={draft.description}
              onChange={(e) => update("description", e.target.value)}
              className="form-control min-h-24"
            />
          </label>
          <div className="form-grid">
            <label className="form-label">
              Type
              <select
                value={draft.type}
                onChange={(e) => update("type", e.target.value)}
                className="form-control"
              >
                {issueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-label">
              Priority
              <select
                value={draft.priority}
                onChange={(e) => update("priority", e.target.value)}
                className="form-control"
              >
                <option>low</option>
                <option>medium</option>
                <option>high</option>
              </select>
            </label>
            <label className="form-label">
              Assignee
              <input
                value={draft.assignee}
                onChange={(e) => update("assignee", e.target.value)}
                className="form-control"
                placeholder="Name"
              />
            </label>
            <label className="form-label">
              Status
              <select
                value={draft.status}
                onChange={(e) => update("status", e.target.value)}
                className="form-control"
              >
                {columns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="modal-footer">
          {editing ? (
            <button type="button" onClick={() => onDelete(task)} className="delete-button">
              <Trash2 size={16} /> Delete
            </button>
          ) : (
            <span />
          )}
          {editing && <span className="modal-note">Changes save to the live board</span>}
          <button disabled={saving} className="save-button">
            {saving ? "Saving..." : editing ? "Save changes" : "Create task"}
          </button>
        </div>
      </form>
    </div>
  );
}
