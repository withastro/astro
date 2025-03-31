import { BarChart } from "@/app/components/charts/BarChart"
import { LineChart } from "@/app/components/charts/LineChart"
import { StatCard } from "@/app/components/StatCard"
import { Card } from "@/app/components/ui/card"

const stats = [
  {
    title: "Total Projects",
    value: "48",
    change: "+12%",
    trend: "up",
    description: "Compared to last month"
  },
  {
    title: "Active Tasks",
    value: "320",
    change: "+8%",
    trend: "up",
    description: "Compared to last month"
  },
  {
    title: "Team Velocity",
    value: "94",
    change: "-3%",
    trend: "down",
    description: "Story points per sprint"
  },
  {
    title: "Completion Rate",
    value: "89%",
    change: "+2%",
    trend: "up",
    description: "Tasks completed on time"
  }
]

const projectData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Completed',
      data: [30, 45, 35, 50, 40, 60],
      color: 'primary'
    },
    {
      label: 'In Progress',
      data: [25, 30, 40, 35, 45, 40],
      color: 'secondary'
    }
  ]
}

const velocityData = {
  labels: ['Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4', 'Sprint 5', 'Sprint 6'],
  datasets: [
    {
      label: 'Velocity',
      data: [85, 90, 88, 94, 92, 96],
      color: 'primary'
    }
  ]
}

export default async function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Track your team's performance and project metrics.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Project Progress</h3>
            <div className="h-[300px]">
              <BarChart data={projectData} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Team Velocity</h3>
            <div className="h-[300px]">
              <LineChart data={velocityData} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 