import { useEffect, useState, useCallback, useMemo } from "react";
import { API_BASE_URL, request } from "./api/client";
import { useBoard } from "./hooks/useBoard";
import { usePage } from "./hooks/usePage";
import { useTheme, ThemeProvider } from "./context/ThemeContext";
import { makeInitials } from "./utils/format";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import BoardView from "./components/BoardView";
import TaskModal from "./components/TaskModal";

function AppContent() {
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

  const { theme, toggleTheme } = useTheme();
  const {
    activePage,
    setActivePage,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    toggleSidebar,
    isBoardView,
  } = usePage("home");

  const [currentUserName, setCurrentUserName] = useState(
    () => localStorage.getItem("kanban-user-name") || "",
  );
  const [presenceId] = useState(() => {
    const existingId = localStorage.getItem("kanban-presence-id");
    if (existingId) return existingId;
    const nextId = crypto.randomUUID();
    localStorage.setItem("kanban-presence-id", nextId);
    return nextId;
  });
  const [sessionUsers, setSessionUsers] = useState([]);

  const activeUsers = useMemo(() => {
    const list = sessionUsers.length ? sessionUsers : [];
    if (!currentUserName) return list;

    const current = { id: presenceId, name: currentUserName, initials: makeInitials(currentUserName) };
    const allUsers = [current, ...list];
    return allUsers.filter((user, index, arr) =>
      arr.findIndex((candidate) => candidate.id === user.id) === index,
    );
  }, [sessionUsers, currentUserName, presenceId]);

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

  const handleLogin = useCallback(() => {
    const nextName = window.prompt("Enter your name", currentUserName || "Maya Chen");
    if (nextName && nextName.trim()) {
      setCurrentUserName(nextName.trim());
    }
  }, [currentUserName]);

  const handleLogout = useCallback(async () => {
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
  }, [currentUserName, presenceId]);

  const boardTasks = useMemo(() => {
    if (!isBoardView) return [];
    if (activePage === "issues") {
      return visible.filter((task) => (task.type || "task") === "defect");
    }
    if (activePage === "backlog") {
      return visible.filter((task) => task.status === "backlog");
    }
    return visible;
  }, [activePage, isBoardView, visible]);

  return (
    <div className={`app-shell ${theme === "dark" ? "theme-dark" : "theme-light"}`}>
      <div
        className={`sidebar-backdrop ${mobileSidebarOpen ? "is-visible" : ""}`}
        onClick={() => setMobileSidebarOpen(false)}
      />
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        activeUsers={activeUsers}
        currentUserName={currentUserName}
        className={mobileSidebarOpen ? "mobile-open" : ""}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      <div className="app-main">
        <Header
          activePage={activePage}
          theme={theme}
          toggleTheme={toggleTheme}
          onMenuClick={toggleSidebar}
          onNewTask={() => setModal({ task: null })}
          isBoardView={isBoardView}
        />
        <main className="app-container">
          <BoardView
            activePage={activePage}
            visible={visible}
            loading={loading}
            error={error}
            query={query}
            setQuery={setQuery}
            priority={priority}
            setPriority={setPriority}
            assignee={assignee}
            setAssignee={setAssignee}
            assignees={assignees}
            connectionState={connectionState}
            sensors={sensors}
            moveTask={moveTask}
            onOpen={(task) => setModal({ task })}
            makeInitials={makeInitials}
          />
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

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}