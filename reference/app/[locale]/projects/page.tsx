import { ProjectStatus } from "@/app/components/ProjectStatus"
import { Card } from "@/app/components/ui/card"

interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'completed' | 'on-hold'
  progress: number
  dueDate: string
  team: string[]
}

// This would typically come from a database
const projects: Project[] = [
  {
    id: '1',
    name: 'E-commerce Platform Redesign',
    description: 'Modernizing the user interface and improving the checkout process',
    status: 'active',
    progress: 75,
    dueDate: '2024-04-15',
    team: ['John Doe', 'Jane Smith', 'Mike Johnson']
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'Creating a native mobile application for iOS and Android',
    status: 'active',
    progress: 45,
    dueDate: '2024-05-20',
    team: ['Sarah Wilson', 'Tom Brown']
  },
  {
    id: '3',
    name: 'Data Analytics Dashboard',
    description: 'Building a real-time analytics dashboard for business metrics',
    status: 'completed',
    progress: 100,
    dueDate: '2024-03-01',
    team: ['Alex Turner', 'Emily Clark']
  },
  {
    id: '4',
    name: 'API Integration Project',
    description: 'Integrating third-party APIs for enhanced functionality',
    status: 'on-hold',
    progress: 30,
    dueDate: '2024-06-10',
    team: ['Chris Martin', 'Lisa Anderson']
  }
]

export default async function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground mt-2">
          Manage and track all your ongoing projects.
        </p>
      </div>

      <div className="grid gap-6">
        {projects.map((project) => (
          <Card key={project.id}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{project.name}</h3>
                <ProjectStatus status={project.status} />
              </div>
              
              <p className="text-muted-foreground mt-2">
                {project.description}
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full">
                    <div 
                      className={`h-full bg-primary rounded-full transition-all w-[${project.progress}%]`}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Due Date: </span>
                    {new Date(project.dueDate).toLocaleDateString()}
                  </div>
                  <div className="flex -space-x-2">
                    {project.team.map((member, i) => (
                      <div
                        key={i}
                        className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm border-2 border-background"
                        title={member}
                      >
                        {member.split(' ').map(n => n[0]).join('')}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 