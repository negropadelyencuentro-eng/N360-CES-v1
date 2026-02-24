import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../context/AuthContext";
import {
  SectionHeader,
  Loader,
  EmptyState,
  Modal,
  Badge,
} from "../../../components/ui/index";

const EMPTY_FORM = { name: "", username: "", password: "", status: "ACTIVO", cuota_status: "AL_DIA" };

export default function Alumnos() {
  const { user } = useAuth();
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmModal, setConfirmModal] = useState(null);

  useEffect(() => { fetchAlumnos(); }, []);

  const fetchAlumnos = async () => {
    let query = supabase
      .from("users")
      .select("id, name, username, status, cuota_status, created_at")
      .eq("role", "ALUMNO")
      .order("name");
    if (user.gym_id) query = query.eq("gym_id", user.gym_id);
    const { data, error } = await query;
    if (!error && data) setAlumnos(data);
    setLoading(false);
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (alumno) => {
    setEditTarget(alumno);
    setForm({ name: alumno.name, username: alumno.username, password: "", status: alumno.status, cuota_status: alumno.cuota_status || "AL_DIA" });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.username.trim()) {
      setFormError("Nombre y usuario son obligatorios.");
      return;
    }
    if (!editTarget && !form.password.trim()) {
      setFormError("La contraseña es obligatoria para nuevos alumnos.");
      return;
    }
    setSaving(true);
    setFormError("");

    if (editTarget) {
      const updates = { name: form.name.trim(), username: form.username.trim(), status: form.status, cuota_status: form.cuota_status };
      if (form.password.trim()) updates.password = form.password.trim();
      const { error } = await supabase.from("users").update(updates).eq("id", editTarget.id);
      if (error) { setFormError(error.message.includes("unique") ? "Ese usuario ya existe." : "Error al guardar."); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("users").insert({
        name: form.name.trim(), username: form.username.trim(), password: form.password.trim(),
        role: "ALUMNO", status: "ACTIVO", gym_id: user.gym_id ?? null,
      });
      if (error) { setFormError(error.message.includes("unique") ? "Ese usuario ya existe." : "Error al crear."); setSaving(false); return; }
    }

    setSaving(false);
    setModalOpen(false);
    fetchAlumnos();
  };

  const handleToggleStatus = async (alumno) => {
    const newStatus = alumno.status === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    await supabase.from("users").update({ status: newStatus }).eq("id", alumno.id);
    setConfirmModal(null);
    fetchAlumnos();
  };

  const filtered = alumnos.filter(
    (a) => a.name?.toLowerCase().includes(search.toLowerCase()) ||
           a.username?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loader label="Cargando alumnos..." />;

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Alumnos"
        description={`${alumnos.length} alumno${alumnos.length !== 1 ? "s" : ""} registrado${alumnos.length !== 1 ? "s" : ""}`}
        action={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo alumno
          </button>
        }
      />

      {/* Buscador */}
      <div className="mb-4 relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input className="input pl-9" placeholder="Buscar por nombre o usuario..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState message={search ? "Sin resultados." : "No hay alumnos registrados."} />
      ) : (
        <div className="space-y-2">
          {filtered.map((alumno) => (
            <AlumnoCard
              key={alumno.id}
              alumno={alumno}
              onEdit={() => openEdit(alumno)}
              onToggle={() => setConfirmModal(alumno)}
            />
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setFormError(""); }} title={editTarget ? "Editar alumno" : "Nuevo alumno"}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400 font-medium">Nombre completo</label>
            <input className="input" placeholder="Juan Pérez" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400 font-medium">Usuario</label>
            <input className="input" placeholder="juanperez" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400 font-medium">
              {editTarget ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}
            </label>
            <input type="password" className="input" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          {editTarget && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-medium">Estado</label>
                <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-medium">Estado de cuota</label>
                <select className="input" value={form.cuota_status} onChange={(e) => setForm({ ...form, cuota_status: e.target.value })}>
                  <option value="AL_DIA">✅ Al día</option>
                  <option value="POR_VENCER">⚠️ Por vencer</option>
                  <option value="VENCIDA">❌ Cuota vencida</option>
                </select>
              </div>
            </>
          )}
          {formError && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{formError}</p>}
          <div className="flex gap-3 mt-1">
            <button onClick={() => { setModalOpen(false); setFormError(""); }} className="btn-ghost flex-1">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <><div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />Guardando...</> : editTarget ? "Guardar" : "Crear alumno"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal confirmar toggle */}
      <Modal open={!!confirmModal} onClose={() => setConfirmModal(null)} title={confirmModal?.status === "ACTIVO" ? "Desactivar alumno" : "Activar alumno"}>
        <p className="text-zinc-400 text-sm mb-5">
          {confirmModal?.status === "ACTIVO" ? `¿Desactivar a ${confirmModal?.name}? No podrá iniciar sesión.` : `¿Activar a ${confirmModal?.name}?`}
        </p>
        <div className="flex gap-3">
          <button onClick={() => setConfirmModal(null)} className="btn-ghost flex-1">Cancelar</button>
          <button onClick={() => handleToggleStatus(confirmModal)} className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90 ${confirmModal?.status === "ACTIVO" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}`}>
            {confirmModal?.status === "ACTIVO" ? "Desactivar" : "Activar"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

// Card de alumno — reemplaza la tabla en mobile y desktop
function AlumnoCard({ alumno, onEdit, onToggle }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-semibold">{alumno.name?.[0]?.toUpperCase()}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{alumno.name}</p>
        <p className="text-xs text-zinc-500 truncate">@{alumno.username}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <Badge label={alumno.status} variant={alumno.status === "ACTIVO" ? "active" : "inactive"} />
          <CuotaChip status={alumno.cuota_status} />
          {alumno.created_at && (
            <span className="text-xs text-zinc-600 w-full">
              desde {new Date(alumno.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <button
          onClick={onEdit}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-all active:opacity-70"
        >
          Editar
        </button>
        <button
          onClick={onToggle}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:opacity-70 ${
            alumno.status === "ACTIVO"
              ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
          }`}
        >
          {alumno.status === "ACTIVO" ? "Desactivar" : "Activar"}
        </button>
      </div>
    </div>
  );
}

function CuotaChip({ status }) {
  if (!status || status === "AL_DIA") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Al día</span>
  );
  if (status === "VENCIDA") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-500/20">Cuota vencida</span>
  );
  if (status === "POR_VENCER") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Por vencer</span>
  );
  return null;
}
