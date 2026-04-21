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
    <Card className="group relative overflow-hidden border-border bg-card transition-all duration-500 hover:border-primary/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 dark:hover:shadow-[0_0_20px_rgba(var(--primary),0.1)]">
      {/* Subtle top border gradient highlight on hover */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary to-emerald-400 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">{title}</CardTitle>
        {icon && <div className="text-muted-foreground transition-colors duration-500 group-hover:text-primary">{icon}</div>}
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
