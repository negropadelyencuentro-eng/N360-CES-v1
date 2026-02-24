// Logo reutilizable con variantes de tamaño
// variant: "full" (logo + texto) | "icon" (solo logo) | "login" (grande para login)

export default function Logo({ variant = "full", className = "" }) {
  if (variant === "login") {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <img
          src="/logo.png"
          alt="N360 CES"
          className="w-24 h-24 object-contain invert"
          // invert hace el logo blanco sobre fondo negro
        />
        <div className="text-center">
          <p className="text-white font-bold text-2xl tracking-tight leading-none">N360 CES</p>
          <p className="text-zinc-500 text-xs mt-1 tracking-widest uppercase">Centro de Entrenamiento y Salud</p>
        </div>
      </div>
    );
  }

  if (variant === "icon") {
    return (
      <img
        src="/logo.png"
        alt="N360"
        className={`object-contain invert ${className}`}
      />
    );
  }

  // variant === "full" — logo pequeño + nombre al lado
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/logo.png"
        alt="N360"
        className="w-8 h-8 object-contain invert flex-shrink-0"
      />
      <div className="leading-none">
        <p className="text-white font-bold text-sm tracking-tight">N360 CES</p>
        <p className="text-zinc-500 text-[10px] tracking-wider uppercase">Centro de Entrenamiento y Salud</p>
      </div>
    </div>
  );
}
