import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../context/AuthContext";
import {
  SectionHeader,
  Loader,
  EmptyState,
  Table,
  TableRow,
  TableCell,
  Badge,
} from "../../../components/ui/index";

export default function Asistencias() {
  const { user } = useAuth();
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [filterAlumno, setFilterAlumno] = useState("");

  useEffect(() => {
    fetchAsistencias();
  }, []);

  const fetchAsistencias = async () => {
    const { data, error } = await supabase
      .from("attendances")
      .select("id, date, status, users(id, name)")
      .eq("gym_id", user.gym_id)
      .order("date", { ascending: false })
      .limit(200);

    if (!error) setAsistencias(data || []);
    setLoading(false);
  };

  // Nombres únicos para el filtro
  const nombresUnicos = [...new Map(
    asistencias.map((a) => [a.users?.id, a.users?.name])
  ).entries()].filter(([id]) => id);

  const filtered = asistencias.filter((a) => {
    const matchDate = filterDate ? a.date === filterDate : true;
    const matchAlumno = filterAlumno ? a.users?.id === filterAlumno : true;
    return matchDate && matchAlumno;
  });

  // Cuenta de asistencias hoy
  const hoy = new Date().toISOString().split("T")[0];
  const hoyCount = asistencias.filter((a) => a.date === hoy).length;

  if (loading) return <Loader label="Cargando asistencias..." />;

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Asistencias"
        description="Los alumnos registran su propia asistencia desde su panel"
      />

      {/* Stat rápida */}
      <div className="card p-4 mb-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div>
          <p className="text-2xl font-semibold">{hoyCount}</p>
          <p className="text-zinc-500 text-xs">
            asistencia{hoyCount !== 1 ? "s" : ""} hoy · {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="date"
          className="input max-w-[180px]"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        <select
          className="input max-w-[200px]"
          value={filterAlumno}
          onChange={(e) => setFilterAlumno(e.target.value)}
        >
          <option value="">Todos los alumnos</option>
          {nombresUnicos.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        {(filterDate || filterAlumno) && (
          <button
            onClick={() => { setFilterDate(""); setFilterAlumno(""); }}
            className="btn-ghost"
          >
            Limpiar
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message={filterDate || filterAlumno ? "Sin resultados para ese filtro." : "No hay asistencias registradas aún."} />
      ) : (
        <Table headers={["Alumno", "Fecha", "Estado"]}>
          {filtered.map((a) => (
            <TableRow key={a.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold">{a.users?.name?.[0]?.toUpperCase()}</span>
                  </div>
                  {a.users?.name || "—"}
                </div>
              </TableCell>
              <TableCell secondary>
                {new Date(a.date + "T12:00:00").toLocaleDateString("es-AR", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </TableCell>
              <TableCell>
                <Badge
                  label={a.status || "PRESENTE"}
                  variant={a.status === "PRESENTE" ? "active" : "inactive"}
                />
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}
    </div>
  );
}
