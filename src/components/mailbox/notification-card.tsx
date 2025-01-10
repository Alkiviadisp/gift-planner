import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { 
  Archive, 
  Check, 
  ExternalLink,
  Bell,
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  type LucideIcon
} from "lucide-react"
import type { AppNotification } from "@/lib/notifications/notification-service"
import { cn } from "@/lib/utils"

interface NotificationCardProps {
  notification: AppNotification
  onMarkAsRead: (id: string) => void
  onArchive: (id: string) => void
  onAction: (notification: AppNotification) => void
}

const notificationStyles: Record<AppNotification['type'], {
  icon: LucideIcon
  iconClass: string
  bgClass: string
}> = {
  info: {
    icon: Info,
    iconClass: 'text-blue-500',
    bgClass: 'bg-blue-50 dark:bg-blue-500/10'
  },
  success: {
    icon: CheckCircle2,
    iconClass: 'text-green-500',
    bgClass: 'bg-green-50 dark:bg-green-500/10'
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-yellow-500',
    bgClass: 'bg-yellow-50 dark:bg-yellow-500/10'
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-red-500',
    bgClass: 'bg-red-50 dark:bg-red-500/10'
  }
}

export function NotificationCard({
  notification,
  onMarkAsRead,
  onArchive,
  onAction,
}: NotificationCardProps) {
  const isUnread = notification.status === 'active'
  const hasAction = notification.requires_action && notification.action_url
  const style = notificationStyles[notification.type]
  const Icon = style.icon

  return (
    <div className={cn(
      "group relative transition-colors duration-200",
      isUnread ? style.bgClass : 'hover:bg-muted/40'
    )}>
      <div className="p-4 sm:px-6">
        <div className="flex gap-4">
          <div className={cn(
            "mt-1 shrink-0 rounded-full p-2",
            isUnread ? style.bgClass : "bg-muted"
          )}>
            <Icon className={cn(
              "h-4 w-4",
              isUnread ? style.iconClass : "text-muted-foreground/60"
            )} />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className={cn(
                  "font-medium line-clamp-1",
                  isUnread ? "text-foreground" : "text-muted-foreground"
                )}>
                  {notification.title}
                </p>
                <p className={cn(
                  "text-sm line-clamp-2",
                  isUnread ? "text-muted-foreground" : "text-muted-foreground/80"
                )}>
                  {notification.message}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground/60">
                  <span>{format(new Date(notification.created_at), 'PPp')}</span>
                  {notification.category && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 capitalize">
                        {notification.category}
                      </span>
                    </>
                  )}
                  {isUnread && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center text-primary">New</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-1 sm:gap-2">
                {isUnread && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onMarkAsRead(notification.id)}
                  >
                    <Check className="h-4 w-4" />
                    <span className="sr-only">Mark as read</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onArchive(notification.id)}
                >
                  <Archive className="h-4 w-4" />
                  <span className="sr-only">Archive</span>
                </Button>
              </div>
            </div>
            {hasAction && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 text-xs font-medium",
                    isUnread && "border-primary text-primary hover:bg-primary/10"
                  )}
                  onClick={() => onAction(notification)}
                >
                  {notification.action_text || 'View Details'}
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 