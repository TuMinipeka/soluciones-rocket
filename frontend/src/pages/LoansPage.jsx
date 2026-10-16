/**
 * Página: Gestión de Equipos y Préstamos Tecnológicos (HU-08, HU-23)
 * Responsable: GUERRA
 */

import { useState, useEffect } from 'react'
import {
  getResourcesApi,
  getLoansApi,
  requestLoanApi,
  returnLoanApi,
} from '../api/resources'
import { useAuth } from '../auth/useAuth'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Table from '../components/ui/Table'
import LoadingState from '../components/feedback/LoadingState'
import ErrorMessage from '../components/feedback/ErrorMessage'
import SuccessMessage from '../components/feedback/SuccessMessage'

// Inventario de muestra representativo de Campuslands si el SEED aún no se ejecuta
const DEFAULT_RESOURCES = [
  { id: 'REC-001', name: 'MacBook Pro M2 (16GB)', category: 'Computación', serial_number: 'C02-K9812-M2', status: 'available', location: 'Laboratorio Skilab' },
  { id: 'REC-002', name: 'Proyector Epson Pro 4K', category: 'Audiovisual', serial_number: 'EP-4K-88219', status: 'available', location: 'Auditorio' },
  { id: 'REC-003', name: 'Tableta Wacom Cintiq Pro', category: 'Diseño', serial_number: 'WC-24P-1092', status: 'available', location: 'Skilab' },
  { id: 'REC-004', name: 'Kit Arduino + Sensores IoT', category: 'Electrónica', serial_number: 'ARD-IOT-V2', status: 'available', location: 'Cosmos' },
  { id: 'REC-005', name: 'Cámara 4K Poly Studio', category: 'Audiovisual', serial_number: 'PLY-4K-3391', status: 'available', location: 'Sala Blanca' },
  { id: 'REC-006', name: 'Laptop Dell XPS 15 (Dev)', category: 'Computación', serial_number: 'DL-XPS-9520', status: 'available', location: 'Artemis' },
]

export default function LoansPage() {
  const { user } = useAuth()

  const [resources, setResources] = useState(DEFAULT_RESOURCES)
  const [loans, setLoans] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Modal para solicitar préstamo
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedResource, setSelectedResource] = useState(null)
  const [startTime, setStartTime] = useState(() => new Date().toISOString().slice(0, 16))
  const [expectedReturn, setExpectedReturn] = useState(() => {
    const d = new Date()
    d.setHours(d.getHours() + 3)
    return d.toISOString().slice(0, 16)
  })
  const [loanNotes, setLoanNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [resData, loansData] = await Promise.all([
        getResourcesApi().catch(() => DEFAULT_RESOURCES),
        getLoansApi().catch(() => []),
      ])
      const resList = Array.isArray(resData) ? resData : resData?.resources || DEFAULT_RESOURCES
      setResources(resList.length > 0 ? resList : DEFAULT_RESOURCES)
      setLoans(Array.isArray(loansData) ? loansData : loansData?.loans || [])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenLoanModal = (resource) => {
    if (resource.status !== 'available' && resource.status !== 'disponible') {
      setError(`El equipo "${resource.name}" no está disponible para préstamo en este momento.`)
      return
    }
    setSelectedResource(resource)
    setIsModalOpen(true)
    setError(null)
  }

  const handleRequestLoan = async (e) => {
    e.preventDefault()
    if (!selectedResource) return

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      await requestLoanApi({
        resource_id: selectedResource.id,
        start_time: startTime,
        expected_return: expectedReturn,
        notes: loanNotes,
      })

      setSuccess(`Préstamo registrado exitosamente para ${selectedResource.name}.`)
      setIsModalOpen(false)
      setSelectedResource(null)
      setLoanNotes('')
      loadData()
    } catch (err) {
      setError(err.message || 'No fue posible registrar el préstamo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReturnLoan = async (loanId) => {
    if (!window.confirm('¿Confirmar la devolución y entrega de este equipo?')) return

    setError(null)
    try {
      await returnLoanApi(loanId, { returned_at: new Date().toISOString() })
      setSuccess('Equipo devuelto y reincorporado al inventario disponible.')
      loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')

  const categories = ['Todos', 'Computación', 'Audiovisual', 'Diseño', 'Electrónica']

  const filteredResources = resources.filter((res) => {
    const matchesSearch =
      res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (res.serial_number && res.serial_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (res.id && res.id.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory =
      selectedCategory === 'Todos' ||
      (res.category && res.category.toLowerCase() === selectedCategory.toLowerCase())

    return matchesSearch && matchesCategory
  })

  // Estadísticas KPI
  const totalCount = resources.length
  const availableCount = resources.filter((r) => r.status === 'available' || r.status === 'disponible').length
  const loanedCount = resources.filter((r) => r.status === 'loaned' || r.status === 'prestado').length

  const resourceStatusBadge = (status) => {
    const s = String(status).toLowerCase()
    if (s === 'available' || s === 'disponible') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/30 uppercase tracking-wider">
          Disponible
        </span>
      )
    }
    if (s === 'loaned' || s === 'prestado') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#2563eb]/20 text-[#6cd3f7] border border-[#2563eb]/40 uppercase tracking-wider">
          En préstamo
        </span>
      )
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ff9f0a]/20 text-[#ff9f0a] border border-[#ff9f0a]/30 uppercase tracking-wider">
        Mantenimiento
      </span>
    )
  }

  const loanColumns = [
    {
      header: 'ID',
      accessor: 'id',
      render: (l) => <span className="font-mono font-bold text-[#22d3ee]">#{l.id}</span>,
    },
    {
      header: 'Equipo',
      accessor: 'resource_name',
      render: (l) => (
        <span className="font-semibold text-white">
          {l.resource_name || `Equipo ${l.resource_id}`}
        </span>
      ),
    },
    {
      header: 'Solicitante',
      accessor: 'user_name',
      render: (l) => <span className="text-[#e4e2e4]">{l.user_name || user?.name || 'Docente'}</span>,
    },
    {
      header: 'Entrega',
      accessor: 'start_time',
      render: (l) => (
        <span className="text-[#a1a1a6] font-mono text-xs">
          {new Date(l.start_time).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Devolución Prevista',
      accessor: 'expected_return',
      render: (l) => (
        <span className="text-[#a1a1a6] font-mono text-xs">
          {new Date(l.expected_return).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Estado',
      accessor: 'status',
      render: (l) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            l.status === 'returned'
              ? 'bg-[#2a2a2c] text-[#8d90a0] border border-white/[0.06]'
              : 'bg-[#ff9f0a]/15 text-[#ff9f0a] border border-[#ff9f0a]/30'
          }`}
        >
          {l.status === 'returned' ? 'Devuelto' : 'Activo'}
        </span>
      ),
    },
    {
      header: 'Acción',
      render: (l) =>
        l.status !== 'returned' ? (
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => handleReturnLoan(l.id)}
          >
            Registrar devolución
          </Button>
        ) : null,
    },
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Section Header */}
      <section className="flex flex-col gap-3">
        <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-xs text-[#8d90a0]">
          <span className="hover:text-white transition-colors cursor-pointer">Inicio</span>
          <span className="text-white/20">/</span>
          <span className="hover:text-white transition-colors cursor-pointer">Gestión de Campus</span>
          <span className="text-white/20">/</span>
          <span className="text-[#22d3ee] font-semibold">Recursos tecnológicos</span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-1">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-2.5 py-0.5 rounded-full font-mono text-[11px] bg-[#161B22] text-[#22D3EE] border border-white/[0.08]">
                INVENTARIO v4.8
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[#30D158] font-mono">
                <span className="inline-block w-2 h-2 rounded-full bg-[#30D158] animate-pulse" />
                Telemetría en tiempo real activa
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Recursos tecnológicos
            </h1>
            <p className="text-sm text-[#a1a1a6] mt-1">
              Inventario, control de disponibilidad y gestión de préstamos de equipamiento multimedia y cómputo.
            </p>
          </div>

          {/* Quick KPI Strip estilo Stitch */}
          <div className="flex items-center gap-3 bg-[#1c1c1e] p-2 rounded-2xl border border-white/[0.08] shadow-lg shrink-0">
            <div className="px-4 py-1.5 border-r border-white/[0.08] text-left">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-[#8d90a0]">TOTAL ACTIVOS</span>
              <span className="font-mono text-xl font-bold text-white">{totalCount}</span>
            </div>
            <div className="px-4 py-1.5 border-r border-white/[0.08] text-left">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-[#30D158]">DISPONIBLES</span>
              <span className="font-mono text-xl font-bold text-[#30D158]">{availableCount}</span>
            </div>
            <div className="px-4 py-1.5 text-left">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-[#FF9F0A]">EN PRÉSTAMO</span>
              <span className="font-mono text-xl font-bold text-[#FF9F0A]">{loanedCount}</span>
            </div>
          </div>
        </div>
      </section>

      {error && <ErrorMessage message={error} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess(null)} />}

      {/* Filter & Search Toolbar */}
      <section className="bg-[#1c1c1e] border border-white/[0.08] rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8d90a0]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="search"
            placeholder="Buscar por ID, modelo, etiqueta o aula…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#2a2a2c] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-sm text-[#f5f5f7] placeholder-[#636366] focus:border-[#2563eb] focus:ring-2 focus:ring-[#22d3ee]/40 focus:outline-none transition-all"
          />
        </div>

        {/* Category Filters Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-[#2563eb] text-white shadow-sm'
                  : 'bg-[#2a2a2c] text-[#a1a1a6] hover:text-white border border-white/[0.06]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Catálogo de equipos disponibles en cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#a1a1a6]">
            Catálogo de Equipos ({filteredResources.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 rounded-[20px] bg-[#1c1c1e] border border-white/[0.08]">
            <LoadingState message="Consultando inventario de equipos…" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((res) => (
              <Card key={res.id} className="flex flex-col justify-between hover:border-white/[0.15] transition-all">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-medium text-[#22d3ee]">
                      {res.id}
                    </span>
                    {resourceStatusBadge(res.status)}
                  </div>
                  <h4 className="text-sm font-bold text-white tracking-tight">{res.name}</h4>
                  <p className="text-xs text-[#a1a1a6] mt-1">
                    Categoría: <span className="font-medium text-[#f5f5f7]">{res.category || 'General'}</span>
                  </p>
                  {res.serial_number && (
                    <p className="text-[11px] text-[#8d90a0] font-mono mt-0.5">
                      S/N: {res.serial_number}
                    </p>
                  )}
                  {res.location && (
                    <p className="text-[11px] text-[#8d90a0] mt-1 flex items-center gap-1">
                      <span>📍</span> {res.location}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3.5 border-t border-white/[0.06]">
                  <Button
                    size="sm"
                    variant={res.status === 'available' || res.status === 'disponible' ? 'primary' : 'outline'}
                    disabled={res.status !== 'available' && res.status !== 'disponible'}
                    className="w-full text-xs h-9 rounded-xl"
                    onClick={() => handleOpenLoanModal(res)}
                  >
                    {res.status === 'available' || res.status === 'disponible'
                      ? 'Solicitar préstamo'
                      : 'No disponible'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Préstamos Activos */}
      <div className="space-y-4 pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#a1a1a6]">
          Préstamos Activos y Devoluciones
        </h3>
        <Table
          columns={loanColumns}
          data={loans}
          emptyMessage="No hay préstamos activos registrados actualmente."
        />
      </div>

      {/* Modal de Solicitud de Préstamo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Solicitar: ${selectedResource?.name || ''}`}
        subtitle="Ingresa el intervalo de uso para reservar el equipo"
      >
        <form onSubmit={handleRequestLoan} className="space-y-4">
          <Input
            label="Fecha y hora de retiro"
            type="datetime-local"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            disabled={isSubmitting}
          />

          <Input
            label="Fecha y hora prevista de devolución"
            type="datetime-local"
            required
            value={expectedReturn}
            onChange={(e) => setExpectedReturn(e.target.value)}
            disabled={isSubmitting}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
              Propósito académico o notas
            </label>
            <textarea
              rows="3"
              value={loanNotes}
              onChange={(e) => setLoanNotes(e.target.value)}
              placeholder="Ej. Sesión práctica con estudiantes en sala Cosmos"
              className="w-full rounded-xl border border-zinc-200/90 bg-white/90 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900"
              disabled={isSubmitting}
            />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-zinc-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Confirmar Solicitud
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
