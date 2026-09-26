import { useState, useCallback, useMemo } from "react";
import { pageMeta } from "../constants/pages";

export function usePage(initialPage = "home") {
  const [activePage, setActivePage] = useState(initialPage);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navigate = useCallback((page) => {
    if (pageMeta[page]) {
      setActivePage(page);
      setMobileSidebarOpen(false);
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setMobileSidebarOpen((open) => !open);
  }, []);

  const isBoardView = useMemo(
    () => pageMeta[activePage]?.showBoard ?? false,
    [activePage]
  );

  const pageLabel = useMemo(
    () => pageMeta[activePage]?.label || "Home",
    [activePage]
  );

  const pageSubLabel = useMemo(
    () => pageMeta[activePage]?.subLabel,
    [activePage]
  );

  return {
    activePage,
    setActivePage: navigate,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    toggleSidebar,
    isBoardView,
    pageLabel,
    pageSubLabel,
  };
}