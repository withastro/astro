import {
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip
} from "recharts"
import { Card } from "../ui/Card"

interface DemographicData {
  name: string
  value: number
  color?: string
}

interface BehaviorMetric {
  metric: string
  value: number
  average: number
}

interface AudienceInsightsProps {
  demographics: {
    age: DemographicData[]
    gender: DemographicData[]
    location: DemographicData[]
    device: DemographicData[]
  }
  behavior: BehaviorMetric[]
  title?: string
}

const DEFAULT_COLORS = [
  "#3B82F6", // blue-500
  "#10B981", // emerald-500
  "#F59E0B", // amber-500
  "#EF4444", // red-500
  "#8B5CF6", // violet-500
  "#EC4899", // pink-500
]

export function AudienceInsights({
  demographics,
  behavior,
  title = "Audience Insights"
}: AudienceInsightsProps) {
  const renderPieChart = (data: DemographicData[], title: string) => (
    <div className="h-[200px]">
      <p className="mb-2 text-sm font-medium">{title}</p>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={80}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ payload }) => {
              if (!payload || !payload.length) return null

              const data = payload[0].payload as DemographicData
              return (
                <div className="rounded-lg bg-white p-3 shadow-lg">
                  <p className="font-medium">{data.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.value.toFixed(1)}%
                  </p>
                </div>
              )
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>

      <div className="grid gap-6 sm:grid-cols-2">
        {renderPieChart(demographics.age, "Age Distribution")}
        {renderPieChart(demographics.gender, "Gender Distribution")}
        {renderPieChart(demographics.location, "Geographic Distribution")}
        {renderPieChart(demographics.device, "Device Usage")}
      </div>

      <div className="mt-6 h-[300px]">
        <p className="mb-2 text-sm font-medium">Audience Behavior</p>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%">
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar
              name="Audience"
              dataKey="value"
              data={behavior}
              fill="currentColor"
              fillOpacity={0.6}
              className="fill-primary/60 stroke-primary"
            />
            <Radar
              name="Average"
              dataKey="average"
              data={behavior}
              fill="currentColor"
              fillOpacity={0.2}
              className="fill-muted/20 stroke-muted-foreground"
            />
            <Legend />
            <Tooltip
              content={({ payload }) => {
                if (!payload || !payload.length) return null

                const data = payload[0].payload as BehaviorMetric
                return (
                  <div className="rounded-lg bg-white p-3 shadow-lg">
                    <p className="font-medium">{data.metric}</p>
                    <p className="text-sm text-muted-foreground">
                      Current: {data.value.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Average: {data.average.toFixed(1)}%
                    </p>
                  </div>
                )
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
} 