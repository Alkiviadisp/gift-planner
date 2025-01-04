"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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

export function NotificationSettings({ profile, onUpdate }: NotificationSettingsProps) {
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleNotificationToggle = async (enabled: boolean) => {
    setIsSaving(true)
    try {
      const updatedPreferences = {
        ...profile.calendar_preferences,
        notifications: {
          ...profile.calendar_preferences?.notifications,
          enabled,
        },
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          calendar_preferences: updatedPreferences,
        })
        .eq('id', profile.id)

      if (error) throw error

      toast({
        title: "Success",
        description: `Notifications ${enabled ? 'enabled' : 'disabled'} successfully.`,
      })

      onUpdate({
        ...profile,
        calendar_preferences: updatedPreferences,
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
      const updatedPreferences = {
        ...profile.calendar_preferences,
        notifications: {
          ...profile.calendar_preferences?.notifications,
          beforeEvent: parseInt(minutes),
        },
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          calendar_preferences: updatedPreferences,
        })
        .eq('id', profile.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Reminder time updated successfully.",
      })

      onUpdate({
        ...profile,
        calendar_preferences: updatedPreferences,
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
          <CardTitle>Calendar Notifications</CardTitle>
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
              checked={profile.calendar_preferences?.notifications?.enabled ?? false}
              onCheckedChange={handleNotificationToggle}
              disabled={isSaving}
            />
          </div>

          {profile.calendar_preferences?.notifications?.enabled && (
            <div className="space-y-2">
              <Label>Reminder Time</Label>
              <Select
                disabled={isSaving}
                value={String(profile.calendar_preferences?.notifications?.beforeEvent ?? 60)}
                onValueChange={handleReminderTimeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reminder time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes before</SelectItem>
                  <SelectItem value="30">30 minutes before</SelectItem>
                  <SelectItem value="60">1 hour before</SelectItem>
                  <SelectItem value="1440">1 day before</SelectItem>
                  <SelectItem value="10080">1 week before</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 