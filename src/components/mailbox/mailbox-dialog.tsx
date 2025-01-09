import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Notification, notificationService } from '@/lib/notifications/notification-service'
import { NotificationCard } from './notification-card'
import { useSupabase } from '@/lib/supabase/provider'
import { Archive, Check } from 'lucide-react'

interface MailboxDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MailboxDialog({ open, onOpenChange }: MailboxDialogProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user } = useSupabase()

  // Handle notifications setup
  useEffect(() => {
    let channel: any

    const setupNotifications = async () => {
      try {
        setLoading(true)
        
        // Check if we have a valid user
        if (!user) {
          console.log('No authenticated user')
          return
        }

        // Load initial notifications
        const initialNotifications = await notificationService.getActiveNotifications()
        setNotifications(initialNotifications)

        // Subscribe to new notifications
        channel = await notificationService.subscribeToNotifications(
          user.id,
          (notification) => {
            setNotifications(prev => [notification, ...prev])
          }
        )
      } catch (error) {
        console.error('Error setting up notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    if (open && user) {
      setupNotifications()
    }

    return () => {
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [open, user])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId)
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, status: 'read' as const, read_at: new Date().toISOString() }
            : n
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleArchive = async (notificationId: string) => {
    try {
      await notificationService.archiveNotification(notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Error archiving notification:', error)
    }
  }

  const handleAction = (notification: Notification) => {
    if (notification.action_url) {
      router.push(notification.action_url)
      onOpenChange(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => n.status === 'unread')
      await Promise.all(
        unreadNotifications.map(n => notificationService.markAsRead(n.id))
      )
      setNotifications(prev =>
        prev.map(n => ({
          ...n,
          status: 'read' as const,
          read_at: new Date().toISOString()
        }))
      )
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleArchiveAll = async () => {
    try {
      await Promise.all(
        notifications.map(n => notificationService.archiveNotification(n.id))
      )
      setNotifications([])
    } catch (error) {
      console.error('Error archiving all notifications:', error)
    }
  }

  const hasUnread = notifications.some(n => n.status === 'unread')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Notifications</DialogTitle>
          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={handleMarkAllAsRead}
                disabled={!hasUnread}
              >
                <Check className="mr-2 h-4 w-4" />
                Mark All Read
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={handleArchiveAll}
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive All
              </Button>
            </div>
          )}
        </DialogHeader>
        
        <ScrollArea className="flex-grow">
          <div className="space-y-4 p-4">
            {!user ? (
              <p className="text-center text-muted-foreground">Please sign in to view notifications</p>
            ) : loading ? (
              <p className="text-center text-muted-foreground">Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p className="text-center text-muted-foreground">No notifications</p>
            ) : (
              notifications.map(notification => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onArchive={handleArchive}
                  onAction={handleAction}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 