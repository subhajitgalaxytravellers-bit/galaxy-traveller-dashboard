// hooks/use-sidebar.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const MOBILE_BREAKPOINT = 768;
const SidebarCtx = createContext(null);

export function SidebarProvider({ children, persist = true }) {
  // Track viewport
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${MOBILE_BREAKPOINT - 1}px)`);
    const apply = () => setIsMobile(mq.matches);
    apply();
    if (mq.addEventListener) mq.addEventListener("change", apply);
    else mq.addListener(apply); // Safari <14
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", apply);
      else mq.removeListener(apply);
    };
  }, []);

  // Desktop open state (persisted)
  const [desktopOpen, setDesktopOpen] = useState(() => {
    if (persist && typeof window !== "undefined") {
      const v = localStorage.getItem("sidebar:open");
      return v === null ? true : v === "true";
    }
    return true;
  });
  useEffect(() => {
    if (persist && !isMobile)
      localStorage.setItem("sidebar:open", String(desktopOpen));
  }, [desktopOpen, persist, isMobile]);

  // Mobile open state (ALWAYS default closed)
  const [mobileOpen, setMobileOpen] = useState(false);

  const value = useMemo(() => {
    const open = isMobile ? mobileOpen : desktopOpen;
    return {
      open,
      isMobile,
      toggle: () =>
        isMobile ? setMobileOpen((v) => !v) : setDesktopOpen((v) => !v),
      openSidebar: () =>
        isMobile ? setMobileOpen(true) : setDesktopOpen(true),
      closeSidebar: () =>
        isMobile ? setMobileOpen(false) : setDesktopOpen(false),
    };
  }, [desktopOpen, mobileOpen, isMobile]);

  return <SidebarCtx.Provider value={value}>{children}</SidebarCtx.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarCtx);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
