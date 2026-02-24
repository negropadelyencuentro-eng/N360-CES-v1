import { useAuth } from "../../../context/AuthContext";
import Logo from "../../../components/Logo";

const SECTION_LABELS = {
  overview: "Overview",
  alumnos: "Alumnos",
  rutinas: "Rutinas",
  asistencias: "Asistencias",
};

export default function Topbar({ section, onMenuClick }) {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between px-4 border-b border-zinc-800 bg-black/80 backdrop-blur-sm sticky top-0 z-10" style={{paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: '12px'}}>
      <div className="flex items-center gap-3">
        {/* Hamburger - mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 active:bg-zinc-700"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div>
          <h1 className="text-sm font-semibold">{SECTION_LABELS[section] || "Dashboard"}</h1>
          <p className="text-zinc-500 text-xs hidden sm:block capitalize">
            {new Date().toLocaleDateString("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
      </div>

      {/* User pill - desktop */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
        <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center">
          <span className="text-[10px] font-semibold">{user?.name?.[0]?.toUpperCase()}</span>
        </div>
        <span className="text-sm text-zinc-300">{user?.name?.split(" ")[0]}</span>
      </div>
    </header>
  );
}
