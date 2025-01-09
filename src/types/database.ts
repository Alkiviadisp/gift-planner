export type Profile = {
  id: string
  nickname: string
  avatar_url: string | null
  updated_at: string
  google_calendar_enabled: boolean
  google_calendar_refresh_token: string | null
  apple_calendar_enabled: boolean
  notifications_enabled: boolean
  reminder_time: number
  created_at: string
  subscription_tier: 'free' | 'pro' | 'admin'
  subscription_start_date: string
  subscription_end_date: string | null
}

export interface CalendarPreferences {
  defaultCalendar?: 'google' | 'apple'
  syncFrequency?: 'realtime' | 'hourly' | 'daily'
  notifications: {
    enabled: boolean
    beforeEvent: number // minutes
  }
} 