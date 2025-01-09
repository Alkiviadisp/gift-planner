import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Archive, Check, ExternalLink } from "lucide-react"
import type { Notification } from "@/lib/notifications/notification-service"

interface NotificationCardProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onArchive: (id: string) => void
  onAction: (notification: Notification) => void
}

export function NotificationCard({
  notification,
  onMarkAsRead,
  onArchive,
  onAction,
}: NotificationCardProps) {
  const isUnread = notification.status === 'unread'
  const hasAction = notification.requires_action && notification.action_url

  return (
    <Card className="relative overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <p className={`font-medium ${isUnread ? 'text-black' : 'text-gray-600'}`}>
              {notification.title}
            </p>
            <p className={`text-sm ${isUnread ? 'text-gray-600' : 'text-gray-500'}`}>
              {notification.message}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{format(new Date(notification.created_at), 'PPp')}</span>
              {notification.category && (
                <>
                  <span>•</span>
                  <span>{notification.category}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2">
            {isUnread && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onMarkAsRead(notification.id)}
              >
                <Check className="h-4 w-4" />
                <span className="sr-only">Mark as read</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onArchive(notification.id)}
            >
              <Archive className="h-4 w-4" />
              <span className="sr-only">Archive</span>
            </Button>
          </div>
        </div>
        {hasAction && (
          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => onAction(notification)}
            >
              {notification.action_text || 'View Details'}
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      {isUnread && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
      )}
    </Card>
  )
} 