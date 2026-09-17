import {
  ChevronDown,
  CircleDot,
  Inbox,
  LogIn,
  LogOut,
  Milestone,
  PanelsTopLeft,
  Search,
  Settings2,
  SquarePen,
} from "lucide-react";

const pageLinks = [
  { id: "home", label: "Home", icon: PanelsTopLeft },
  { id: "issues", label: "Issues", icon: CircleDot },
  { id: "backlog", label: "Backlog", icon: Inbox },
  { id: "upcoming", label: "Upcoming", icon: Milestone },
  { id: "cycles", label: "Cycles", icon: Milestone },
  { id: "current", label: "Current", icon: CircleDot },
];

export default function Sidebar({
  activePage = "home",
  onNavigate = () => {},
  activeUsers = [],
  currentUserName = "",
  onLogin = () => {},
  onLogout = () => {},
  className = "",
}) {
  return (
    <aside className={`sidebar ${className}`.trim()}>
      <div className="sidebar-brand">
        <img className="brand-mark" src="/Container (2).png" alt="AI" />
        <span className="brand-label">Demo Workspace</span>
        <ChevronDown className="brand-chevron" size={14} aria-hidden="true" />
        <button type="button" className="sidebar-icon-button" aria-label="Search workspace">
          <Search size={15} aria-hidden="true" />
        </button>
        <button type="button" className="sidebar-compose-button" aria-label="Create new item">
          <span className="sidebar-compose-icon">
            <SquarePen size={17} aria-hidden="true" />
          </span>
        </button>
      </div>
      <nav className="sidebar-nav" aria-label="Workspace navigation">
        <p className="nav-label">Workspace</p>
        {pageLinks.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`nav-item sub-item workspace-page ${activePage === id ? "active" : ""}`}
            onClick={() => onNavigate(id)}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
        <p className="nav-label nav-label-spaced">Active users</p>
        <div className="active-users" aria-label="Active collaborators">
          {activeUsers.length ? (
            activeUsers.map((user) => (
              <div className="active-user" key={user.name} title={`${user.name} is active`}>
                <span className="active-user-avatar">
                  <span className="active-user-dot" />
                  {user.initials}
                </span>
                <span className="active-user-name">{user.name}</span>
              </div>
            ))
          ) : (
            <span className="active-users-empty">Waiting for collaborators</span>
          )}
        </div>
      </nav>
      <div className="sidebar-footer">
        <div className="footer-actions">
          <button
            type="button"
            className={`nav-item ${activePage === "settings" ? "active" : ""}`}
            onClick={() => onNavigate("settings")}
          >
            <Settings2 size={14} /> Settings
          </button>
          {currentUserName ? (
            <button type="button" className="nav-item" onClick={onLogout}>
              <LogOut size={14} /> Log out
            </button>
          ) : (
            <button type="button" className="nav-item" onClick={onLogin}>
              <LogIn size={14} /> Log in
            </button>
          )}
        </div>
        <span className="user-avatar">
          {currentUserName
            ? currentUserName
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()
            : "--"}
        </span>
      </div>
    </aside>
  );
}
