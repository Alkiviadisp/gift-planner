import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export type AppNotification = {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  status: 'unread' | 'read' | 'archived'
  priority: 'low' | 'normal' | 'high'
  category: string | null
  requires_action: boolean
  action_url: string | null
  action_text: string | null
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string | null
  read_at: string | null
  archived_at: string | null
}

class NotificationService {
  private async getCurrentUser() {
    const supabase = createClientComponentClient()
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        if (error.message === 'Auth session missing!') {
          return null
        }
        throw error
      }
      return user
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  async getActiveNotifications(limit = 50, offset = 0): Promise<AppNotification[]> {
    const supabase = createClientComponentClient()
    const user = await this.getCurrentUser()
    if (!user) {
      console.log('No authenticated user found')
      return []
    }

    console.log('Fetching notifications for user:', user.id)
    const { data, error } = await supabase
      .from('mailbox_notifications')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'archived')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching notifications:', error)
      throw error
    }

    console.log('Fetched notifications:', data)
    return data as AppNotification[]
  }

  async getUnreadCount(): Promise<number> {
    const supabase = createClientComponentClient()
    const user = await this.getCurrentUser()
    if (!user) {
      console.log('No authenticated user found')
      return 0
    }

    const { data, error } = await supabase
      .rpc('get_unread_notification_count', {
        p_user_id: user.id
      })

    if (error) {
      console.error('Error fetching unread count:', error)
      throw error
    }

    return data as number
  }

  async markAsRead(notificationId: string): Promise<void> {
    const supabase = createClientComponentClient()
    const user = await this.getCurrentUser()
    if (!user) {
      console.log('No authenticated user found')
      return
    }

    const { error } = await supabase
      .rpc('mark_notification_read', {
        p_notification_id: notificationId
      })

    if (error) {
      console.error('Error marking as read:', error)
      throw error
    }
  }

  async archiveNotification(notificationId: string): Promise<void> {
    const supabase = createClientComponentClient()
    const user = await this.getCurrentUser()
    if (!user) {
      console.log('No authenticated user found')
      return
    }

    const { error } = await supabase
      .rpc('archive_notification', {
        p_notification_id: notificationId
      })

    if (error) {
      console.error('Error archiving notification:', error)
      throw error
    }
  }

  async subscribeToNotifications(
    userId: string,
    onNotification: (notification: AppNotification) => void
  ) {
    const supabase = createClientComponentClient()
    console.log('Setting up notification subscription for user:', userId)
    
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mailbox_notifications',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          console.log('Received realtime notification payload:', payload)
          const notification = payload.new as AppNotification
          onNotification(notification)
        }
      )
      .subscribe((status) => {
        console.log('Notification subscription status:', status)
      })

    return channel
  }
}

// Export a singleton instance
export const notificationService = new NotificationService() 