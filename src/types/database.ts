export interface Profile {
  id: string
  nickname: string | null
  avatar_url: string | null
  updated_at: string | null
  google_calendar_enabled: boolean
  google_calendar_refresh_token: string | null
  apple_calendar_enabled: boolean
  notifications_enabled: boolean
  reminder_time: number | null
}

export interface CalendarPreferences {
  defaultCalendar?: 'google' | 'apple'
  syncFrequency?: 'realtime' | 'hourly' | 'daily'
  notifications: {
    enabled: boolean
    beforeEvent: number // minutes
  }
} 