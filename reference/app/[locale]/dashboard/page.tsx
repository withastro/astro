import { Card } from "@/app/components/ui/card"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to your enterprise dashboard. Here's an overview of your projects and activities.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <div className="p-6">
            <h3 className="font-semibold">Active Projects</h3>
            <div className="mt-2 text-3xl font-bold">12</div>
            <p className="text-sm text-muted-foreground mt-2">
              4 projects due this week
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h3 className="font-semibold">Team Members</h3>
            <div className="mt-2 text-3xl font-bold">24</div>
            <p className="text-sm text-muted-foreground mt-2">
              Across 5 departments
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h3 className="font-semibold">Tasks Completed</h3>
            <div className="mt-2 text-3xl font-bold">128</div>
            <p className="text-sm text-muted-foreground mt-2">
              This month
            </p>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="p-6">
            <h3 className="font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {[
                "Project Alpha milestone completed",
                "New team member onboarded",
                "Client meeting scheduled",
                "Documentation updated",
              ].map((activity, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <p className="text-sm">{activity}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h3 className="font-semibold mb-4">Upcoming Deadlines</h3>
            <div className="space-y-4">
              {[
                "Project Beta Review - Tomorrow",
                "Team Meeting - Wednesday",
                "Client Presentation - Next Week",
                "Phase 2 Launch - In 2 Weeks",
              ].map((deadline, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <p className="text-sm">{deadline}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 