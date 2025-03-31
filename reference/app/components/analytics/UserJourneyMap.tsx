import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Sankey,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"
import { Card } from "../ui/card"

interface Touchpoint {
  id: string
  channel: string
  stage: "awareness" | "consideration" | "decision" | "retention"
  interactions: number
  conversions: number
  value: number
  timestamp: string
}

interface JourneyPath {
  source: string
  target: string
  value: number
  conversionRate: number
}

interface UserJourneyMapProps {
  touchpoints: Touchpoint[]
  paths: JourneyPath[]
  timeseriesData: Array<{
    date: string
    [key: string]: number | string
  }>
  title?: string
}

const STAGE_COLORS = {
  awareness: "#3B82F6",   // blue
  consideration: "#10B981", // emerald
  decision: "#F59E0B",    // amber
  retention: "#8B5CF6"    // violet
}

export function UserJourneyMap({
  touchpoints,
  paths,
  timeseriesData,
  title = "User Journey Analysis"
}: UserJourneyMapProps) {
  // Transform data for Sankey diagram
  const sankeyData = {
    nodes: touchpoints.map(t => ({
      name: t.id,
      value: t.interactions,
      color: STAGE_COLORS[t.stage],
      channel: t.channel,
      stage: t.stage,
      conversions: t.conversions
    })),
    links: paths.map(p => ({
      source: p.source,
      target: p.target,
      value: p.value,
      conversionRate: p.conversionRate
    }))
  }

  // Get unique channels for the time series
  const channels = [...new Set(touchpoints.map(t => t.channel))]

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>

      <div className="mb-8 h-[400px]">
        <p className="mb-2 text-sm font-medium">Journey Flow Visualization</p>
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={sankeyData}
            node={{
              nodePadding: 50,
              nodeWidth: 10,
              nodeRadius: 5
            }}
            link={{
              stroke: "#374151"
            }}
            width={960}
            height={500}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Tooltip
              content={({ payload }) => {
                if (!payload || !payload.length) return null

                const node = payload[0].payload
                if (!node) return null

                return (
                  <div className="rounded-lg bg-white p-3 shadow-lg">
                    <p className="font-medium">{node.channel}</p>
                    <p className="text-sm text-muted-foreground">
                      Stage: {node.stage}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Interactions: {node.value.toLocaleString()}
                    </p>
                    {node.conversionRate && (
                      <p className="text-sm text-muted-foreground">
                        Conversion Rate: {node.conversionRate.toFixed(1)}%
                      </p>
                    )}
                  </div>
                )
              }}
            />
          </Sankey>
        </ResponsiveContainer>
      </div>

      <div className="h-[300px]">
        <p className="mb-2 text-sm font-medium">Channel Performance Over Time</p>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timeseriesData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              content={({ payload, label }) => {
                if (!payload || !payload.length) return null

                return (
                  <div className="rounded-lg bg-white p-3 shadow-lg">
                    <p className="font-medium">{label}</p>
                    {payload.map((entry: { name: string; value: number; color: string }) => (
                      <p
                        key={entry.name}
                        className="text-sm text-muted-foreground"
                        style={{ color: entry.color }}
                      >
                        {entry.name}: {entry.value.toLocaleString()} interactions
                      </p>
                    ))}
                  </div>
                )
              }}
            />
            <Legend />
            {channels.map((channel, index) => (
              <Line
                key={channel}
                type="monotone"
                dataKey={channel}
                name={channel}
                stroke={Object.values(STAGE_COLORS)[index % 4]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(
          touchpoints.reduce((acc, t) => ({
            ...acc,
            [t.stage]: {
              interactions: (acc[t.stage]?.interactions || 0) + t.interactions,
              conversions: (acc[t.stage]?.conversions || 0) + t.conversions,
              value: (acc[t.stage]?.value || 0) + t.value
            }
          }), {} as Record<string, { interactions: number; conversions: number; value: number }>)
        ).map(([stage, data]) => (
          <Card key={stage} className="p-4">
            <p className="text-sm font-medium capitalize">{stage}</p>
            <p className="mt-1 text-2xl font-semibold">
              {data.interactions.toLocaleString()}
            </p>
            <div className="mt-1 text-sm text-muted-foreground">
              <p>Conversions: {data.conversions.toLocaleString()}</p>
              <p>Value: ${data.value.toLocaleString()}</p>
              <p>
                Conv. Rate:{" "}
                {((data.conversions / data.interactions) * 100).toFixed(1)}%
              </p>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  )
} 