import { TrendingDown, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"

interface Metric {
  title: string
  value: string | number
  change?: {
    value: string
    trend: 'up' | 'down'
  }
  description?: string
  chart?: React.ReactNode
}

interface MetricGridProps {
  metrics: Metric[]
  columns?: 2 | 3 | 4
}

export function MetricGrid({ metrics, columns = 4 }: MetricGridProps) {
  return (
    <div className={`grid gap-6 ${
      columns === 2 ? 'md:grid-cols-2' :
      columns === 3 ? 'md:grid-cols-2 lg:grid-cols-3' :
      'md:grid-cols-2 lg:grid-cols-4'
    }`}>
      {metrics.map((metric, i) => (
        <Card key={i}>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </h3>
              {metric.change && (
                <div className={`
                  flex items-center space-x-1 text-sm
                  ${metric.change.trend === 'up' ? 'text-green-600' : 'text-red-600'}
                `}>
                  {metric.change.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{metric.change.value}</span>
                </div>
              )}
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {metric.value}
              </div>
              {metric.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.description}
                </p>
              )}
            </div>
            {metric.chart && (
              <div className="mt-4 h-[100px]">
                {metric.chart}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
} 