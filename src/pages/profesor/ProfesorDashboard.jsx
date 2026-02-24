import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Overview from "./components/Overview";
import Alumnos from "./components/Alumnos";
import Rutinas from "./components/Rutinas";
import Asistencias from "./components/Asistencias";

const SECTIONS = {
  overview: Overview,
  alumnos: Alumnos,
  rutinas: Rutinas,
  asistencias: Asistencias,
};

export default function ProfesorDashboard() {
  const [section, setSection] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const ActiveSection = SECTIONS[section] || Overview;

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <Sidebar
        section={section}
        setSection={setSection}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar section={section} onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          {section === "overview" && <ActiveSection setSection={setSection} />}
          {section !== "overview" && <ActiveSection />}
        </main>
      </div>
    </div>
  );
}
