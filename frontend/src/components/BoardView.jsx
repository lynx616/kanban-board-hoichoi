import { DndContext } from "@dnd-kit/core";
import { Filter, PanelLeft, Plus, Search, SlidersHorizontal, UserRound, X } from "lucide-react";
import { columns } from "../constants/board";
import { pageMeta } from "../constants/pages";
import Column from "./Column";

export default function BoardView({
  activePage,
  visible,
  loading,
  error,
  query,
  setQuery,
  priority,
  setPriority,
  assignee,
  setAssignee,
  assignees,
  connectionState,
  sensors,
  moveTask,
  onOpen,
  makeInitials,
}) {
  const isBoardView = pageMeta[activePage]?.showBoard ?? false;
  const boardTasks = activePage === "issues"
    ? visible.filter((task) => (task.type || "task") === "defect")
    : activePage === "backlog"
      ? visible.filter((task) => task.status === "backlog")
      : visible;

  if (!isBoardView) {
    return (
      <div className="blank-page" aria-label={`${pageMeta[activePage]?.label || "Page"} view`}>
        <div className="blank-page-message">We don't have this feature yet.</div>
      </div>
    );
  }

  return (
    <>
      <div className="reference-context">
        <div className="issue-total-row">
          <div className="issue-total">{boardTasks.length} issues</div>
          <div className="issue-total-actions" aria-label="Board view actions">
            <button
              type="button"
              className="issue-total-icon-button"
              aria-label="Filter board"
              title="Filter board"
            >
              <Filter size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="issue-total-icon-button"
              aria-label="Adjust board settings"
              title="Adjust board settings"
            >
              <SlidersHorizontal size={14} aria-hidden="true" />
              <span className="issue-total-notification-dot" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="issue-total-icon-button"
              aria-label="Toggle board panel"
              title="Toggle board panel"
            >
              <PanelLeft size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="reference-filter-row">
          <div
            className="reference-filter"
            aria-label={`Assignee filter: ${assignee || "Everyone"}`}
          >
            <UserRound size={14} aria-hidden="true" />
            <span>Assignee</span>
            <span className="reference-filter-word">is</span>
            {assignee ? (
              <>
                <span className="reference-assignee-avatar" aria-hidden="true">
                  {makeInitials(assignee)}
                </span>
                <span className="reference-assignee">{assignee}</span>
              </>
            ) : (
              <span className="reference-assignee">Everyone</span>
            )}
            {assignee && (
              <button
                type="button"
                className="reference-filter-remove"
                aria-label="Clear assignee filter"
                onClick={() => setAssignee("")}
              >
                <X size={12} aria-hidden="true" />
              </button>
            )}
          </div>
          <button className="reference-filter-add" aria-label="Add filter">
            <Plus size={15} />
          </button>
          <div className="reference-filter-actions">
            <button
              type="button"
              className="reference-clear-button"
              onClick={() => {
                setAssignee("");
                setPriority("");
                setQuery("");
              }}
            >
              Clear
            </button>
            <button type="button" className="reference-save-button" aria-label="Save filters">
              Save
            </button>
          </div>
        </div>
      </div>
      <section className="board-toolbar">
        <div className="toolbar-controls">
          <label className="search-field">
            <span className="sr-only">Search tasks</span>
            <Search className="search-icon" size={16} aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
              placeholder="Search tasks..."
              type="search"
            />
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="filter-input"
          >
            <option value="">All priorities</option>
            <option value="high">High priority</option>
            <option value="medium">Medium priority</option>
            <option value="low">Low priority</option>
          </select>
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="filter-input"
          >
            <option value="">Everyone</option>
            {assignees.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </div>
        <div className="board-status">
          <span>{boardTasks.length} issues</span>
          <span className="status-divider" />
          <span className="live-status">
            <span className={`live-dot ${connectionState !== "live" ? "is-reconnecting" : ""}`} />{" "}
            {connectionState === "live"
              ? "Live"
              : connectionState === "connecting"
                ? "Connecting"
                : "Reconnecting"}
          </span>
        </div>
      </section>
      {loading ? (
        <div className="loading-state">Loading your board...</div>
      ) : error ? (
        <div className="error-state">{error}</div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragEnd={({ active, over }) => {
            if (over && active.id !== over.id) moveTask(active.id, over.id);
          }}
        >
          <section className="board-grid">
            {columns.map((column) => (
              <Column
                key={column.id}
                column={column}
                tasks={boardTasks.filter((task) => task.status === column.id)}
                onOpen={onOpen}
              />
            ))}
          </section>
        </DndContext>
      )}
    </>
  );
}