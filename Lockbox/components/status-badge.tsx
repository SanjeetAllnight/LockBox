import { Badge } from '@/components/ui/badge'

interface StatusBadgeProps {
  status: 'active' | 'revoked' | 'expired' | 'warning' | 'allowed' | 'blocked'
  label: string
}

const statusStyles = {
  active: 'bg-green-950/40 text-green-300 border-green-700/50',
  revoked: 'bg-red-950/40 text-red-300 border-red-700/50',
  expired: 'bg-yellow-950/40 text-yellow-300 border-yellow-700/50',
  warning: 'bg-yellow-950/40 text-yellow-300 border-yellow-700/50',
  allowed: 'bg-green-950/40 text-green-300 border-green-700/50',
  blocked: 'bg-red-950/40 text-red-300 border-red-700/50',
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={statusStyles[status]}>
      {label}
    </Badge>
  )
}
