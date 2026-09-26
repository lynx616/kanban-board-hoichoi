import { useEffect, useState } from "react";
import { DndContext } from "@dnd-kit/core";
import {
  ChevronDown,
  ChevronRight,
  Filter,
  MoreHorizontal,
  Moon,
  PanelLeft,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { API_BASE_URL, request } from "./api/client";
import { columns } from "./constants/board";
import { useBoard } from "./hooks/useBoard";
import Sidebar from "./components/Sidebar";
import Column from "./components/Column";
import TaskModal from "./components/TaskModal";

export default function App() {
  const {
    assignees,
    assignee,
    connectionState,
    deleteTask,
    error,
    loading,
    modal,
    moveTask,
    priority,
    query,
    saveTask,
    sensors,
    setAssignee,
    setModal,
    setPriority,
    setQuery,
    toast,
    visible,
  } = useBoard();
  const [theme, setTheme] = useState(
    () => localStorage.getItem("kanban-theme") || "dark",
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("home");
  const [currentUserName, setCurrentUserName] = useState(
    () => localStorage.getItem("kanban-user-name") || "",
  );
  const [presenceId] = useState(
    () => {
      const existingId = localStorage.getItem("kanban-presence-id");
      if (existingId) return existingId;
      const nextId = crypto.randomUUID();
      localStorage.setItem("kanban-presence-id", nextId);
      return nextId;
    },
  );
  const [sessionUsers, setSessionUsers] = useState([]);

  const pageMeta = {
    home: { label: "Home", showBoard: true, subLabel: "Test Sprint" },
    issues: { label: "Issues", showBoard: true },
    backlog: { label: "Backlog", showBoard: true },
    upcoming: { label: "Upcoming", showBoard: false },
    cycles: { label: "Cycles", showBoard: true, subLabel: "Test Sprint" },
    current: { label: "Current", showBoard: false },
    settings: { label: "Settings", showBoard: false },
  };

  const isBoardView = pageMeta[activePage]?.showBoard ?? false;
  const boardTasks = activePage === "issues"
    ? visible.filter((task) => (task.type || "task") === "defect")
    : activePage === "backlog"
      ? visible.filter((task) => task.status === "backlog")
      : visible;

  const makeInitials = (name) =>
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const activeUsers = (() => {
    const list = sessionUsers.length ? sessionUsers : [];
    if (!currentUserName) return list;

    const current = { id: presenceId, name: currentUserName, initials: makeInitials(currentUserName) };
    const allUsers = [current, ...list];
    return allUsers.filter((user, index, arr) =>
      arr.findIndex((candidate) => candidate.id === user.id) === index,
    );
  })();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("kanban-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (currentUserName) {
      localStorage.setItem("kanban-user-name", currentUserName);
    } else {
      localStorage.removeItem("kanban-user-name");
    }
  }, [currentUserName]);

  useEffect(() => {
    if (!currentUserName) {
      return undefined;
    }

    let cancelled = false;

    const syncPresence = async () => {
      try {
        const users = await request("/api/presence", {
          method: "POST",
          body: JSON.stringify({ id: presenceId, name: currentUserName }),
        });
        if (!cancelled) setSessionUsers(users || []);
      } catch {
        if (!cancelled) setSessionUsers([]);
      }
    };

    syncPresence();
    const heartbeat = window.setInterval(syncPresence, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(heartbeat);
    };
  }, [currentUserName, presenceId]);

  useEffect(() => {
    let cancelled = false;

    const loadPresence = async () => {
      try {
        const users = await request("/api/presence");
        if (!cancelled) setSessionUsers(users || []);
      } catch {
        if (!cancelled) setSessionUsers([]);
      }
    };

    loadPresence();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const events = new EventSource(`${API_BASE_URL}/api/events`);
    const handlePresence = (event) => {
      try {
        const users = JSON.parse(event.data);
        setSessionUsers(users || []);
      } catch {
        setSessionUsers([]);
      }
    };

    events.addEventListener("presence-updated", handlePresence);
    return () => {
      events.removeEventListener("presence-updated", handlePresence);
      events.close();
    };
  }, []);

  return (
    <div className={`app-shell ${theme === "dark" ? "theme-dark" : "theme-light"}`}>
      <div
        className={`sidebar-backdrop ${mobileSidebarOpen ? "is-visible" : ""}`}
        onClick={() => setMobileSidebarOpen(false)}
      />
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => {
          setActivePage(page);
          setMobileSidebarOpen(false);
        }}
        activeUsers={activeUsers}
        currentUserName={currentUserName}
        className={mobileSidebarOpen ? "mobile-open" : ""}
        onLogin={() => {
          const nextName = window.prompt("Enter your name", currentUserName || "Maya Chen");
          if (nextName && nextName.trim()) {
            setCurrentUserName(nextName.trim());
          }
        }}
        onLogout={async () => {
          if (!currentUserName) return;
          try {
            await request("/api/presence", {
              method: "DELETE",
              body: JSON.stringify({ id: presenceId }),
            });
          } catch {
            // ignore cleanup failures
          }

          setSessionUsers((existing) => existing.filter((user) => user.id !== presenceId));
          setCurrentUserName("");
        }}
      />
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="topbar-workspace-button"
              aria-label={mobileSidebarOpen ? "Close navigation" : "Open navigation"}
              onClick={() => setMobileSidebarOpen((open) => !open)}
            >
              <img className="topbar-workspace-icon" src="/topbar.svg" alt="" aria-hidden="true" />
            </button>
            <div className="workspace-switcher">
              <span className="topbar-crumb">Demo Workspace</span>
            </div>
            <ChevronRight className="crumb-chevron" aria-hidden="true" />
            <span className="topbar-crumb">{pageMeta[activePage]?.label || "Home"}</span>
            {isBoardView && (
              <>
                <ChevronRight className="crumb-chevron" aria-hidden="true" />
                <img className="cycle-icon" src="/ring.svg" alt="" aria-hidden="true" />
                <strong className="topbar-crumb topbar-sprint-name">
                  {pageMeta[activePage]?.subLabel || "Test Sprint"}
                </strong>
                <ChevronDown className="sprint-chevron" aria-hidden="true" />
                <button type="button" className="crumb-icon" aria-label="Favorite sprint">
                  <Star size={15} aria-hidden="true" />
                </button>
                <button type="button" className="crumb-icon" aria-label="More sprint actions">
                  <MoreHorizontal size={16} aria-hidden="true" />
                </button>
              </>
            )}
          </div>
          <div className="topbar-actions">
            <button
              type="button"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              className="theme-toggle icon-button"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={() => setModal({ task: null })} className="primary-button">
              <Plus size={16} /> <span className="primary-button-label">New task</span>
            </button>
          </div>
        </header>
        <main className="app-container">
          {isBoardView ? (
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
                        onOpen={(task) => setModal({ task })}
                      />
                    ))}
                  </section>
                </DndContext>
              )}
            </>
          ) : (
            <div className="blank-page" aria-label={`${pageMeta[activePage]?.label || "Page"} view`}>
              <div className="blank-page-message">We don’t have this feature yet.</div>
            </div>
          )}
        </main>
      </div>
      {toast && <div className="toast">{toast}</div>}
      {modal && (
        <TaskModal
          task={modal.task}
          onClose={() => setModal(null)}
          onSave={(draft) => {
            saveTask(draft, modal.task?.id);
            setModal(null);
          }}
          onDelete={deleteTask}
        />
      )}
    </div>
  );
}
