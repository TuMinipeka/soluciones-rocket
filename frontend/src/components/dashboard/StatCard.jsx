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
    emerald: 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30',
    amber: 'bg-[#ff9f0a]/15 text-[#ff9f0a] border-[#ff9f0a]/30',
    rose: 'bg-[#93000a]/30 text-[#ffb4ab] border-[#ff453a]/30',
    blue: 'bg-[#2563eb]/20 text-[#6cd3f7] border-[#2563eb]/40',
    zinc: 'bg-[#2a2a2c] text-[#a1a1a6] border-white/[0.08]',
  }

  return (
    <Card className="hover:border-white/[0.15] transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#a1a1a6]">
          {title}
        </span>
        {icon && (
          typeof icon === 'string' ? (
            <span className="text-base">{icon}</span>
          ) : (
            <span className="text-white/80">{icon}</span>
          )
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2.5">
        <span className="text-3xl font-bold tracking-tight text-white font-mono">{value}</span>
        {trend && (
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
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
