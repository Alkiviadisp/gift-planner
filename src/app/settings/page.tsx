"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarSettings } from "@/components/settings/calendar-settings"
import { ProfileSettings } from "@/components/settings/profile-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { useToast } from "@/components/ui/use-toast"
import { Profile } from "@/types/database"
import { supabase } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error

        setProfile(profile)
      } catch (error) {
        console.error('Error loading profile:', error)
        toast({
          title: "Error",
          description: "Failed to load profile settings. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [toast])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Please sign in to view settings.</p>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl py-10">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <ProfileSettings
              profile={profile}
              onUpdate={(updatedProfile) => setProfile(updatedProfile)}
            />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <CalendarSettings
              profile={profile}
              onUpdate={(updatedProfile) => setProfile(updatedProfile)}
            />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationSettings
              profile={profile}
              onUpdate={(updatedProfile) => setProfile(updatedProfile)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 