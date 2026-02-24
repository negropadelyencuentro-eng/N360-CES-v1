import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import ProfesorDashboard from "./pages/profesor/ProfesorDashboard";
import AlumnoDashboard from "./pages/alumno/AlumnoDashboard";

export default function App() {
  const { user } = useAuth();

  if (!user) return <Login />;

  if (user.role === "PROFESOR") return <ProfesorDashboard />;
  if (user.role === "ALUMNO") return <AlumnoDashboard />;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="card p-8 text-center">
        <p className="text-zinc-400 mb-4">Rol no reconocido: <span className="text-white">{user.role}</span></p>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="btn-primary">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
