import { useEffect, useState, useCallback } from "react";

// Dev: proxy de Vite → /wger
// Prod: Vercel serverless function → /api/exercises
const IS_DEV = import.meta.env.DEV;
const LIMIT = 20;

// Categorías de wger con sus IDs reales
const MUSCLE_GROUPS = [
  { id: "", label: "Todos" },
  { id: "chest", label: "Pecho",        categoryId: 11 },
  { id: "back", label: "Espalda",        categoryId: 12 },
  { id: "shoulders", label: "Hombros",   categoryId: 13 },
  { id: "arms", label: "Brazos",         categoryId: 8  },
  { id: "legs", label: "Piernas",        categoryId: 10 },
  { id: "abs", label: "Core / Abdomen",  categoryId: 10 },
  { id: "glutes", label: "Glúteos",      categoryId: 14 },
  { id: "cardio", label: "Cardio",       categoryId: 15 },
];

export default function EjerciciosPanel() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [muscleGroup, setMuscleGroup] = useState(MUSCLE_GROUPS[0]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const buildUrl = useCallback((group, offset = 0) => {
    const params = new URLSearchParams({
      format: "json",
      limit: LIMIT,
      offset,
    });
    if (group.categoryId) params.set("category", group.categoryId);

    if (IS_DEV) {
      // Vite proxy → wger.de
      return `/wger/api/v2/exerciseinfo/?${params.toString()}`;
    } else {
      // Vercel serverless function
      return `/api/exercises?${params.toString()}`;
    }
  }, []);

  const fetchExercises = useCallback(async (group, append = false) => {
    if (!append) {
      setLoading(true);
      setExercises([]);
      setSelected(null);
      setNextUrl(null);
    } else {
      setLoadingMore(true);
    }
    setError("");

    try {
      const url = append ? nextUrl : buildUrl(group);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      // Prioridad: español (6) → inglés (2) → cualquier traducción disponible
      const results = (json.results || [])
        .map((e) => {
          const esTranslation = e.translations?.find((t) => t.language === 6);
          const enTranslation = e.translations?.find((t) => t.language === 2);
          const anyTranslation = e.translations?.[0];
          const translation = esTranslation || enTranslation || anyTranslation;
          if (!translation?.name?.trim()) return null;
          return {
            ...e,
            name: translation.name,
            description: translation.description || "",
            isSpanish: !!esTranslation,
          };
        })
        .filter(Boolean);

      if (append) {
        setExercises((prev) => [...prev, ...results]);
      } else {
        setExercises(results);
      }

      // Adaptar URL del siguiente page según entorno
      if (json.next) {
        if (IS_DEV) {
          setNextUrl(json.next.replace("https://wger.de", "/wger"));
        } else {
          // Extraer params y construir URL para la serverless function
          const nextParams = new URL(json.next).search;
          setNextUrl(`/api/exercises${nextParams}&format=json`);
        }
      } else {
        setNextUrl(null);
      }
    } catch (err) {
      console.error("[EjerciciosPanel]", err);
      // Fallback a lista offline
      const offline = FALLBACK_EXERCISES.filter(
        (e) => !muscleGroup.categoryId || e.categoryId === muscleGroup.categoryId
      );
      if (append) {
        setExercises((prev) => [...prev, ...offline]);
      } else {
        setExercises(offline);
      }
      setNextUrl(null);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [nextUrl, buildUrl]);

  useEffect(() => {
    fetchExercises(muscleGroup, false);
  }, [muscleGroup]);

  const filtered = search
    ? exercises.filter((e) =>
        e.name?.toLowerCase().includes(search.toLowerCase())
      )
    : exercises;

  return (
    <div className="animate-fade-in">
      {/* Buscador */}
      <div className="mb-4 relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className="input pl-9"
          placeholder="Buscar ejercicio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Chips de grupo muscular */}
      <div className="flex flex-wrap gap-2 mb-5">
        {MUSCLE_GROUPS.map((g) => (
          <button
            key={g.id}
            onClick={() => { setMuscleGroup(g); setSearch(""); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              muscleGroup.id === g.id
                ? "bg-white text-black border-white"
                : "bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Cargando */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Cargando ejercicios...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="card p-6 text-center space-y-3">
          <p className="text-zinc-400 text-sm">{error}</p>
          <button
            onClick={() => fetchExercises(muscleGroup, false)}
            className="btn-ghost text-sm"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Lista */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-zinc-500 text-sm">No se encontraron ejercicios.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((ex) => (
                <ExerciseCard
                  key={ex.uuid || ex.id}
                  exercise={ex}
                  isOpen={selected?.uuid === ex.uuid || selected?.id === ex.id}
                  onToggle={() =>
                    setSelected(
                      selected?.uuid === ex.uuid || selected?.id === ex.id ? null : ex
                    )
                  }
                />
              ))}
            </div>
          )}

          {/* Cargar más — solo si no hay búsqueda activa */}
          {nextUrl && !search && (
            <button
              onClick={() => fetchExercises(muscleGroup, true)}
              disabled={loadingMore}
              className="w-full mt-4 py-3 rounded-lg border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                  Cargando...
                </>
              ) : (
                "Cargar más ejercicios"
              )}
            </button>
          )}

          <p className="text-center text-zinc-700 text-xs mt-4 pb-4">
            {filtered.length} ejercicio{filtered.length !== 1 ? "s" : ""}
          </p>
        </>
      )}
    </div>
  );
}

function ExerciseCard({ exercise, isOpen, onToggle }) {
  const name = exercise.name || "Sin nombre";
  const isSpanish = exercise.isSpanish;

  // Limpiar HTML de la descripción
  const description = exercise.description
    ? exercise.description.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").trim()
    : "";

  // exerciseinfo devuelve category como objeto {id, name}
  const category = exercise.category?.name || "";
  // muscles puede ser array de objetos {id, name, name_en} o strings
  const muscles = (exercise.muscles || [])
    .map((m) => typeof m === "string" ? m : (m.name_en || m.name || ""))
    .filter(Boolean).join(", ");
  const musclesSecondary = (exercise.muscles_secondary || [])
    .map((m) => typeof m === "string" ? m : (m.name_en || m.name || ""))
    .filter(Boolean).join(", ");
  // equipment puede ser array de objetos {id, name}
  const equipment = (exercise.equipment || [])
    .map((e) => typeof e === "string" ? e : (e.name || ""))
    .filter(Boolean).join(", ");

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
      <button onClick={onToggle} className="w-full p-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-white capitalize leading-snug">{name}</p>
                {!isSpanish && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700 flex-shrink-0">EN</span>
                )}
              </div>
            <div className="flex flex-wrap gap-x-3 mt-1.5">
              {category && <span className="text-xs text-zinc-400">{category}</span>}
              {muscles && <span className="text-xs text-zinc-600">· {muscles}</span>}
              {equipment && <span className="text-xs text-zinc-600">· {equipment}</span>}
            </div>
          </div>
          <svg
            width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            className={`text-zinc-500 flex-shrink-0 mt-1 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-zinc-800 p-4 space-y-3 animate-fade-in">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {muscles && (
              <span className="px-2.5 py-1 rounded-full text-xs bg-zinc-800 border border-zinc-700 text-zinc-300">
                🎯 {muscles}
              </span>
            )}
            {equipment && (
              <span className="px-2.5 py-1 rounded-full text-xs bg-zinc-800 border border-zinc-700 text-zinc-300">
                🏋️ {equipment}
              </span>
            )}
          </div>

          {musclesSecondary && (
            <div>
              <p className="text-xs text-zinc-500 mb-1">Músculos secundarios</p>
              <p className="text-xs text-zinc-400">{musclesSecondary}</p>
            </div>
          )}

          {description ? (
            <div>
              <p className="text-xs text-zinc-500 mb-1">Descripción</p>
              <p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
            </div>
          ) : (
            <p className="text-xs text-zinc-600 italic">Sin descripción disponible.</p>
          )}
        </div>
      )}
    </div>
  );
}

// Lista offline por si la API no responde
const FALLBACK_EXERCISES = [
  { uuid: "f1", name: "Press de banca", category: { name: "Pecho" }, categoryId: 11, muscles: [{name_en:"Pectorals"}], muscles_secondary: [{name_en:"Triceps"}], equipment: [{name:"Barbell"}], translations: [{language:6, name:"Press de banca", description:"Acostado en el banco, bajá la barra al pecho y empujá hacia arriba. Mantené los pies en el suelo y los glúteos en el banco."}] },
  { uuid: "f2", name: "Flexiones", category: { name: "Pecho" }, categoryId: 11, muscles: [{name_en:"Pectorals"}], muscles_secondary: [{name_en:"Triceps"}], equipment: [{name:"Sin equipo"}], translations: [{language:6, name:"Flexiones", description:"En posición de plancha con manos al ancho de hombros, bajá el pecho al suelo y empujá hacia arriba manteniendo el cuerpo recto."}] },
  { uuid: "f3", name: "Dominadas", category: { name: "Espalda" }, categoryId: 12, muscles: [{name_en:"Lats"}], muscles_secondary: [{name_en:"Biceps"}], equipment: [{name:"Barra"}], translations: [{language:6, name:"Dominadas", description:"Colgado de la barra con agarre prono, empujá los codos hacia abajo para subir el mentón por encima de la barra."}] },
  { uuid: "f4", name: "Remo con barra", category: { name: "Espalda" }, categoryId: 12, muscles: [{name_en:"Lats"}], muscles_secondary: [{name_en:"Biceps"}], equipment: [{name:"Barra"}], translations: [{language:6, name:"Remo con barra", description:"Con torso inclinado a 45°, jalá la barra hacia el abdomen manteniendo la espalda recta y los codos pegados al cuerpo."}] },
  { uuid: "f5", name: "Peso muerto", category: { name: "Espalda" }, categoryId: 12, muscles: [{name_en:"Erector spinae"}], muscles_secondary: [{name_en:"Glutes"}], equipment: [{name:"Barra"}], translations: [{language:6, name:"Peso muerto", description:"Con la barra en el suelo, agachate manteniendo la espalda neutra y levantá extendiendo caderas y rodillas simultáneamente."}] },
  { uuid: "f6", name: "Press militar", category: { name: "Hombros" }, categoryId: 13, muscles: [{name_en:"Deltoids"}], muscles_secondary: [{name_en:"Triceps"}], equipment: [{name:"Barra"}], translations: [{language:6, name:"Press militar", description:"De pie, empujá la barra desde los hombros hacia arriba hasta extender los brazos. Mantené el núcleo activado."}] },
  { uuid: "f7", name: "Elevaciones laterales", category: { name: "Hombros" }, categoryId: 13, muscles: [{name_en:"Deltoids"}], muscles_secondary: [], equipment: [{name:"Mancuernas"}], translations: [{language:6, name:"Elevaciones laterales", description:"De pie con mancuernas a los lados, eleválas hasta la altura de los hombros con los codos levemente doblados."}] },
  { uuid: "f8", name: "Curl de bíceps", category: { name: "Brazos" }, categoryId: 8, muscles: [{name_en:"Biceps"}], muscles_secondary: [], equipment: [{name:"Mancuernas"}], translations: [{language:6, name:"Curl de bíceps", description:"De pie con mancuernas, flexioná los codos llevando el peso hacia los hombros. Mantené los codos pegados al cuerpo."}] },
  { uuid: "f9", name: "Extensión de tríceps", category: { name: "Brazos" }, categoryId: 8, muscles: [{name_en:"Triceps"}], muscles_secondary: [], equipment: [{name:"Mancuerna"}], translations: [{language:6, name:"Extensión de tríceps", description:"Con mancuerna sobre la cabeza, flexioná y extendé el codo manteniendo el brazo vertical y el codo apuntando al techo."}] },
  { uuid: "f10", name: "Sentadilla", category: { name: "Piernas" }, categoryId: 10, muscles: [{name_en:"Quadriceps"}], muscles_secondary: [{name_en:"Glutes"}], equipment: [{name:"Barra"}], translations: [{language:6, name:"Sentadilla", description:"Con pies al ancho de hombros, bajá doblando rodillas y caderas hasta que los muslos queden paralelos al suelo. Espalda recta siempre."}] },
  { uuid: "f11", name: "Estocadas", category: { name: "Piernas" }, categoryId: 10, muscles: [{name_en:"Quadriceps"}], muscles_secondary: [{name_en:"Glutes"}], equipment: [{name:"Sin equipo"}], translations: [{language:6, name:"Estocadas", description:"Da un paso largo hacia adelante, bajá la rodilla trasera casi al suelo y volvé a la posición inicial. Alternando piernas."}] },
  { uuid: "f12", name: "Plancha", category: { name: "Abdomen" }, categoryId: 10, muscles: [{name_en:"Abs"}], muscles_secondary: [{name_en:"Glutes"}], equipment: [{name:"Sin equipo"}], translations: [{language:6, name:"Plancha", description:"Apoyado en antebrazos y pies, mantené el cuerpo recto como una tabla. No dejés caer las caderas ni subas los glúteos."}] },
  { uuid: "f13", name: "Crunchs", category: { name: "Abdomen" }, categoryId: 10, muscles: [{name_en:"Abs"}], muscles_secondary: [], equipment: [{name:"Sin equipo"}], translations: [{language:6, name:"Crunchs", description:"Acostado boca arriba con rodillas dobladas, contraé el abdomen elevando los hombros del suelo. Bajada controlada."}] },
  { uuid: "f14", name: "Elevación de gemelos", category: { name: "Pantorrillas" }, categoryId: 14, muscles: [{name_en:"Calves"}], muscles_secondary: [], equipment: [{name:"Sin equipo"}], translations: [{language:6, name:"Elevación de gemelos", description:"De pie, eleváte sobre las puntas de los pies lentamente y bajá de forma controlada. Podés hacerlo con o sin peso."}] },
];
