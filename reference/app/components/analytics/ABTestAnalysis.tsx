import { AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"
import { Card } from "../ui/card"

interface TestVariant {
  id: string
  name: string
  metrics: {
    visitors: number
    conversions: number
    revenue: number
    avgOrderValue: number
    bounceRate: number
  }
  timeline: Array<{
    date: string
    visitors: number
    conversions: number
    revenue: number
  }>
}

interface ABTest {
  id: string
  name: string
  status: "running" | "completed" | "stopped"
  startDate: string
  endDate?: string
  targetMetric: "conversions" | "revenue" | "avgOrderValue" | "bounceRate"
  variants: TestVariant[]
  confidenceLevel: number
  minimumDetectableEffect: number
}

interface ABTestAnalysisProps {
  test: ABTest
  title?: string
}

export function ABTestAnalysis({
  test,
  title = "A/B Test Analysis"
}: ABTestAnalysisProps) {
  // Calculate key metrics and statistical significance
  const calculateMetrics = (variant: TestVariant) => {
    const { metrics } = variant
    return {
      ...metrics,
      conversionRate: (metrics.conversions / metrics.visitors) * 100,
      revenuePerVisitor: metrics.revenue / metrics.visitors
    }
  }

  const variants = test.variants.map(v => ({
    ...v,
    calculatedMetrics: calculateMetrics(v)
  }))

  const controlVariant = variants[0]
  const testVariants = variants.slice(1)

  const formatValue = (value: number, metric: string) => {
    switch (metric) {
      case "conversionRate":
      case "bounceRate":
        return `${value.toFixed(2)}%`
      case "revenue":
      case "avgOrderValue":
      case "revenuePerVisitor":
        return `$${value.toFixed(2)}`
      default:
        return value.toLocaleString()
    }
  }

  const getMetricLabel = (metric: string) => {
    const labels: Record<string, string> = {
      visitors: "Visitors",
      conversions: "Conversions",
      conversionRate: "Conversion Rate",
      revenue: "Revenue",
      avgOrderValue: "Avg. Order Value",
      revenuePerVisitor: "Revenue per Visitor",
      bounceRate: "Bounce Rate"
    }
    return labels[metric] || metric
  }

  const calculateLift = (testValue: number, controlValue: number) => {
    return ((testValue - controlValue) / controlValue) * 100
  }

  const isSignificant = (variant: typeof variants[0]) => {
    return Math.abs(
      calculateLift(
        variant.calculatedMetrics[test.targetMetric],
        controlVariant.calculatedMetrics[test.targetMetric]
      )
    ) >= test.minimumDetectableEffect
  }

  // Prepare data for charts
  const comparisonData = variants.map(variant => ({
    name: variant.name,
    ...variant.calculatedMetrics
  }))

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {test.startDate} - {test.endDate || "Ongoing"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              test.status === "completed"
                ? "bg-green-100 text-green-800"
                : test.status === "running"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {testVariants.map(variant => (
          <Card key={variant.id} className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">{variant.name}</p>
              {isSignificant(variant) ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <p className="text-2xl font-semibold">
              {formatValue(
                variant.calculatedMetrics[test.targetMetric],
                test.targetMetric
              )}
            </p>
            <div className="mt-1 flex items-center gap-1 text-sm">
              <TrendingUp className="h-4 w-4" />
              <span
                className={
                  calculateLift(
                    variant.calculatedMetrics[test.targetMetric],
                    controlVariant.calculatedMetrics[test.targetMetric]
                  ) >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {formatValue(
                  calculateLift(
                    variant.calculatedMetrics[test.targetMetric],
                    controlVariant.calculatedMetrics[test.targetMetric]
                  ),
                  "conversionRate"
                )}{" "}
                vs Control
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="h-[300px]">
          <p className="mb-2 text-sm font-medium">Metric Comparison</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                content={({ payload, label }) => {
                  if (!payload || !payload.length) return null

                  return (
                    <div className="rounded-lg bg-white p-3 shadow-lg">
                      <p className="font-medium">{label}</p>
                      {payload.map((entry: { name: string; value: number }) => (
                        <p
                          key={entry.name}
                          className="text-sm text-muted-foreground"
                        >
                          {getMetricLabel(entry.name)}:{" "}
                          {formatValue(entry.value, entry.name)}
                        </p>
                      ))}
                    </div>
                  )
                }}
              />
              <Legend />
              <Bar
                dataKey={test.targetMetric}
                name={getMetricLabel(test.targetMetric)}
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="h-[300px]">
          <p className="mb-2 text-sm font-medium">Performance Over Time</p>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                content={({ payload, label }) => {
                  if (!payload || !payload.length) return null

                  return (
                    <div className="rounded-lg bg-white p-3 shadow-lg">
                      <p className="font-medium">{label}</p>
                      {payload.map((entry: { name: string; value: number }) => (
                        <p
                          key={entry.name}
                          className="text-sm text-muted-foreground"
                        >
                          {entry.name}:{" "}
                          {formatValue(entry.value, test.targetMetric)}
                        </p>
                      ))}
                    </div>
                  )
                }}
              />
              <Legend />
              {variants.map((variant, index) => (
                <Line
                  key={variant.id}
                  data={variant.timeline}
                  type="monotone"
                  dataKey={test.targetMetric}
                  name={variant.name}
                  stroke={index === 0 ? "#3B82F6" : "#10B981"}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Statistical Analysis</h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">Confidence Level</p>
            <p className="mt-1 text-2xl font-semibold">
              {(test.confidenceLevel * 100).toFixed(1)}%
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">Minimum Detectable Effect</p>
            <p className="mt-1 text-2xl font-semibold">
              {test.minimumDetectableEffect.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">Sample Size</p>
            <p className="mt-1 text-2xl font-semibold">
              {variants
                .reduce((sum, v) => sum + v.calculatedMetrics.visitors, 0)
                .toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
} 