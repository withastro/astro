import { Link as LinkIcon, Mail, MapPin, Phone } from "lucide-react"
import { Card } from "./ui/card"

interface TeamMember {
  name: string
  role: string
  avatar?: string
  email?: string
  phone?: string
  location?: string
  website?: string
  bio?: string
  skills?: string[]
}

interface TeamMemberCardProps {
  member: TeamMember
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-semibold">
            {member.avatar ? (
              <img
                src={member.avatar}
                alt={member.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              member.name.split(' ').map(n => n[0]).join('')
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{member.name}</h3>
            <p className="text-sm text-muted-foreground">{member.role}</p>
          </div>
        </div>

        {member.bio && (
          <p className="mt-4 text-sm text-muted-foreground">
            {member.bio}
          </p>
        )}

        {member.skills && (
          <div className="mt-4 flex flex-wrap gap-2">
            {member.skills.map((skill, i) => (
              <span
                key={i}
                className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-2">
          {member.email && (
            <div className="flex items-center space-x-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${member.email}`} className="text-primary hover:underline">
                {member.email}
              </a>
            </div>
          )}
          {member.phone && (
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${member.phone}`} className="text-primary hover:underline">
                {member.phone}
              </a>
            </div>
          )}
          {member.location && (
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{member.location}</span>
            </div>
          )}
          {member.website && (
            <div className="flex items-center space-x-2 text-sm">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <a
                href={member.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {member.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
} 