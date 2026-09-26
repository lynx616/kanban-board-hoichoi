import { useTheme } from "../context/ThemeContext";
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
} from "lucide-react";
import { pageMeta } from "../constants/pages";

export default function Header({
  activePage,
  theme,
  toggleTheme,
  onMenuClick,
  onNewTask,
  isBoardView,
}) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-workspace-button"
          aria-label={onMenuClick ? "Close navigation" : "Open navigation"}
          onClick={onMenuClick}
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
          onClick={toggleTheme}
          className="theme-toggle icon-button"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button onClick={onNewTask} className="primary-button">
          <Plus size={16} /> <span className="primary-button-label">New task</span>
        </button>
      </div>
    </header>
  );
}