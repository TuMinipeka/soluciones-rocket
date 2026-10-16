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

  const resourceStatusBadge = (status) => {
    const s = String(status).toLowerCase()
    if (s === 'available' || s === 'disponible') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
          Disponible
        </span>
      )
    }
    if (s === 'loaned' || s === 'prestado') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
          En uso
        </span>
      )
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider">
        Mantenimiento
      </span>
    )
  }

  const loanColumns = [
    {
      header: 'ID',
      accessor: 'id',
      render: (l) => <span className="font-mono font-bold text-zinc-900">#{l.id}</span>,
    },
    {
      header: 'Equipo',
      accessor: 'resource_name',
      render: (l) => (
        <span className="font-semibold text-zinc-900">
          {l.resource_name || `Equipo ${l.resource_id}`}
        </span>
      ),
    },
    {
      header: 'Solicitante',
      accessor: 'user_name',
      render: (l) => l.user_name || user?.name || 'Docente',
    },
    {
      header: 'Entrega',
      accessor: 'start_time',
      render: (l) => new Date(l.start_time).toLocaleString(),
    },
    {
      header: 'Devolución Prevista',
      accessor: 'expected_return',
      render: (l) => new Date(l.expected_return).toLocaleString(),
    },
    {
      header: 'Estado',
      accessor: 'status',
      render: (l) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            l.status === 'returned'
              ? 'bg-zinc-100 text-zinc-600'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
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
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Equipos y Préstamos Tecnológicos
          </h1>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200 uppercase tracking-wider">
            HU-23 Recursos
          </span>
        </div>
        <p className="text-sm text-zinc-500 mt-1">
          Inventario oficial de dispositivos para actividades académicas y control de devoluciones.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess(null)} />}

      {/* Catálogo de equipos disponibles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Catálogo Disponible ({resources.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 rounded-3xl bg-white border border-zinc-200/80">
            <LoadingState message="Consultando inventario de equipos…" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((res) => (
              <Card key={res.id} className="flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-medium text-zinc-400">
                      {res.id}
                    </span>
                    {resourceStatusBadge(res.status)}
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900 tracking-tight">{res.name}</h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    Categoría: <span className="font-medium text-zinc-700">{res.category || 'General'}</span>
                  </p>
                  {res.serial_number && (
                    <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      S/N: {res.serial_number}
                    </p>
                  )}
                  {res.location && (
                    <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                      <span>📍</span> {res.location}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3.5 border-t border-zinc-100">
                  <Button
                    size="sm"
                    variant={res.status === 'available' || res.status === 'disponible' ? 'primary' : 'outline'}
                    disabled={res.status !== 'available' && res.status !== 'disponible'}
                    className="w-full text-xs"
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
      <div className="space-y-4 pt-6 border-t border-zinc-200">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
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
