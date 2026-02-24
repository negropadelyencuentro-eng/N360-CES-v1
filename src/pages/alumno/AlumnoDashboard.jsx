import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { Loader, EmptyState, Badge } from "../../components/ui/index";
import EjerciciosPanel from "./EjerciciosPanel";
import Logo from "../../components/Logo";

const TODAY = new Date().toISOString().split("T")[0];

const TABS = [
  {
    id: "inicio",
    label: "Inicio",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: "ejercicios",
    label: "Ejercicios",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5h11" /><path d="M6.5 17.5h11" />
        <path d="M3 9.5h2.5v5H3z" /><path d="M18.5 9.5H21v5h-2.5z" />
        <path d="M5.5 12h13" />
      </svg>
    ),
  },
];


function CuotaBadge({ status }) {
  if (!status || status === "AL_DIA") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
        Al día
      </span>
    );
  }
  if (status === "VENCIDA") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
        Cuota vencida
      </span>
    );
  }
  if (status === "POR_VENCER") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
        Por vencer
      </span>
    );
  }
  return null;
}

export default function AlumnoDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("inicio");
  const [rutina, setRutina] = useState(null);
  const [asistencias, setAsistencias] = useState([]);
  const [yaRegistroHoy, setYaRegistroHoy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [rutinaRes, asistenciasRes] = await Promise.all([
      supabase
        .from("routines")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("attendances")
        .select("id, date, status")
        .eq("student_id", user.id)
        .order("date", { ascending: false })
        .limit(30),
    ]);

    if (!rutinaRes.error) setRutina(rutinaRes.data);

    if (!asistenciasRes.error && asistenciasRes.data) {
      setAsistencias(asistenciasRes.data);
      setYaRegistroHoy(asistenciasRes.data.some((a) => a.date === TODAY));
    }

    setLoading(false);
  };

  const handleDescargar = async () => {
    if (!rutina) return;
    setDownloading(true);
    const { data } = await supabase.storage
      .from("routines")
      .createSignedUrl(rutina.file_url, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    setDownloading(false);
  };

  const handleRegistrarAsistencia = async () => {
    if (yaRegistroHoy || registrando) return;
    setRegistrando(true);
    setFeedbackMsg(null);

    const { error } = await supabase.from("attendances").insert({
      student_id: user.id,
      gym_id: user.gym_id ?? null,
      date: TODAY,
      status: "PRESENTE",
    });

    if (error) {
      setFeedbackMsg({ type: "error", text: `Error: ${error.message}` });
    } else {
      setYaRegistroHoy(true);
      setFeedbackMsg({ type: "ok", text: "¡Asistencia registrada!" });
      const { data } = await supabase
        .from("attendances")
        .select("id, date, status")
        .eq("student_id", user.id)
        .order("date", { ascending: false })
        .limit(30);
      if (data) setAsistencias(data);
    }
    setRegistrando(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader label="Cargando tu perfil..." />
    </div>
  );

  return (
    <div className="min-h-screen min-h-[100dvh] bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 border-b border-zinc-800 sticky top-0 bg-black/90 backdrop-blur-sm z-10" style={{paddingTop: "max(16px, env(safe-area-inset-top))", paddingBottom: "16px"}}>
        <Logo variant="full" />
        <button
          onClick={logout}
          className="text-zinc-400 hover:text-white text-sm transition-colors flex items-center gap-2"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Salir
        </button>
      </header>

      {/* Tab bar */}
      <div className="flex border-b border-zinc-800 px-4 bg-black sticky top-[57px] z-10">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all -mb-px ${
              tab === t.id
                ? "border-white text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6 space-y-4">

        {/* ── TAB INICIO ── */}
        {tab === "inicio" && (
          <>
            <div className="mb-2">
              <p className="text-zinc-500 text-sm mb-0.5">Bienvenido</p>
              <div className="flex items-center gap-3 flex-wrap mt-0.5">
                <h1 className="text-xl font-semibold">{user.name?.split(" ")[0]} 👋</h1>
                <CuotaBadge status={user.cuota_status} />
              </div>
            </div>

            {/* Asistencia hoy */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-1">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <path d="m9 16 2 2 4-4" />
                </svg>
                <p className="text-sm font-medium text-zinc-300">Asistencia de hoy</p>
              </div>
              <p className="text-zinc-600 text-xs mb-4 pl-5 capitalize">
                {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
              </p>

              {yaRegistroHoy ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 flex-shrink-0">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span className="text-emerald-400 text-sm font-medium">Ya registraste tu asistencia hoy</span>
                </div>
              ) : (
                <div>
                  <button
                    onClick={handleRegistrarAsistencia}
                    disabled={registrando}
                    className="w-full py-3.5 bg-white text-black font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {registrando ? (
                      <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />Registrando...</>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        ¡Estoy aquí! — Registrar asistencia
                      </>
                    )}
                  </button>
                  {feedbackMsg?.type === "error" && (
                    <p className="text-red-400 text-xs mt-2 text-center">{feedbackMsg.text}</p>
                  )}
                </div>
              )}
            </div>

            {/* Rutina */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <p className="text-sm font-medium text-zinc-300">Mi rutina</p>
              </div>

              {rutina ? (
                <div>
                  <p className="text-white font-semibold mb-1">{rutina.nombre}</p>
                  <p className="text-zinc-500 text-xs mb-4">
                    Asignada el {new Date(rutina.created_at).toLocaleDateString("es-AR")}
                  </p>
                  <button
                    onClick={handleDescargar}
                    disabled={downloading}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    {downloading ? (
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    )}
                    {downloading ? "Descargando..." : "Descargar PDF"}
                  </button>
                </div>
              ) : (
                <EmptyState message="Todavía no tenés una rutina asignada." />
              )}
            </div>

            {/* Historial */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <p className="text-sm font-medium text-zinc-300">Historial de asistencias</p>
                <span className="ml-auto text-xs text-zinc-600">{asistencias.length} registros</span>
              </div>

              {asistencias.length === 0 ? (
                <EmptyState message="Todavía no hay asistencias registradas." />
              ) : (
                <div>
                  {asistencias.map((a) => (
                    <div key={a.id} className="flex items-center justify-between py-3 border-b border-zinc-800/60 last:border-0">
                      <span className="text-sm text-zinc-300 capitalize">
                        {new Date(a.date + "T12:00:00").toLocaleDateString("es-AR", {
                          weekday: "long", day: "numeric", month: "short",
                        })}
                      </span>
                      <Badge label={a.status || "PRESENTE"} variant={a.status === "PRESENTE" ? "active" : "inactive"} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── TAB EJERCICIOS ── */}
        {tab === "ejercicios" && (
          <>
            <div className="mb-2">
              <h1 className="text-xl font-semibold">Banco de ejercicios</h1>
              <p className="text-zinc-500 text-sm mt-0.5">Buscá y filtrá por grupo muscular</p>
            </div>
            <EjerciciosPanel />
          </>
        )}
      </main>
    </div>
  );
}
