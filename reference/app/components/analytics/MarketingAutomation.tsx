import { AlertTriangle, CheckCircle2, Clock, Pause, Play } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"
import { Card } from "../ui/Card"

interface AutomationRule {
  id: string
  name: string
  platform: "Google Ads" | "Facebook Ads" | "LinkedIn Ads"
  trigger: string
  action: string
  status: "active" | "paused" | "error"
  lastRun: string
  nextRun: string
  metrics: {
    executions: number
    successRate: number
    avgResponseTime: number
    costSavings: number
  }
}

interface PerformanceData {
  timestamp: string
  automatedActions: number
  manualActions: number
  costSavings: number
  efficiency: number
}

interface MarketingAutomationProps {
  rules: AutomationRule[]
  performance: PerformanceData[]
  title?: string
}

export function MarketingAutomation({
  rules,
  performance,
  title = "Marketing Automation Dashboard"
}: MarketingAutomationProps) {
  const getStatusIcon = (status: AutomationRule["status"]) => {
    switch (status) {
      case "active":
        return <Play className="h-4 w-4 text-green-500" />
      case "paused":
        return <Pause className="h-4 w-4 text-amber-500" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusText = (status: AutomationRule["status"]) => {
    switch (status) {
      case "active":
        return "Active"
      case "paused":
        return "Paused"
      case "error":
        return "Error"
    }
  }

  // Calculate summary metrics
  const summary = rules.reduce(
    (acc, rule) => ({
      totalExecutions: acc.totalExecutions + rule.metrics.executions,
      avgSuccessRate:
        acc.avgSuccessRate + rule.metrics.successRate / rules.length,
      totalSavings: acc.totalSavings + rule.metrics.costSavings,
      activeRules: acc.activeRules + (rule.status === "active" ? 1 : 0)
    }),
    { totalExecutions: 0, avgSuccessRate: 0, totalSavings: 0, activeRules: 0 }
  )

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm font-medium">Active Rules</p>
          <p className="mt-1 text-2xl font-semibold">
            {summary.activeRules}/{rules.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium">Total Executions</p>
          <p className="mt-1 text-2xl font-semibold">
            {summary.totalExecutions.toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium">Avg. Success Rate</p>
          <p className="mt-1 text-2xl font-semibold">
            {summary.avgSuccessRate.toFixed(1)}%
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium">Cost Savings</p>
          <p className="mt-1 text-2xl font-semibold">
            ${summary.totalSavings.toLocaleString()}
          </p>
        </Card>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="h-[300px]">
          <p className="mb-2 text-sm font-medium">Automation Performance</p>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performance}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="timestamp" />
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
                          {entry.name}: {entry.value.toLocaleString()}
                        </p>
                      ))}
                    </div>
                  )
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="automatedActions"
                name="Automated Actions"
                stroke="#3B82F6"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="manualActions"
                name="Manual Actions"
                stroke="#10B981"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="h-[300px]">
          <p className="mb-2 text-sm font-medium">Efficiency & Cost Savings</p>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performance}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="timestamp" />
              <YAxis yAxisId="efficiency" orientation="left" />
              <YAxis yAxisId="savings" orientation="right" />
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
                          {entry.name === "Cost Savings"
                            ? `$${entry.value.toLocaleString()}`
                            : `${entry.value.toFixed(1)}%`}
                        </p>
                      ))}
                    </div>
                  )
                }}
              />
              <Legend />
              <Area
                yAxisId="efficiency"
                type="monotone"
                dataKey="efficiency"
                name="Efficiency"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.1}
              />
              <Area
                yAxisId="savings"
                type="monotone"
                dataKey="costSavings"
                name="Cost Savings"
                stroke="#F59E0B"
                fill="#F59E0B"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Automation Rules</h4>
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <h5 className="font-medium">{rule.name}</h5>
                    <span className="rounded bg-muted px-2 py-1 text-xs">
                      {rule.platform}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    When {rule.trigger} then {rule.action}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {getStatusIcon(rule.status)}
                  <span
                    className={`${
                      rule.status === "active"
                        ? "text-green-500"
                        : rule.status === "paused"
                        ? "text-amber-500"
                        : "text-red-500"
                    }`}
                  >
                    {getStatusText(rule.status)}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{rule.metrics.successRate}% success rate</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{rule.metrics.avgResponseTime}ms avg. response</span>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span>Last run: {rule.lastRun}</span>
                <span>Next run: {rule.nextRun}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Card>
  )
} 