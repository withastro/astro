import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"
import { Card } from "../ui/card"

interface ChannelAttribution {
  channel: string
  firstTouch: number
  lastTouch: number
  linear: number
  timeDecay: number
  uShape: number
  wShape: number
  customModel: number
  conversions: number
  revenue: number
}

interface AttributionModelProps {
  data: ChannelAttribution[]
  selectedModel?: keyof Omit<ChannelAttribution, "channel" | "conversions" | "revenue">
  title?: string
}

const MODEL_NAMES = {
  firstTouch: "First Touch",
  lastTouch: "Last Touch",
  linear: "Linear",
  timeDecay: "Time Decay",
  uShape: "U-Shape",
  wShape: "W-Shape",
  customModel: "Custom Model"
}

const CHANNEL_COLORS = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
]

export function AttributionModel({
  data,
  selectedModel = "wShape",
  title = "Marketing Attribution Analysis"
}: AttributionModelProps) {
  const formatValue = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const formatRevenue = (value: number) => {
    return `$${value.toLocaleString()}`
  }

  // Calculate total conversions and revenue
  const totals = data.reduce(
    (acc, channel) => ({
      conversions: acc.conversions + channel.conversions,
      revenue: acc.revenue + channel.revenue
    }),
    { conversions: 0, revenue: 0 }
  )

  // Prepare data for the pie chart
  const pieData = data.map(channel => ({
    name: channel.channel,
    value: channel[selectedModel]
  }))

  // Prepare comparison data for the bar chart
  const comparisonData = data.map(channel => ({
    channel: channel.channel,
    "Attributed Revenue": channel[selectedModel] * channel.revenue,
    "Attributed Conversions": channel[selectedModel] * channel.conversions
  }))

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm font-medium">Total Conversions</p>
          <p className="mt-1 text-2xl font-semibold">
            {totals.conversions.toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium">Total Revenue</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatRevenue(totals.revenue)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium">Attribution Model</p>
          <p className="mt-1 text-2xl font-semibold">
            {MODEL_NAMES[selectedModel]}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium">Top Channel</p>
          <p className="mt-1 text-2xl font-semibold">
            {data.sort((a, b) => b[selectedModel] - a[selectedModel])[0].channel}
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-[400px]">
          <p className="mb-2 text-sm font-medium">Attribution Distribution</p>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                label={({ name, value }) => `${name} (${formatValue(value)})`}
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={CHANNEL_COLORS[index % CHANNEL_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ payload }) => {
                  if (!payload || !payload.length) return null

                  const data = payload[0].payload
                  return (
                    <div className="rounded-lg bg-white p-3 shadow-lg">
                      <p className="font-medium">{data.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Attribution: {formatValue(data.value)}
                      </p>
                    </div>
                  )
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="h-[400px]">
          <p className="mb-2 text-sm font-medium">Revenue & Conversion Attribution</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="channel" />
              <YAxis yAxisId="revenue" orientation="left" />
              <YAxis yAxisId="conversions" orientation="right" />
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
                          {entry.name === "Attributed Revenue"
                            ? formatRevenue(entry.value)
                            : entry.value.toLocaleString()}
                        </p>
                      ))}
                    </div>
                  )
                }}
              />
              <Legend />
              <Bar
                yAxisId="revenue"
                dataKey="Attributed Revenue"
                fill={CHANNEL_COLORS[0]}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="conversions"
                dataKey="Attributed Conversions"
                fill={CHANNEL_COLORS[1]}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left font-medium">Channel</th>
              {Object.keys(MODEL_NAMES).map(model => (
                <th key={model} className="px-4 py-2 text-right font-medium">
                  {MODEL_NAMES[model as keyof typeof MODEL_NAMES]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(channel => (
              <tr key={channel.channel} className="border-b">
                <td className="py-2 font-medium">{channel.channel}</td>
                {Object.keys(MODEL_NAMES).map(model => (
                  <td key={model} className="px-4 py-2 text-right">
                    {formatValue(channel[model as keyof typeof MODEL_NAMES])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
} 