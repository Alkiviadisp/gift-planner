"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Profile } from "@/types/database"
import { supabase } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface NotificationSettingsProps {
  profile: Profile
  onUpdate: (profile: Profile) => void
}

const REMINDER_OPTIONS = [
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "1440", label: "1 day before" },
  { value: "10080", label: "1 week before" },
] as const

export function NotificationSettings({ profile, onUpdate }: NotificationSettingsProps) {
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleNotificationToggle = async (enabled: boolean) => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          notifications_enabled: enabled,
        })
        .eq('id', profile.id)

      if (error) throw error

      toast({
        title: "Success",
        description: `Notifications ${enabled ? 'enabled' : 'disabled'} successfully.`,
      })

      onUpdate({
        ...profile,
        notifications_enabled: enabled,
      })
    } catch (error) {
      console.error('Error updating notification settings:', error)
      toast({
        title: "Error",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReminderTimeChange = async (minutes: string) => {
    setIsSaving(true)
    try {
      const reminderTime = parseInt(minutes)
      const { error } = await supabase
        .from('profiles')
        .update({
          reminder_time: reminderTime,
        })
        .eq('id', profile.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Reminder time updated successfully.",
      })

      onUpdate({
        ...profile,
        reminder_time: reminderTime,
      })
    } catch (error) {
      console.error('Error updating reminder time:', error)
      toast({
        title: "Error",
        description: "Failed to update reminder time. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Configure how and when you want to receive notifications about your gift events.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications about upcoming gift events
              </p>
            </div>
            <Switch
              checked={profile.notifications_enabled}
              onCheckedChange={handleNotificationToggle}
              disabled={isSaving}
            />
          </div>

          {profile.notifications_enabled && (
            <div className="space-y-2">
              <Label>Reminder Time</Label>
              <Select
                disabled={isSaving}
                value={String(profile.reminder_time ?? 60)}
                onValueChange={handleReminderTimeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reminder time" />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 