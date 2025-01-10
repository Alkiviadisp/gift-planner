import { formatDistanceToNow } from 'date-fns'
import { NotificationAction } from './notification-action'

interface NotificationItemProps {
  id: string
  title: string
  message: string
  category: string
  status: string
  metadata?: {
    group_id?: string
  }
  createdAt: string
  onUpdate?: () => void
}

export function NotificationItem({
  id,
  title,
  message,
  category,
  status,
  metadata,
  createdAt,
  onUpdate
}: NotificationItemProps) {
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true })

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{message}</p>
          <p className="mt-2 text-xs text-gray-400">{timeAgo}</p>
        </div>
      </div>
      <NotificationAction 
        notificationId={id}
        category={category}
        status={status}
        metadata={metadata}
        onActionComplete={onUpdate}
      />
    </div>
  )
} 