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

export default function LoansPage() {
  const { user } = useAuth()

  const [resources, setResources] = useState([])
  const [loans, setLoans] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Modal para solicitar préstamo
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedResource, setSelectedResource] = useState(null)
  const [startTime, setStartTime] = useState(() => new Date().toISOString().slice(0, 16))
  const [expectedReturn, setExpectedReturn] = useState(() => {
    const d = new Date()
    d.setHours(d.getHours() + 2)
    return d.toISOString().slice(0, 16)
  })
  const [loanNotes, setLoanNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [resData, loansData] = await Promise.all([
        getResourcesApi(),
        getLoansApi(),
      ])
      setResources(Array.isArray(resData) ? resData : resData?.resources || [])
      setLoans(Array.isArray(loansData) ? loansData : loansData?.loans || [])
    } catch (err) {
      setError(err.message)
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
    if (!window.confirm('¿Confirmar la devolución de este equipo?')) return

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
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
          Disponible
        </span>
      )
    }
    if (s === 'loaned' || s === 'prestado') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
          En préstamo
        </span>
      )
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
        Inhabilitado
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
      render: (l) => l.resource_name || `Recurso ${l.resource_id}`,
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
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Recursos Tecnológicos y Préstamos
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Consulta de inventario oficial y registro de solicitudes de equipos para el aula.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess(null)} />}

      {/* Catálogo de equipos disponibles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Inventario de Equipos ({resources.length})
          </h3>
        </div>

        {isLoading ? (
          <LoadingState message="Consultando inventario del campus…" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((res) => (
              <Card key={res.id} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-medium text-zinc-400">
                      ID: {res.id}
                    </span>
                    {resourceStatusBadge(res.status)}
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-900">{res.name}</h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    Categoría: <span className="text-zinc-700 capitalize">{res.category || 'General'}</span>
                  </p>
                  {res.serial_number && (
                    <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      S/N: {res.serial_number}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100">
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
      <div className="space-y-4 pt-4 border-t border-zinc-200">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Préstamos Activos y Devoluciones
        </h3>
        <Table
          columns={loanColumns}
          data={loans}
          emptyMessage="No hay préstamos activos registrados."
        />
      </div>

      {/* Modal de Solicitud de Préstamo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Solicitar Préstamo: ${selectedResource?.name || ''}`}
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
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 mb-1.5">
              Propósito o notas
            </label>
            <textarea
              rows="3"
              value={loanNotes}
              onChange={(e) => setLoanNotes(e.target.value)}
              placeholder="Ej. Uso en clase magistral de microcontroladores"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
              disabled={isSubmitting}
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
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
