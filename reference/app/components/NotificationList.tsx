import { AlertTriangle, Bell, CheckCircle, Info, X } from "lucide-react"
import { Card } from "./ui/card"

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  timestamp: string
  read?: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationListProps {
  notifications: Notification[]
  onDismiss?: (id: string) => void
  onMarkAsRead?: (id: string) => void
}

export function NotificationList({
  notifications,
  onDismiss,
  onMarkAsRead
}: NotificationListProps) {
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getBackgroundColor = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return 'hover:bg-blue-50'
      case 'warning':
        return 'hover:bg-yellow-50'
      case 'success':
        return 'hover:bg-green-50'
      case 'error':
        return 'hover:bg-red-50'
      default:
        return 'hover:bg-muted'
    }
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Notifications</h3>
          {notifications.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {notifications.length} unread
            </span>
          )}
        </div>

        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`
                  p-4 rounded-lg transition-colors relative
                  ${getBackgroundColor(notification.type)}
                  ${notification.read ? 'opacity-75' : ''}
                `}
                onClick={() => onMarkAsRead?.(notification.id)}
              >
                <div className="flex items-start space-x-4">
                  {getIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      </div>
                      {onDismiss && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDismiss(notification.id)
                          }}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <time className="text-xs text-muted-foreground">
                        {notification.timestamp}
                      </time>
                      {notification.action && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            notification.action?.onClick()
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          {notification.action.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  )
} 