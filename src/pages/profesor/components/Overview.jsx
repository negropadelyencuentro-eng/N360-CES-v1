import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../context/AuthContext";
import { StatCard, Loader } from "../../../components/ui/index";

export default function Overview({ setSection }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [alumnosRes, rutinasRes, asistenciasHoyRes] = await Promise.all([
        supabase.from("users").select("id", { count: "exact" }).eq("role", "ALUMNO").eq("gym_id", user.gym_id),
        supabase.from("routines").select("id", { count: "exact" }).eq("gym_id", user.gym_id),
        supabase.from("attendances").select("id", { count: "exact" }).gte("date", new Date().toISOString().split("T")[0]),
      ]);

      setStats({
        alumnos: alumnosRes.count ?? 0,
        rutinas: rutinasRes.count ?? 0,
        asistenciasHoy: asistenciasHoyRes.count ?? 0,
      });
    } catch {
      setStats({ alumnos: 0, rutinas: 0, asistenciasHoy: 0 });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader label="Cargando estadísticas..." />;

  const cards = [
    {
      title: "Alumnos activos",
      value: stats.alumnos,
      sub: "Registrados en el sistema",
      icon: ({ size, className }) => (
        <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      ),
    },
    {
      title: "Rutinas creadas",
      value: stats.rutinas,
      sub: "Planes de entrenamiento",
      icon: ({ size, className }) => (
        <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      title: "Asistencias hoy",
      value: stats.asistenciasHoy,
      sub: new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long" }),
      icon: ({ size, className }) => (
        <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <path d="m9 16 2 2 4-4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <p className="text-zinc-400 text-sm">
          Bienvenido de vuelta, <span className="text-white font-medium">{user?.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      {/* Quick actions */}
      <div className="card p-6">
        <p className="text-sm font-medium mb-4 text-zinc-300">Acciones rápidas</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Ver alumnos", emoji: "👥", section: "alumnos" },
            { label: "Subir rutina", emoji: "📄", section: "rutinas" },
            { label: "Ver asistencias", emoji: "✅", section: "asistencias" },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => setSection(a.section)}
              className="flex flex-col items-start gap-2 p-4 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all text-sm text-left"
            >
              <span className="text-xl">{a.emoji}</span>
              <span className="text-zinc-300">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
