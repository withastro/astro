import { Card } from "@/components/ui/card"

interface TimelineEvent {
  title: string
  description: string
  date: string
  icon?: React.ReactNode
  status?: 'completed' | 'in-progress' | 'pending'
}

interface TimelineProps {
  events: TimelineEvent[]
  title?: string
}

export function Timeline({ events, title }: TimelineProps) {
  return (
    <Card>
      <div className="p-6">
        {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
        <div className="space-y-8">
          {events.map((event, index) => (
            <div key={index} className="relative pl-8">
              {index !== events.length - 1 && (
                <div className="absolute left-[11px] top-[24px] bottom-[-32px] w-[2px] bg-border" />
              )}
              <div className="absolute left-0 top-1 w-6 h-6 rounded-full border-2 border-primary bg-background flex items-center justify-center">
                {event.icon}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-medium">{event.title}</h4>
                  {event.status && (
                    <span className={`
                      text-xs px-2 py-0.5 rounded-full
                      ${event.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                      ${event.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : ''}
                      ${event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                    `}>
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {event.description}
                </p>
                <time className="text-xs text-muted-foreground mt-2 block">
                  {event.date}
                </time>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
} 