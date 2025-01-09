"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/provider"
import { Megaphone } from "lucide-react"

type NotificationType = 'info' | 'success' | 'warning' | 'error'
type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export function AdminNotificationForm() {
  const { user, profile } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isBroadcast, setIsBroadcast] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info" as NotificationType,
    priority: "normal" as NotificationPriority,
    category: "system",
    requires_action: false,
    action_url: "",
    action_text: "",
  })

  // Only show if user is admin
  if (!profile?.subscription_tier || profile.subscription_tier !== 'admin') {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { supabase } = await import('@/lib/supabase/client')

      if (isBroadcast) {
        // Send to all users
        const { data, error } = await supabase.rpc('send_broadcast_notification', {
          p_admin_id: user?.id,
          p_title: formData.title,
          p_message: formData.message,
          p_type: formData.type,
          p_priority: formData.priority,
          p_category: formData.category,
          p_requires_action: formData.requires_action,
          p_action_url: formData.action_url || null,
          p_action_text: formData.action_text || null,
          p_metadata: {
            sent_by_admin: user?.id,
            sent_at: new Date().toISOString(),
          }
        })

        if (error) throw error
      } else {
        // Send to specific user
        if (!recipientEmail) {
          throw new Error('Recipient email is required for individual notifications')
        }

        // Send notification using the helper function
        const { error } = await supabase.rpc('send_user_notification', {
          admin_user_id: user?.id,
          recipient_email: recipientEmail,
          p_title: formData.title,
          p_message: formData.message,
          p_type: formData.type,
          p_priority: formData.priority,
          p_category: formData.category,
          p_requires_action: formData.requires_action,
          p_action_url: formData.action_url || null,
          p_action_text: formData.action_text || null,
          p_metadata: {
            sent_by_admin: user?.id,
            sent_at: new Date().toISOString(),
          }
        })

        if (error) {
          console.error('Notification error:', error);
          throw error;
        }

        // Debug: Check if notification was created
        const { data: debugData, error: debugError } = await supabase.rpc(
          'debug_last_notification',
          { p_recipient_email: recipientEmail }
        )
        
        if (debugError) {
          console.error('Debug error:', debugError)
        } else {
          console.log('Debug notification data:', debugData)
          
          // Additional debug: Try to fetch notifications directly
          const { data: notifications, error: fetchError } = await supabase
            .from('mailbox_notifications')
            .select('*')
            .eq('user_id', debugData[0].notification_user_id)
            .order('created_at', { ascending: false })
            .limit(5)
          
          if (fetchError) {
            console.error('Debug fetch error:', fetchError)
          } else {
            console.log('Recent notifications for user:', notifications)
            
            // Check RLS access
            const { data: accessData, error: accessError } = await supabase.rpc(
              'debug_notification_access',
              { p_user_id: debugData[0].notification_user_id }
            )
            
            if (accessError) {
              console.error('Access debug error:', accessError)
            } else {
              console.log('Access debug data:', accessData)
            }
          }
        }
      }

      toast({
        title: "Notification sent",
        description: isBroadcast ? "Broadcast message sent to all users" : "Message sent to user",
      })

      // Reset form
      setFormData({
        title: "",
        message: "",
        type: "info",
        priority: "normal",
        category: "system",
        requires_action: false,
        action_url: "",
        action_text: "",
      })
      setRecipientEmail("")
    } catch (error: any) {
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        status: error?.status
      })
      toast({
        title: "Error",
        description: error?.message || error?.details || "Failed to send notification. Check console for details.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Send Admin Notification</h2>
        <p className="text-sm text-muted-foreground">
          Send notifications to specific users or broadcast to everyone
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="broadcast"
            checked={isBroadcast}
            onCheckedChange={setIsBroadcast}
          />
          <Label htmlFor="broadcast">Broadcast to all users</Label>
        </div>

        {!isBroadcast && (
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Email</Label>
            <Input
              id="recipient"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="user@example.com"
              required={!isBroadcast}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Notification title"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Notification message"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: NotificationType) => 
                setFormData(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: NotificationPriority) => 
                setFormData(prev => ({ ...prev, priority: value }))
              }
            >
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="requires-action"
            checked={formData.requires_action}
            onCheckedChange={(checked) => 
              setFormData(prev => ({ ...prev, requires_action: checked }))
            }
          />
          <Label htmlFor="requires-action">Requires Action</Label>
        </div>

        {formData.requires_action && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="action-url">Action URL</Label>
              <Input
                id="action-url"
                value={formData.action_url}
                onChange={(e) => setFormData(prev => ({ ...prev, action_url: e.target.value }))}
                placeholder="https://example.com/action"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="action-text">Action Text</Label>
              <Input
                id="action-text"
                value={formData.action_text}
                onChange={(e) => setFormData(prev => ({ ...prev, action_text: e.target.value }))}
                placeholder="Click here to take action"
              />
            </div>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send Notification"}
        </Button>
      </form>
    </div>
  )
} 