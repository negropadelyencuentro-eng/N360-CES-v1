import { useState } from "react";
import Logo from "../components/Logo";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Completá todos los campos.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: dbError } = await supabase
        .from("users")
        .select("*")
        .eq("username", username.trim())
        .eq("password", password)
        .eq("status", "ACTIVO")
        .single();

      if (dbError || !data) {
        setError("Usuario o contraseña incorrectos.");
        return;
      }

      login(data);
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="w-full max-w-sm animate-fade-in relative z-10">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Logo variant="login" />
        </div>

        {/* Card */}
        <div className="card p-8">
          <h1 className="text-base font-semibold mb-1">Iniciar sesión</h1>
          <p className="text-zinc-500 text-sm mb-6">Ingresá con tus credenciales</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 font-medium">Usuario</label>
              <input
                className="input"
                placeholder="tu_usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 font-medium">Contraseña</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Ingresando...</span>
                </>
              ) : (
                "Ingresar"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          N360 CES · Sistema de gestión
        </p>
      </div>
    </div>
  );
}
