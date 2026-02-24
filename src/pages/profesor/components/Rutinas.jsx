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
  Modal,
} from "../../../components/ui/index";

export default function Rutinas() {
  const { user } = useAuth();
  const [rutinas, setRutinas] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ student_id: "", nombre: "", file: null });
  const [uploadError, setUploadError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    // Traer alumnos primero (sin join, más robusto)
    let alumnosQuery = supabase
      .from("users")
      .select("id, name")
      .eq("role", "ALUMNO")
      .order("name");

    if (user.gym_id) alumnosQuery = alumnosQuery.eq("gym_id", user.gym_id);

    const alumnosRes = await alumnosQuery;
    const alumnosData = alumnosRes.data || [];
    setAlumnos(alumnosData);

    // Mapa id -> name para cruzar manualmente sin depender de FK
    const alumnosMap = {};
    alumnosData.forEach((a) => { alumnosMap[a.id] = a.name; });

    // Traer rutinas sin join
    let rutinasQuery = supabase
      .from("routines")
      .select("id, nombre, file_url, created_at, student_id, gym_id")
      .order("created_at", { ascending: false });

    if (user.gym_id) rutinasQuery = rutinasQuery.eq("gym_id", user.gym_id);

    const rutinasRes = await rutinasQuery;

    console.log("[Rutinas] res:", rutinasRes);

    if (!rutinasRes.error) {
      // Cruzar nombre del alumno manualmente
      const rutinasConNombre = (rutinasRes.data || []).map((r) => ({
        ...r,
        alumno_nombre: alumnosMap[r.student_id] || "—",
      }));
      setRutinas(rutinasConNombre);
    }

    setLoading(false);
  };

  const handleUpload = async () => {
    if (!form.student_id || !form.file) {
      setUploadError("Seleccioná un alumno y un archivo PDF.");
      return;
    }
    if (form.file.type !== "application/pdf") {
      setUploadError("Solo se aceptan archivos PDF.");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const safeName = form.file.name.replace(/\s+/g, "_");
      const fileName = `${form.student_id}/${Date.now()}_${safeName}`;

      const { error: storageError } = await supabase.storage
        .from("routines")
        .upload(fileName, form.file);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase.from("routines").insert({
        student_id: form.student_id,
        gym_id: user.gym_id ?? null,
        profesor_id: user.id,
        nombre: form.nombre.trim() || form.file.name,
        file_url: fileName,
      });

      if (dbError) throw dbError;

      setModalOpen(false);
      setForm({ student_id: "", nombre: "", file: null });
      fetchData();
    } catch (err) {
      setUploadError(err.message || "Error al subir la rutina.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileUrl) => {
    const { data } = await supabase.storage
      .from("routines")
      .createSignedUrl(fileUrl, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    // Borrar archivo del storage
    await supabase.storage.from("routines").remove([deleteTarget.file_url]);

    // Borrar registro de la DB
    await supabase.from("routines").delete().eq("id", deleteTarget.id);

    setDeleteTarget(null);
    setDeleting(false);
    fetchData();
  };

  if (loading) return <Loader label="Cargando rutinas..." />;

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Rutinas"
        description="Planes de entrenamiento en PDF"
        action={
          <button
            onClick={() => { setModalOpen(true); setUploadError(""); setForm({ student_id: "", nombre: "", file: null }); }}
            className="btn-primary flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Subir rutina
          </button>
        }
      />

      {rutinas.length === 0 ? (
        <EmptyState message="No hay rutinas cargadas aún." />
      ) : (
        <Table headers={["Rutina", "Alumno", "Fecha", ""]}>
          {rutinas.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <span className="text-sm">{r.nombre}</span>
                </div>
              </TableCell>
              <TableCell secondary>{r.alumno_nombre || "—"}</TableCell>
              <TableCell secondary>
                {new Date(r.created_at).toLocaleDateString("es-AR")}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(r.file_url)}
                    className="btn-ghost text-xs px-3 py-1.5"
                  >
                    Descargar
                  </button>
                  <button
                    onClick={() => setDeleteTarget(r)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all"
                  >
                    Eliminar
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      {/* ── Modal subir ── */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setUploadError(""); }}
        title="Subir rutina PDF"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400 font-medium">Alumno</label>
            <select
              className="input"
              value={form.student_id}
              onChange={(e) => setForm({ ...form, student_id: e.target.value })}
            >
              <option value="">Seleccioná un alumno</option>
              {alumnos.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400 font-medium">Nombre (opcional)</label>
            <input
              className="input"
              placeholder="Ej: Rutina de fuerza - Semana 1"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400 font-medium">Archivo PDF</label>
            <div className="border border-dashed border-zinc-700 rounded-lg p-4 text-center hover:border-zinc-500 transition-colors">
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                id="pdf-upload"
                onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
              />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                {form.file ? (
                  <span className="text-white text-sm">{form.file.name}</span>
                ) : (
                  <span className="text-zinc-500 text-sm">Hacé clic para seleccionar un PDF</span>
                )}
              </label>
            </div>
          </div>

          {uploadError && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {uploadError}
            </p>
          )}

          <div className="flex gap-3 mt-1">
            <button onClick={() => { setModalOpen(false); setUploadError(""); }} className="btn-ghost flex-1">
              Cancelar
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <><div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />Subiendo...</>
              ) : "Subir rutina"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal confirmar eliminar ── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar rutina"
      >
        <p className="text-zinc-400 text-sm mb-5">
          ¿Eliminar <span className="text-white font-medium">{deleteTarget?.nombre}</span>? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteTarget(null)} className="btn-ghost flex-1">
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2 rounded-lg font-semibold text-sm bg-red-500 text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? (
              <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Eliminando...</>
            ) : "Sí, eliminar"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
