/**
 * Tarjeta de estadística e indicador operativo para Dashboard (HU-19).
 * Área: MAFE (consumida en DashboardPage).
 */

import Card from '../ui/Card'

export default function StatCard({
  title,
  value,
  trend,
  color = 'zinc',
  icon,
}) {
  const colorBadges = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    zinc: 'bg-zinc-50 text-zinc-700 border-zinc-200',
  }

  return (
    <Card className="hover:border-zinc-300 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {title}
        </span>
        {icon && <span className="text-sm">{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-zinc-900">{value}</span>
        {trend && (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              colorBadges[color] || colorBadges.zinc
            }`}
          >
            {trend}
          </span>
        )}
      </div>
    </Card>
  )
}
