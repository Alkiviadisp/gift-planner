"use client"

import { useState, useCallback, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { useSupabase } from "@/lib/supabase/provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, Mail, User, Lock, Calendar, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { AvatarUpload } from "@/components/ui/avatar-upload"
import { PasswordChange } from "@/components/settings/password-change"
import { ProfileInfo } from "@/components/settings/profile-info"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const reminderOptions = [
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "1440", label: "1 day before" },
  { value: "10080", label: "1 week before" },
]

export default function AccountPage() {
  const { user, profile, refreshProfile, isLoading: isAuthLoading } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // If we have a user but no profile, try to refresh it
    if (user && !profile && !isAuthLoading) {
      refreshProfile()
    }
  }, [user, profile, isAuthLoading, refreshProfile])

  const handleAvatarUpdate = useCallback(async () => {
    await refreshProfile()
  }, [refreshProfile])

  // Show loading state while checking auth
  if (isAuthLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show sign in message if no user
  if (!user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Please sign in to view settings.</p>
      </div>
    )
  }

  // Show loading state while fetching profile
  if (!profile) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-10">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Account Settings</h2>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>{profile?.nickname?.[0]?.toUpperCase() || "?"}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold">{profile?.nickname}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:max-w-[400px]">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="grid gap-6 lg:grid-cols-2">
              <ProfileInfo isLoading={isLoading} onAvatarUpdate={handleAvatarUpdate} />
              <PasswordChange isLoading={isLoading} />
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Calendar Integration
                </CardTitle>
                <CardDescription>
                  Connect your calendar to sync gift reminders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="google-calendar">Google Calendar</Label>
                    <span className="text-sm text-muted-foreground">
                      Sync gift reminders with Google Calendar
                    </span>
                  </div>
                  <Switch
                    id="google-calendar"
                    checked={profile?.google_calendar_enabled}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="apple-calendar">Apple Calendar</Label>
                    <span className="text-sm text-muted-foreground">
                      Generate .ics files for Apple Calendar
                    </span>
                  </div>
                  <Switch
                    id="apple-calendar"
                    checked={profile?.apple_calendar_enabled}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure how and when you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="notifications-enabled">Enable Notifications</Label>
                    <span className="text-sm text-muted-foreground">
                      Receive notifications for upcoming gifts
                    </span>
                  </div>
                  <Switch
                    id="notifications-enabled"
                    checked={profile?.notifications_enabled}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminder-time">Default Reminder Time</Label>
                  <Select
                    disabled={!profile?.notifications_enabled || isLoading}
                    value={profile?.reminder_time?.toString() || "1440"}
                  >
                    <SelectTrigger id="reminder-time">
                      <SelectValue placeholder="Select when to be reminded" />
                    </SelectTrigger>
                    <SelectContent>
                      {reminderOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 