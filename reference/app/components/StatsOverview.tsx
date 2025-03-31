import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react"
import { Card } from "./ui/card"

interface StatItem {
  label: string
  value: string | number
  previousValue?: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
  }
  sparklineData?: number[]
}

interface StatsOverviewProps {
  title?: string
  description?: string
  stats: StatItem[]
  onViewDetails?: () => void
}

export function StatsOverview({
  title = "Overview",
  description,
  stats,
  onViewDetails
}: StatsOverviewProps) {
  const getChangeColor = (type: 'increase' | 'decrease') => {
    return type === 'increase' ? 'text-green-600' : 'text-red-600'
  }

  const renderSparkline = (data: number[]) => {
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min
    const points = data.map((value, i) => {
      const x = (i / (data.length - 1)) * 100
      const y = 100 - ((value - min) / range) * 100
      return `${x},${y}`
    }).join(' ')

    return (
      <svg className="h-8 w-16" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary/50"
        />
      </svg>
    )
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="flex items-center text-sm text-primary hover:underline"
            >
              View Details
              <ArrowRight className="ml-1 h-4 w-4" />
            </button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div key={i} className="space-y-2">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <div className="flex items-baseline justify-between">
                <h4 className="text-2xl font-semibold">{stat.value}</h4>
                {stat.change && (
                  <div className={`flex items-center ${getChangeColor(stat.change.type)}`}>
                    {stat.change.type === 'increase' ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-sm">
                      {stat.change.value}%
                    </span>
                  </div>
                )}
              </div>
              {stat.previousValue && (
                <p className="text-xs text-muted-foreground">
                  Previous: {stat.previousValue}
                </p>
              )}
              {stat.sparklineData && (
                <div className="mt-2">
                  {renderSparkline(stat.sparklineData)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
} 