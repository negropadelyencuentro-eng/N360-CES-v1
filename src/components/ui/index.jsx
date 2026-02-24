// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ title, value, sub, icon: Icon }) {
  return (
    <div className="card p-6 animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <p className="text-zinc-400 text-sm font-medium">{title}</p>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
            <Icon size={15} className="text-zinc-300" />
          </div>
        )}
      </div>
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="text-zinc-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && <p className="text-zinc-500 text-sm mt-0.5">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────────
export function EmptyState({ message = "No hay datos disponibles." }) {
  return (
    <div className="py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3">
        <span className="text-2xl">📭</span>
      </div>
      <p className="text-zinc-500 text-sm">{message}</p>
    </div>
  );
}

// ─── Loader ─────────────────────────────────────────────────────────────────────
export function Loader({ label = "Cargando..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      <p className="text-zinc-500 text-sm">{label}</p>
    </div>
  );
}

// ─── Table ─────────────────────────────────────────────────────────────────────
export function Table({ headers, children }) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-zinc-800">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function TableRow({ children, onClick }) {
  return (
    <tr
      onClick={onClick}
      className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/40 transition-colors"
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, secondary = false }) {
  return (
    <td className={`px-4 py-3.5 ${secondary ? "text-zinc-400" : "text-white"}`}>
      {children}
    </td>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ label, variant = "default" }) {
  const variants = {
    active: "badge-active",
    inactive: "badge-inactive",
    default: "bg-zinc-800 text-zinc-300 border border-zinc-700 px-2.5 py-0.5 rounded-full text-xs font-medium",
  };
  return <span className={variants[variant] || variants.default}>{label}</span>;
}

// ─── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm text-zinc-400">{label}</label>}
      <input className="input" {...props} />
    </div>
  );
}
