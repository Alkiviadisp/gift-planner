import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { AppNotification, notificationService } from '@/lib/notifications/notification-service'
import { NotificationCard } from './notification-card'
import { useSupabase } from '@/lib/supabase/provider'
import { Archive, Check, Bell } from 'lucide-react'
import { RealtimeChannel } from '@supabase/supabase-js'

interface MailboxDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNotificationsChange?: (count: number) => void
}

export function MailboxDialog({ open, onOpenChange, onNotificationsChange }: MailboxDialogProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user } = useSupabase()
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Update parent component when notifications change
  useEffect(() => {
    onNotificationsChange?.(notifications.length)
  }, [notifications.length, onNotificationsChange])

  // Handle notifications setup
  useEffect(() => {
    let mounted = true

    const setupNotifications = async () => {
      try {
        if (!mounted) return
        setLoading(true)
        
        // Check if we have a valid user
        if (!user) {
          console.log('No authenticated user')
          return
        }

        // Load initial notifications
        const initialNotifications = await notificationService.getActiveNotifications()
        if (!mounted) return
        setNotifications(initialNotifications)

        // Only set up subscription if dialog is open and we don't have an active channel
        if (open && !channelRef.current) {
          channelRef.current = await notificationService.subscribeToNotifications(
            user.id,
            (notification: AppNotification, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => {
              if (!mounted) return
              setNotifications((prev: AppNotification[]) => {
                switch (eventType) {
                  case 'INSERT':
                    // Add new notification
                    return [notification, ...prev]
                  
                  case 'UPDATE':
                    // If notification is archived, remove it
                    if (notification.status === 'archived') {
                      return prev.filter(n => n.id !== notification.id)
                    }
                    // Otherwise update the existing notification
                    return prev.map(n => n.id === notification.id ? notification : n)
                  
                  case 'DELETE':
                    // Remove the notification
                    return prev.filter(n => n.id !== notification.id)
                  
                  default:
                    return prev
                }
              })
            }
          )
        }
      } catch (error) {
        console.error('Error setting up notifications:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Only setup notifications when dialog is opened and we have a user
    if (user && open) {
      setupNotifications()
    } else {
      // Cleanup subscription if dialog is closed
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      setNotifications([])
      setLoading(false)
    }

    return () => {
      mounted = false
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [user?.id, open])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId)
      setNotifications((prev: AppNotification[]) =>
        prev.map((n: AppNotification) =>
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
      setNotifications((prev: AppNotification[]) => prev.filter((n: AppNotification) => n.id !== notificationId))
    } catch (error) {
      console.error('Error archiving notification:', error)
    }
  }

  const handleAction = (notification: AppNotification) => {
    if (notification.action_url) {
      router.push(notification.action_url)
      onOpenChange(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n: AppNotification) => n.status === 'unread')
      await Promise.all(
        unreadNotifications.map((n: AppNotification) => notificationService.markAsRead(n.id))
      )
      setNotifications((prev: AppNotification[]) =>
        prev.map((n: AppNotification) => ({
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
        notifications.map((n: AppNotification) => notificationService.archiveNotification(n.id))
      )
      setNotifications([])
    } catch (error) {
      console.error('Error archiving all notifications:', error)
    }
  }

  const hasUnread = notifications.some((n: AppNotification) => n.status === 'unread')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 bg-white dark:bg-gray-950">
        <DialogHeader className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 dark:bg-gray-950/80 p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Notifications</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  {notifications.length > 0 
                    ? `You have ${notifications.filter(n => n.status === 'unread').length} unread notifications`
                    : 'Stay updated with your latest notifications'
                  }
                </DialogDescription>
              </div>
            </div>
            {notifications.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-medium hover:bg-primary/10 hover:text-primary hover:border-primary transition-colors"
                  onClick={handleMarkAllAsRead}
                  disabled={!hasUnread}
                >
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Mark All Read
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-medium hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors"
                  onClick={handleArchiveAll}
                >
                  <Archive className="mr-1.5 h-3.5 w-3.5" />
                  Archive All
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-grow">
          <div className="divide-y divide-border">
            {!user ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <Bell className="h-8 w-8 text-primary" />
                </div>
                <p className="text-lg font-medium text-foreground">Please sign in to view notifications</p>
                <p className="text-sm text-muted-foreground mt-1">Sign in to stay updated with your latest notifications</p>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4 animate-pulse">
                  <Bell className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <p className="text-lg font-medium text-foreground">Loading notifications...</p>
                <p className="text-sm text-muted-foreground mt-1">Please wait while we fetch your notifications</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <Bell className="h-8 w-8 text-primary" />
                </div>
                <p className="text-lg font-medium text-foreground">All caught up!</p>
                <p className="text-sm text-muted-foreground mt-1">We'll notify you when something important happens</p>
              </div>
            ) : (
              notifications.map((notification: AppNotification) => (
                <NotificationCard
                  key={`${notification.id}-${notification.updated_at || notification.created_at}`}
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