import { TrendingDown, TrendingUp } from "lucide-react"
import { ReactNode } from "react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { Card } from "../ui/Card"

interface MetricCard {
  title: string
  value: string | number
  change: number
  changeLabel?: string
  trend?: number[]
  prefix?: string
  suffix?: string
  description?: string
  color?: "default" | "success" | "warning" | "danger"
}

interface MetricsGridProps {
  metrics: MetricCard[]
  columns?: 2 | 3 | 4
}

export function MetricsGrid({ metrics, columns = 3 }: MetricsGridProps) {
  const getColorClasses = (color: MetricCard["color"], isPositive: boolean) => {
    const baseClasses = {
      default: "text-primary",
      success: "text-green-500",
      warning: "text-yellow-500",
      danger: "text-red-500"
    }

    if (color) return baseClasses[color]
    return isPositive ? baseClasses.success : baseClasses.danger
  }

  const formatChange = (change: number) => {
    const isPositive = change >= 0
    return `${isPositive ? "+" : ""}${change.toFixed(1)}%`
  }

  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-${columns}`}>
      {metrics.map((metric) => {
        const isPositive = metric.change >= 0
        const colorClass = getColorClasses(metric.color, isPositive)

        return (
          <Card key={metric.title} className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </p>
              <div className={`flex items-center gap-1 ${colorClass}`}>
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {formatChange(metric.change)}
                </span>
              </div>
            </div>

            <div className="mt-2 flex items-baseline">
              <span className="text-2xl font-semibold tracking-tight">
                {metric.prefix}
                {metric.value}
                {metric.suffix}
              </span>
              {metric.changeLabel && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {metric.changeLabel}
                </span>
              )}
            </div>

            {metric.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {metric.description}
              </p>
            )}

            {metric.trend && (
              <div className="mt-4 h-[40px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={metric.trend.map((value, i) => ({ value, i }))}
                    margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient id={`gradient-${metric.title}`} x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="currentColor"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="100%"
                          stopColor="currentColor"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="currentColor"
                      strokeWidth={2}
                      fill={`url(#gradient-${metric.title})`}
                      className={colorClass}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
} 