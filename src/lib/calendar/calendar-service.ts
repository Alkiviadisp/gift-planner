import { createEvent } from 'ics'

interface CalendarEvent {
  title: string
  description?: string
  startTime: Date
  endTime: Date
  location?: string
}

export class CalendarService {
  // Google Calendar Integration
  async addToGoogleCalendar(event: CalendarEvent) {
    try {
      const { gapi } = window
      if (!gapi) throw new Error('Google API not loaded')

      await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: {
          summary: event.title,
          description: event.description,
          start: {
            dateTime: event.startTime.toISOString(),
          },
          end: {
            dateTime: event.endTime.toISOString(),
          },
          location: event.location,
        },
      })

      return true
    } catch (error) {
      console.error('Failed to add event to Google Calendar:', error)
      return false
    }
  }

  // Apple Calendar Integration via .ics file
  async addToAppleCalendar(event: CalendarEvent) {
    try {
      // Create an .ics file that can be opened by Apple Calendar
      const { error, value } = createEvent({
        title: event.title,
        description: event.description,
        start: this.dateToArray(event.startTime),
        end: this.dateToArray(event.endTime),
        location: event.location,
      })

      if (error) throw error

      // Create and download the .ics file
      const blob = new Blob([value!], { type: 'text/calendar' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${event.title}.ics`)
      document.body.appendChild(link)
      link.click()
      link.remove()

      return true
    } catch (error) {
      console.error('Failed to create Apple Calendar event:', error)
      return false
    }
  }

  // Helper function to convert Date to array format required by ics
  private dateToArray(date: Date): [number, number, number, number, number] {
    return [
      date.getFullYear(),
      date.getMonth() + 1, // Months are 0-indexed in JS
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
    ]
  }

  // Initialize Google Calendar API
  async initGoogleCalendar() {
    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    
    return new Promise<void>((resolve, reject) => {
      script.onload = () => {
        window.gapi.load('client:auth2', () => {
          window.gapi.client
            .init({
              apiKey: process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY,
              clientId: process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID,
              discoveryDocs: [
                'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
              ],
              scope: 'https://www.googleapis.com/auth/calendar.events',
            })
            .then(resolve)
            .catch(reject)
        })
      }
      script.onerror = reject
      document.body.appendChild(script)
    })
  }
} 