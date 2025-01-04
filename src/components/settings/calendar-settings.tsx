"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Profile } from "@/types/database"
import { supabase } from "@/lib/supabase/client"

interface CalendarSettingsProps {
  profile: Profile
  onUpdate: (profile: Profile) => void
}

export function CalendarSettings({ profile, onUpdate }: CalendarSettingsProps) {
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false)
  const [isTogglingApple, setIsTogglingApple] = useState(false)
  const { toast } = useToast()

  // Initialize Google API
  useEffect(() => {
    const initGoogleApi = async () => {
      try {
        await new Promise((resolve, reject) => {
          window.gapi.load('client:auth2', () => {
            window.gapi.client
              .init({
                apiKey: process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY,
                clientId: process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
                scope: 'https://www.googleapis.com/auth/calendar.events',
              })
              .then(resolve)
              .catch(reject)
          })
        })
      } catch (error) {
        console.error('Failed to initialize Google API:', error)
        toast({
          title: "Error",
          description: "Failed to initialize Google Calendar API. Please try again.",
          variant: "destructive",
        })
      }
    }

    if (window.gapi) {
      initGoogleApi()
    } else {
      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.onload = () => initGoogleApi()
      document.body.appendChild(script)
    }
  }, [toast])

  // Handle Google Calendar connection
  const handleConnectGoogle = async () => {
    if (!window.gapi?.auth2) {
      toast({
        title: "Error",
        description: "Google Calendar API is not initialized. Please try again.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsConnectingGoogle(true)
      
      // Initialize Google Sign-in
      const auth2 = await window.gapi.auth2.getAuthInstance()
      const googleUser = await auth2.signIn({
        scope: 'https://www.googleapis.com/auth/calendar.events'
      })

      // Get the OAuth tokens
      const authResponse = googleUser.getAuthResponse()
      
      // Update the profile with the new tokens
      const { error } = await supabase
        .from('profiles')
        .update({
          google_calendar_refresh_token: authResponse.refresh_token,
          google_calendar_access_token: authResponse.access_token,
          google_calendar_token_expiry: new Date(authResponse.expires_at).toISOString(),
          google_calendar_enabled: true
        })
        .eq('id', profile.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Google Calendar connected successfully!",
      })

      // Update the local profile state
      onUpdate({
        ...profile,
        google_calendar_refresh_token: authResponse.refresh_token,
        google_calendar_access_token: authResponse.access_token,
        google_calendar_token_expiry: new Date(authResponse.expires_at).toISOString(),
        google_calendar_enabled: true
      })
    } catch (error) {
      console.error('Failed to connect Google Calendar:', error)
      toast({
        title: "Error",
        description: "Failed to connect Google Calendar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsConnectingGoogle(false)
    }
  }

  // Handle Apple Calendar toggle
  const handleAppleToggle = async (enabled: boolean) => {
    try {
      setIsTogglingApple(true)
      const { error } = await supabase
        .from('profiles')
        .update({
          apple_calendar_enabled: enabled
        })
        .eq('id', profile.id)

      if (error) throw error

      toast({
        title: "Success",
        description: enabled 
          ? "Apple Calendar sync enabled. Your events will now sync with your system calendar."
          : "Apple Calendar sync disabled.",
      })

      // Update the local profile state
      onUpdate({
        ...profile,
        apple_calendar_enabled: enabled
      })
    } catch (error) {
      console.error('Failed to toggle Apple Calendar:', error)
      toast({
        title: "Error",
        description: "Failed to update Apple Calendar settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsTogglingApple(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Google Calendar</CardTitle>
          <CardDescription>
            Connect your Google Calendar to sync events automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile.google_calendar_enabled ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Connected</p>
                <p className="text-sm text-muted-foreground">
                  Your events will sync automatically
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => handleConnectGoogle()}
                disabled={isConnectingGoogle}
              >
                {isConnectingGoogle ? "Reconnecting..." : "Reconnect"}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => handleConnectGoogle()}
              disabled={isConnectingGoogle}
            >
              {isConnectingGoogle ? "Connecting..." : "Connect Google Calendar"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Apple Calendar</CardTitle>
          <CardDescription>
            Enable syncing with your system&apos;s calendar app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sync with Apple Calendar</p>
              <p className="text-sm text-muted-foreground">
                Events will be added to your system calendar
              </p>
            </div>
            <Switch
              checked={profile.apple_calendar_enabled}
              onCheckedChange={handleAppleToggle}
              disabled={isTogglingApple}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 