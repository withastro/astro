import { MessageSquare, MoreVertical, ThumbsUp } from "lucide-react"
import { Card } from "./ui/Card"

interface Comment {
  id: string
  author: {
    name: string
    avatar?: string
  }
  content: string
  timestamp: string
  likes: number
  replies?: Comment[]
  liked?: boolean
}

interface CommentThreadProps {
  comments: Comment[]
  onLike?: (commentId: string) => void
  onReply?: (commentId: string, content: string) => void
}

export function CommentThread({
  comments,
  onLike,
  onReply
}: CommentThreadProps) {
  const renderComment = (comment: Comment, depth = 0) => {
    return (
      <div key={comment.id} className={depth > 0 ? 'ml-8 mt-4' : ''}>
        <div className="flex space-x-4">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              {comment.author.avatar ? (
                <img
                  src={comment.author.avatar}
                  alt={comment.author.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                comment.author.name.split(' ').map(n => n[0]).join('')
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-medium">
                    {comment.author.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {comment.content}
                  </p>
                </div>
                <button className="text-muted-foreground hover:text-primary">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center space-x-4 text-xs">
                <time className="text-muted-foreground">
                  {comment.timestamp}
                </time>
                <button
                  onClick={() => onLike?.(comment.id)}
                  className={`
                    flex items-center space-x-1
                    ${comment.liked ? 'text-primary' : 'text-muted-foreground hover:text-primary'}
                  `}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>{comment.likes}</span>
                </button>
                <button
                  onClick={() => onReply?.(comment.id, '')}
                  className="flex items-center space-x-1 text-muted-foreground hover:text-primary"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Reply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-4 mt-4">
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-6">Comments</h3>
        <div className="space-y-6">
          {comments.map(comment => renderComment(comment))}
        </div>
      </div>
    </Card>
  )
} 