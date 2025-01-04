interface Window {
  gapi: {
    auth2: {
      getAuthInstance(): {
        signIn(options?: { scope: string }): Promise<{
          getAuthResponse(): {
            access_token: string
            refresh_token: string
            expires_at: number
          }
        }>
      }
    }
    client: {
      init(options: {
        apiKey: string
        clientId: string
        discoveryDocs: string[]
        scope: string
      }): Promise<void>
      calendar: {
        events: {
          insert(params: {
            calendarId: string
            resource: {
              summary: string
              description?: string
              start: { dateTime: string }
              end: { dateTime: string }
              location?: string
            }
          }): Promise<any>
        }
      }
    }
    load(api: string, callback: () => void): void
  }
} 