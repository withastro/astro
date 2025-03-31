import { Card } from "./ui/Card"

interface Task {
  id: string
  title: string
  description?: string
  assignee?: string
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
}

interface Column {
  id: string
  title: string
  tasks: Task[]
}

interface KanbanBoardProps {
  columns: Column[]
}

export function KanbanBoard({ columns }: KanbanBoardProps) {
  return (
    <div className="flex space-x-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div key={column.id} className="flex-shrink-0 w-80">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              {column.title} ({column.tasks.length})
            </h3>
          </div>
          <div className="space-y-3">
            {column.tasks.map((task) => (
              <Card key={task.id}>
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="text-sm font-medium">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    {task.assignee && (
                      <div className="flex items-center space-x-2">
                        <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          {task.assignee.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-muted-foreground">
                          {task.assignee}
                        </span>
                      </div>
                    )}
                    {task.priority && (
                      <span className={`
                        px-2 py-0.5 rounded-full
                        ${task.priority === 'high' ? 'bg-red-100 text-red-800' : ''}
                        ${task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${task.priority === 'low' ? 'bg-green-100 text-green-800' : ''}
                      `}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                    )}
                  </div>
                  {task.dueDate && (
                    <div className="text-xs text-muted-foreground">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
} 