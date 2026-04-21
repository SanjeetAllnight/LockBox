import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
}

export function StatCard({ title, value, icon, change, changeType = 'neutral' }: StatCardProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="text-accent">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {change && (
          <p
            className={`text-xs mt-1 ${
              changeType === 'positive'
                ? 'text-green-400'
                : changeType === 'negative'
                  ? 'text-red-400'
                  : 'text-muted-foreground'
            }`}
          >
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
