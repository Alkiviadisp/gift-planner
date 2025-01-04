export interface Profile {
  id: string
  email: string
  full_name: string | null
  nickname: string | null
  avatar_url: string | null
  updated_at: string | null
  google_calendar_refresh_token: string | null
  google_calendar_access_token: string | null
  google_calendar_token_expiry: string | null
  apple_calendar_sync_enabled: boolean
  calendar_preferences: CalendarPreferences
}

export interface CalendarPreferences {
  defaultCalendar?: 'google' | 'apple'
  syncFrequency?: 'realtime' | 'hourly' | 'daily'
  notifications: {
    enabled: boolean
    beforeEvent: number // minutes
  }
} 