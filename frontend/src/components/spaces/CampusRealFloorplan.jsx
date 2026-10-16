/**
 * Componente: Plano Arquitectónico 2D Interactivo de Campuslands (HU-18, HU-17, HU-21)
 * Fiel a la geometría del plano físico de evacuación:
 * - Ala Izquierda (7 cols): Apolo (SAL-005), Sputnik (SAL-004), Corredor de Evacuación,
 *   Artemis (SAL-010), Sala Nueva (SAL-006), Cosmos (SAL-002) y Skylab (SAL-003).
 * - Ala Derecha (5 cols): Pods Amarillas (SAL-008) y Verdes (SAL-009),
 *   Bloque Central Pasivo + Gran Auditorio (SAL-001), Pod Azul (SAL-007) + Área Técnica.
 * - 4 estados accesibles con doble canal (color y símbolo): Disponible (●), Ocupado (■),
 *   Con Incidencia (▲), Inhabilitado (✕).
 * - Previsualización fotográfica con fallback en gradiente de alta fidelidad.
 * Responsables: GUERRA & MAFE
 */

import { useState } from 'react'

export const CAMPUS_FLOORPLAN_SPACES = [
  // ALA IZQUIERDA SUPERIOR (Salones con chaflán inferior)
  { id: 'SAL-005', name: 'Apolo', capacity: 34, status: 'available', sector: 'Ala Norte • Izquierda', shape: 'chamfer-br' },
  { id: 'SAL-004', name: 'Sputnik', capacity: 38, status: 'available', sector: 'Ala Norte • Centro', shape: 'chamfer-bl' },

  // ALA IZQUIERDA INFERIOR (Artemis con chaflán superior + Sala Nueva + Cosmos & Skylab)
  { id: 'SAL-010', name: 'Artemis', capacity: 32, status: 'available', sector: 'Ala Sur • Izquierda', shape: 'chamfer-tr' },
  { id: 'SAL-006', name: 'Sala Nueva', capacity: 12, status: 'available', sector: 'Sala de Juntas Central', shape: 'rect' },
  { id: 'SAL-002', name: 'Cosmos', capacity: 25, status: 'available', sector: 'Laboratorio Sur', shape: 'rect' },
  { id: 'SAL-003', name: 'Skylab', capacity: 20, status: 'available', sector: 'Laboratorio Este', shape: 'rect' },

  // ALA DERECHA (Pods superiores, Auditorio principal y Pods inferiores)
  { id: 'SAL-008', name: 'Amarillas', capacity: 6, status: 'available', sector: 'Pods Terraza Norte', shape: 'pill' },
  { id: 'SAL-009', name: 'Verdes', capacity: 6, status: 'available', sector: 'Pods Terraza Norte', shape: 'pill' },
  { id: 'SAL-001', name: 'Auditorio', capacity: 100, status: 'available', sector: 'Núcleo Principal Este', shape: 'auditorium' },
  { id: 'SAL-007', name: 'Azul', capacity: 10, status: 'available', sector: 'Pods Terraza Sur', shape: 'pill' },
]

export const STATUS_STYLES = {
  available: {
    label: 'Disponible',
    icon: '●',
    border: 'border-emerald-500/40 hover:border-emerald-400',
    bg: 'bg-emerald-500/[0.07] hover:bg-emerald-500/[0.14]',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.25)]',
  },
  occupied: {
    label: 'Ocupado',
    icon: '■',
    border: 'border-blue-500/40 hover:border-blue-400',
    bg: 'bg-blue-500/[0.08] hover:bg-blue-500/[0.15]',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.25)]',
  },
  incident: {
    label: 'Con Incidencia',
    icon: '▲',
    border: 'border-amber-500/50 hover:border-amber-400',
    bg: 'bg-amber-500/[0.10] hover:bg-amber-500/[0.18]',
    text: 'text-amber-400',
    dot: 'bg-amber-400 animate-pulse',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
  },
  disabled: {
    label: 'Inhabilitado',
    icon: '✕',
    border: 'border-rose-500/40',
    bg: 'bg-rose-500/[0.06] opacity-60 hover:opacity-90',
    text: 'text-rose-400',
    dot: 'bg-rose-500',
    glow: 'shadow-[0_0_20px_rgba(244,63,94,0.2)]',
  },
}

// Mapeo oficial de fotografías locales en frontend/public
const ROOM_LOCAL_IMAGES = {
  'SAL-001': '/imagenes_salones/auditorio.png',
  'SAL-004': '/imagenes_salones/sputnik.png',
  'SAL-005': '/imagenes_salones/apolo.png',
  'SAL-008': '/imagenes_salones/amarilla_1.png',
  'SAL-009': '/imagenes_salones/amarilla_2.png',
  'SAL-010': '/imagenes_salones/artemis.png',
}

export default function CampusRealFloorplan({
  spaces = CAMPUS_FLOORPLAN_SPACES,
  selectedSpaceId = 'SAL-005',
  onSelectSpace,
  onBook,
  onReportIncident,
}) {
  const [internalSelectedId, setInternalSelectedId] = useState(selectedSpaceId)
  const [imageErrorMap, setImageErrorMap] = useState({})

  const currentSelectedId = selectedSpaceId || internalSelectedId

  // Normalizar datos de sala combinando catálogo arquitectónico con disponibilidad de la API
  const getSpace = (id) => {
    const defaultMeta = CAMPUS_FLOORPLAN_SPACES.find((s) => s.id === id) || { id, name: id, capacity: 20 }
    const live = spaces.find((s) => s.id === id)
    if (!live) return defaultMeta

    // Determinar estado accesible
    let status = live.status || defaultMeta.status || 'available'
    if (live.is_blocked) {
      status = 'disabled'
    } else if (live.has_incident || status === 'incident') {
      status = 'incident'
    } else if (live.has_conflict || status === 'occupied') {
      status = 'occupied'
    } else if (status !== 'disabled') {
      status = 'available'
    }

    return {
      ...defaultMeta,
      ...live,
      status,
      capacity: live.capacity ?? defaultMeta.capacity,
    }
  }

  const handleSelect = (space) => {
    setInternalSelectedId(space.id)
    if (onSelectSpace) onSelectSpace(space)
  }

  const handleImageError = (spaceId) => {
    setImageErrorMap((prev) => ({ ...prev, [spaceId]: true }))
  }

  // Tarjeta interactiva de Sala con navegación por teclado y estilos Apple Dark
  const RoomCard = ({ id, className = '', compact = false }) => {
    const space = getSpace(id)
    const st = STATUS_STYLES[space.status] || STATUS_STYLES.available
    const isSelected = currentSelectedId === space.id

    return (
      <button
        type="button"
        onClick={() => handleSelect(space)}
        aria-label={`${space.name}, capacidad ${space.capacity} personas, estado ${st.label}`}
        aria-pressed={isSelected}
        className={`
          group relative text-left transition-all duration-200 rounded-2xl border backdrop-blur-md
          flex flex-col justify-between p-3.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/90
          cursor-pointer select-none
          ${st.border} ${st.bg}
          ${
            isSelected
              ? `ring-2 ring-white/90 ${st.glow} z-20 scale-[1.01] bg-white/[0.08]`
              : 'hover:scale-[1.008] hover:bg-white/[0.05]'
          }
          ${className}
        `}
      >
        <div className="flex items-center justify-between gap-1 w-full">
          <span className="font-mono text-[10px] font-semibold tracking-wider text-zinc-400">
            {space.id}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/50 border border-white/10 ${st.text}`}
          >
            <span>{st.icon}</span>
            {!compact && <span>{st.label}</span>}
          </span>
        </div>

        <div className="my-1.5">
          <h3
            className={`${
              compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
            } font-semibold text-white tracking-tight leading-tight`}
          >
            {space.name}
          </h3>
          {!compact && (
            <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{space.sector}</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-xs text-zinc-300">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">Aforo</span>
          <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded-md text-[11px]">
            {space.capacity} p.
          </span>
        </div>
      </button>
    )
  }

  const activeSpace = getSpace(currentSelectedId)
  const activeStatus = STATUS_STYLES[activeSpace.status] || STATUS_STYLES.available
  const activeImagePath =
    ROOM_LOCAL_IMAGES[activeSpace.id] || `/assets/rooms/${activeSpace.id}.jpg`
  const hasImageFailed = imageErrorMap[activeSpace.id]

  return (
    <div className="w-full bg-[#090b10] text-white p-5 sm:p-7 rounded-3xl border border-white/10 shadow-2xl font-sans relative overflow-hidden">
      {/* Resplandor ambiental de fondo */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cabecera del Plano + Leyenda Accesible (HU-18) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 mb-6 border-b border-white/10 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#22d3ee]">
              Plano Arquitectónico Oficial • Campuslands
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              10 Salas en Enclave
            </span>
          </div>
          <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-white mt-1">
            Distribución Física y Disponibilidad Telemática
          </h2>
        </div>

        {/* Leyenda Accesible con Símbolos y Colores */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/10 select-none">
          {Object.entries(STATUS_STYLES).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs text-zinc-300">
              <span className={`w-2.5 h-2.5 rounded-full ${val.dot}`} />
              <span className="font-mono text-[11px] font-bold opacity-80">{val.icon}</span>
              <span className="font-medium text-[11px]">{val.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CONTENEDOR CENTRAL DEL PLANO FÍSICO */}
      <div className="relative bg-[#0d1017] p-4 sm:p-6 rounded-2xl border border-white/10 overflow-hidden z-10">
        {/* Retícula sutil arquitectónica */}
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* ESTRUCTURA FÍSICA EN DOS GRANDES ALAS */}
        <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
          {/* ============================================================== */}
          {/* ALA IZQUIERDA (7 Columnas: Núcleo de Entrenamiento Técnico)    */}
          {/* ============================================================== */}
          <div className="xl:col-span-7 flex flex-col justify-between bg-white/[0.015] p-3.5 sm:p-4 rounded-2xl border border-white/10 gap-3">
            {/* Franja Superior Izquierda: Apolo y Sputnik con Chaflán Inferior */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <RoomCard
                id="SAL-005"
                className="min-h-[145px] rounded-br-[36px]"
              />
              <RoomCard
                id="SAL-004"
                className="min-h-[145px] rounded-bl-[36px]"
              />
            </div>

            {/* CORREDOR CENTRAL DE EVACUACIÓN / CONEXIÓN HORIZONTAL */}
            <div className="my-1 py-2.5 px-4 rounded-xl bg-emerald-500/[0.05] border border-dashed border-emerald-500/25 flex items-center justify-between text-[11px] font-mono text-emerald-400 select-none">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-semibold tracking-wider">•••▷ CORREDOR CENTRAL CAMPUSLANDS</span>
              </div>
              <span className="opacity-80">RUTA DE EVACUACIÓN ▷▷ LOBBY</span>
            </div>

            {/* Franja Inferior Izquierda: Artemis (Chaflán Sup) + Sala Nueva + Cosmos & Skylab */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              {/* Artemis (Esquina superior derecha en chaflán) */}
              <RoomCard
                id="SAL-010"
                className="sm:col-span-5 min-h-[160px] rounded-tr-[36px]"
              />

              {/* Sala Nueva (Sala de juntas vertical adyacente a Artemis) */}
              <RoomCard
                id="SAL-006"
                compact
                className="sm:col-span-2 min-h-[160px]"
              />

              {/* Cosmos y Skylab (Laboratorios rectos apilados) */}
              <div className="sm:col-span-5 grid grid-cols-1 gap-3">
                <RoomCard id="SAL-002" compact className="min-h-[74px]" />
                <RoomCard id="SAL-003" compact className="min-h-[74px]" />
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* ALA DERECHA (5 Columnas: Lobby, Pods y Gran Auditorio)        */}
          {/* ============================================================== */}
          <div className="xl:col-span-5 flex flex-col justify-between bg-white/[0.015] p-3.5 sm:p-4 rounded-2xl border border-white/10 gap-3.5">
            {/* Franja Superior Derecha: Pods de Terraza (Amarillas y Verdes) */}
            <div className="grid grid-cols-2 gap-3">
              <RoomCard id="SAL-008" compact className="min-h-[85px] rounded-xl" />
              <RoomCard id="SAL-009" compact className="min-h-[85px] rounded-xl" />
            </div>

            {/* Núcleo Central Derecho: Bloque Pasivo (Escaleras/Salidas) + Gran Auditorio */}
            <div className="grid grid-cols-12 gap-3 items-stretch my-auto">
              <div className="col-span-4 flex flex-col justify-center items-center p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center text-[10px] font-mono text-zinc-400 gap-1.5 select-none">
                <span>🪜 ESCALERAS</span>
                <span className="text-emerald-400 font-semibold my-0.5">🚪 SALIDA</span>
                <span>🚻 SERVICIOS</span>
              </div>
              <RoomCard
                id="SAL-001"
                className="col-span-8 min-h-[155px]"
              />
            </div>

            {/* Franja Inferior Derecha: Pod Azul + Zona Técnica & Lockers */}
            <div className="grid grid-cols-12 gap-3">
              <RoomCard id="SAL-007" compact className="col-span-7 min-h-[85px] rounded-xl" />
              <div className="col-span-5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center p-2 text-[10px] font-mono text-zinc-400 text-center select-none">
                <span>⚡ ÁREA TÉCNICA</span>
                <span className="text-[9px] text-zinc-500 mt-0.5">& LOCKERS</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TARJETA INFERIOR DE DETALLE Y PREVISUALIZACIÓN FOTOGRÁFICA     */}
      {/* ============================================================== */}
      {activeSpace && (
        <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-[#12151e] border border-white/10 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10 animate-fluid-enter">
          {/* Previsualización de Imagen con Fallback Elegante */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 w-full lg:w-auto">
            <div className="relative w-36 h-28 sm:w-44 sm:h-28 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-[#1c1c1e] shadow-md group">
              {!hasImageFailed ? (
                <img
                  src={activeImagePath}
                  alt={`Fotografía oficial de ${activeSpace.name}`}
                  onError={() => handleImageError(activeSpace.id)}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                /* Fallback elegante en degradado si la foto no está presente */
                <div className="w-full h-full bg-gradient-to-br from-blue-900/60 via-[#1c1c1e] to-cyan-950/60 flex flex-col items-center justify-center p-2 text-center">
                  <svg className="w-7 h-7 text-[#22d3ee]/70 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-wider">
                    Plano Digital
                  </span>
                </div>
              )}
              <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-black/60 backdrop-blur-md text-white border border-white/10">
                {activeSpace.id}
              </span>
            </div>

            {/* Metadatos de la sala */}
            <div className="text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h4 className="text-xl font-bold text-white tracking-tight">
                  {activeSpace.name}
                </h4>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-black/40 border border-white/10 ${activeStatus.text}`}
                >
                  <span>{activeStatus.icon}</span>
                  <span>{activeStatus.label}</span>
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Capacidad autorizada:{' '}
                <strong className="text-zinc-200 font-semibold">{activeSpace.capacity} asistentes</strong>
                {' '}&bull; Ubicación: <span className="text-zinc-300">{activeSpace.sector}</span>
              </p>
              {activeSpace.resources && activeSpace.resources.length > 0 && (
                <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
                  Equipamiento: {activeSpace.resources.join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* Botones de acción directa (HU-22 Reservar / HU-24 Incidencia IA) */}
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            <button
              type="button"
              disabled={activeSpace.status === 'disabled'}
              onClick={() => onBook && onBook(activeSpace)}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white tracking-wide shadow-[0_4px_16px_rgba(37,99,235,0.4)] transition-all cursor-pointer"
            >
              Reservar Sala
            </button>
            <button
              type="button"
              onClick={() => onReportIncident && onReportIncident(activeSpace)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 border border-white/10 text-xs font-semibold text-zinc-200 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span className="text-amber-400">⚡</span>
              <span>Reportar Incidencia con IA</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
