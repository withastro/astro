import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"
import { Card } from "../ui/Card"

interface SocialMetrics {
  platform: string
  impressions: number
  engagement: number
  clicks: number
  conversions: number
  cost: number
  revenue: number
  followers: number
  posts: number
}

interface SocialMediaMetricsProps {
  data: SocialMetrics[]
  title?: string
  primaryMetric?: keyof Omit<SocialMetrics, "platform">
  secondaryMetric?: keyof Omit<SocialMetrics, "platform">
}

export function SocialMediaMetrics({
  data,
  title = "Social Media Performance",
  primaryMetric = "engagement",
  secondaryMetric = "conversions"
}: SocialMediaMetricsProps) {
  const formatValue = (value: number, key: keyof Omit<SocialMetrics, "platform">) => {
    switch (key) {
      case "cost":
      case "revenue":
        return `$${value.toLocaleString()}`
      case "engagement":
        return `${value.toFixed(2)}%`
      default:
        return value.toLocaleString()
    }
  }

  const getMetricLabel = (key: keyof Omit<SocialMetrics, "platform">) => {
    const labels: Record<keyof Omit<SocialMetrics, "platform">, string> = {
      impressions: "Impressions",
      engagement: "Engagement Rate",
      clicks: "Clicks",
      conversions: "Conversions",
      cost: "Ad Spend",
      revenue: "Revenue",
      followers: "Followers",
      posts: "Posts"
    }
    return labels[key]
  }

  const calculateStats = (metric: keyof Omit<SocialMetrics, "platform">) => {
    const values = data.map(item => item[metric])
    return {
      total: values.reduce((a, b) => a + b, 0),
      average: values.reduce((a, b) => a + b, 0) / values.length,
      max: Math.max(...values),
      min: Math.min(...values)
    }
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[primaryMetric, secondaryMetric].map((metric) => {
          const stats = calculateStats(metric)
          return (
            <div key={metric} className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {getMetricLabel(metric)}
              </p>
              <p className="text-2xl font-semibold">
                {formatValue(stats.total, metric)}
              </p>
              <div className="text-sm text-muted-foreground">
                <p>Avg: {formatValue(stats.average, metric)}</p>
                <p>Max: {formatValue(stats.max, metric)}</p>
                <p>Min: {formatValue(stats.min, metric)}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="platform" />
            <YAxis
              yAxisId="left"
              orientation="left"
              stroke="currentColor"
              className="stroke-primary"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="currentColor"
              className="stroke-secondary"
            />
            <Tooltip
              content={({ payload }) => {
                if (!payload || !payload.length) return null

                const data = payload[0].payload as SocialMetrics
                return (
                  <div className="rounded-lg bg-white p-3 shadow-lg">
                    <p className="font-medium">{data.platform}</p>
                    <p className="text-sm text-muted-foreground">
                      {getMetricLabel(primaryMetric)}:{" "}
                      {formatValue(data[primaryMetric], primaryMetric)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getMetricLabel(secondaryMetric)}:{" "}
                      {formatValue(data[secondaryMetric], secondaryMetric)}
                    </p>
                  </div>
                )
              }}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey={primaryMetric}
              name={getMetricLabel(primaryMetric)}
              fill="currentColor"
              className="fill-primary/80"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey={secondaryMetric}
              name={getMetricLabel(secondaryMetric)}
              stroke="currentColor"
              className="stroke-secondary"
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
} 