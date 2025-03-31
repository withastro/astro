import { AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { Card } from "./ui/card"

interface ProgressItem {
  id: string
  title: string
  description?: string
  progress: number
  status: 'completed' | 'in-progress' | 'pending' | 'failed'
  dueDate?: string
  assignee?: {
    name: string
    avatar?: string
  }
}

interface ProgressListProps {
  items: ProgressItem[]
  title?: string
  onItemClick?: (item: ProgressItem) => void
}

export function ProgressList({
  items,
  title = "Progress",
  onItemClick
}: ProgressListProps) {
  const getStatusIcon = (status: ProgressItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: ProgressItem['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'in-progress':
        return 'bg-blue-500'
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-muted'
    }
  }

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`
                p-4 rounded-lg border
                ${onItemClick ? 'cursor-pointer hover:bg-muted/50' : ''}
              `}
              onClick={() => onItemClick?.(item)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  {getStatusIcon(item.status)}
                  <div>
                    <h4 className="text-sm font-medium">{item.title}</h4>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
                {item.assignee && (
                  <div className="flex items-center space-x-2">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                      {item.assignee.avatar ? (
                        <img
                          src={item.assignee.avatar}
                          alt={item.assignee.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        item.assignee.name.split(' ').map(n => n[0]).join('')
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {item.assignee.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.progress}%
                  </span>
                  {item.dueDate && (
                    <span className="text-muted-foreground">
                      Due {item.dueDate}
                    </span>
                  )}
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getStatusColor(item.status)} w-[${item.progress}%]`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
} 