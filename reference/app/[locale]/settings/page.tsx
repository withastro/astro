import { SettingsSection } from "@/app/components/SettingsSection"
import { Card } from "@/app/components/ui/card"

const settings = {
  profile: {
    title: "Profile Settings",
    description: "Manage your personal information and preferences.",
    fields: [
      { label: "Full Name", value: "John Doe", type: "text" },
      { label: "Email", value: "john.doe@example.com", type: "email" },
      { label: "Role", value: "Project Manager", type: "text" },
      { label: "Time Zone", value: "Europe/Berlin", type: "select" },
      { label: "Language", value: "German", type: "select" },
    ]
  },
  notifications: {
    title: "Notification Preferences",
    description: "Configure how you want to receive updates.",
    fields: [
      { label: "Email Notifications", value: true, type: "toggle" },
      { label: "Push Notifications", value: false, type: "toggle" },
      { label: "Project Updates", value: true, type: "toggle" },
      { label: "Team Messages", value: true, type: "toggle" },
      { label: "Task Reminders", value: true, type: "toggle" },
    ]
  },
  security: {
    title: "Security Settings",
    description: "Manage your account security and authentication methods.",
    fields: [
      { label: "Two-Factor Authentication", value: true, type: "toggle" },
      { label: "Session Timeout", value: "30 minutes", type: "select" },
      { label: "Password", value: "••••••••", type: "password" },
      { label: "Recovery Email", value: "backup@example.com", type: "email" },
    ]
  }
}

export default async function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-6">
        {Object.entries(settings).map(([key, section]) => (
          <Card key={key}>
            <div className="p-6">
              <SettingsSection
                title={section.title}
                description={section.description}
                fields={section.fields}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 