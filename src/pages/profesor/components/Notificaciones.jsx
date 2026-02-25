import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../context/AuthContext";
import { SectionHeader, Loader, EmptyState, Modal } from "../../../components/ui/index";

export default function Notificaciones() {
  const { user } = useAuth();
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", target: "all", student_id: "" });
  const [feedback, setFeedback] = useState(null);

  useEffect(() => { fetchAlumnos(); }, []);

  const fetchAlumnos = async () => {
    let q = supabase.from("users").select("id, name").eq("role", "ALUMNO").order("name");
    if (user.gym_id) q = q.eq("gym_id", user.gym_id);
    const { data } = await q;
    setAlumnos(data || []);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      setFeedback({ type: "error", text: "Título y mensaje son obligatorios." });
      return;
    }
    if (form.target === "one" && !form.student_id) {
      setFeedback({ type: "error", text: "Seleccioná un alumno." });
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      const payload = {
        title: form.title.trim(),
        body: form.body.trim(),
      };

      if (form.target === "all") {
        payload.userIds = alumnos.map((a) => a.id);
      } else {
        payload.userId = form.student_id;
      }

      const res = await fetch("/api/send-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.sent === 0 && data.message?.includes("Sin subscripciones")) {
        setFeedback({ type: "warn", text: "El alumno no tiene notificaciones activadas en su dispositivo." });
      } else {
        setFeedback({ type: "ok", text: `✅ Notificación enviada a ${data.sent} dispositivo${data.sent !== 1 ? "s" : ""}.` });
        setForm({ title: "", body: "", target: "all", student_id: "" });
      }
    } catch {
      setFeedback({ type: "error", text: "Error al enviar la notificación." });
    } finally {
      setSending(false);
    }
  };

  const TEMPLATES = [
    { label: "Cuota por vencer", title: "⚠️ Tu cuota vence pronto", body: "Recordá renovar tu cuota para seguir entrenando sin interrupciones." },
    { label: "Cuota vencida", title: "❌ Cuota vencida", body: "Tu cuota está vencida. Contactá al centro para renovarla." },
    { label: "Nueva rutina", title: "💪 Nueva rutina disponible", body: "Tu profesor subió una nueva rutina. Entrá a la app para verla." },
    { label: "Recordatorio clase", title: "🏋️ ¡Hoy es día de entrenamiento!", body: "No olvides venir hoy. Te esperamos en el centro." },
  ];

  if (loading) return <Loader label="Cargando..." />;

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Notificaciones"
        description="Enviá mensajes push a tus alumnos"
        action={
          <button onClick={() => { setModalOpen(true); setFeedback(null); }} className="btn-primary flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />
            </svg>
            Nueva notificación
          </button>
        }
      />

      {/* Templates rápidos */}
      <div className="card p-5 mb-4">
        <p className="text-sm font-medium text-zinc-300 mb-3">Envíos rápidos — a todos los alumnos</p>
        <div className="grid grid-cols-1 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              onClick={async () => {
                setSending(true);
                setFeedback(null);
                try {
                  const res = await fetch("/api/send-push", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userIds: alumnos.map((a) => a.id),
                      title: t.title,
                      body: t.body,
                    }),
                  });
                  const data = await res.json();
                  setFeedback({ type: "ok", text: `✅ Enviado a ${data.sent} dispositivo${data.sent !== 1 ? "s" : ""}.` });
                } catch {
                  setFeedback({ type: "error", text: "Error al enviar." });
                } finally {
                  setSending(false);
                }
              }}
              disabled={sending}
              className="flex items-center justify-between px-4 py-3 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all text-left disabled:opacity-50 active:opacity-60"
            >
              <div>
                <p className="text-sm font-medium text-white">{t.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5 truncate">{t.body}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 flex-shrink-0 ml-3">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`px-4 py-3 rounded-lg text-sm mb-4 border ${
          feedback.type === "ok" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
          feedback.type === "warn" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
          "bg-red-500/10 text-red-400 border-red-500/20"
        }`}>
          {feedback.text}
        </div>
      )}

      {/* Modal personalizado */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Enviar notificación">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400 font-medium">Destinatario</label>
            <select className="input" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value, student_id: "" })}>
              <option value="all">Todos los alumnos</option>
              <option value="one">Un alumno específico</option>
            </select>
          </div>

          {form.target === "one" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 font-medium">Alumno</label>
              <select className="input" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}>
                <option value="">Seleccioná un alumno</option>
                {alumnos.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400 font-medium">Título</label>
            <input className="input" placeholder="Ej: ⚠️ Tu cuota vence pronto" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400 font-medium">Mensaje</label>
            <textarea className="input resize-none" rows={3} placeholder="Escribí el mensaje..." value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </div>

          {feedback && (
            <div className={`px-3 py-2 rounded-lg text-sm border ${
              feedback.type === "ok" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
              feedback.type === "warn" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
              "bg-red-500/10 text-red-400 border-red-500/20"
            }`}>
              {feedback.text}
            </div>
          )}

          <div className="flex gap-3 mt-1">
            <button onClick={() => setModalOpen(false)} className="btn-ghost flex-1">Cancelar</button>
            <button onClick={handleSend} disabled={sending} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
              {sending ? <><div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />Enviando...</> : "Enviar"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
