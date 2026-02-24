import { useState } from "react";
import Logo from "../../../components/Logo";
import { useAuth } from "../../../context/AuthContext";

const NAV_ITEMS = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: "alumnos",
    label: "Alumnos",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "rutinas",
    label: "Rutinas",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    id: "asistencias",
    label: "Asistencias",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="m9 16 2 2 4-4" />
      </svg>
    ),
  },
];

export default function Sidebar({ section, setSection, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();

  const NavLink = ({ item }) => {
    const isActive = section === item.id;
    return (
      <button
        onClick={() => {
          setSection(item.id);
          setMobileOpen?.(false);
        }}
        className={`sidebar-link ${isActive ? "sidebar-link-active" : "sidebar-link-inactive"}`}
      >
        <span className="flex-shrink-0">{item.icon}</span>
        <span>{item.label}</span>
        {isActive && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-black opacity-40" />
        )}
      </button>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-zinc-800 mb-3">
        <Logo variant="full" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        <p className="text-zinc-600 text-xs font-medium uppercase tracking-widest px-3 py-2">
          Menú
        </p>
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.id} item={item} />
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 pb-4 border-t border-zinc-800 pt-4">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-800/60 mb-2">
          <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-white">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="sidebar-link sidebar-link-inactive w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 bg-zinc-950 border-r border-zinc-800 flex-col flex-shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 bg-zinc-950 border-r border-zinc-800 h-full flex flex-col animate-slide-in">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
