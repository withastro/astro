import { cn } from "@/lib/utils"

interface ProjectStatusProps {
  status: 'active' | 'completed' | 'on-hold'
}

export function ProjectStatus({ status }: ProjectStatusProps) {
  return (
    <div
      className={cn(
        "px-2.5 py-0.5 rounded-full text-xs font-medium",
        status === 'active' && "bg-green-100 text-green-800",
        status === 'completed' && "bg-blue-100 text-blue-800",
        status === 'on-hold' && "bg-yellow-100 text-yellow-800"
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  )
} 