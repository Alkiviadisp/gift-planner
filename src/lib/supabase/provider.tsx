"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { supabase } from "./client"
import { Profile } from "@/types/database"

interface SupabaseContextType {
  user: User | null
  profile: Profile | null
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  isLoading: boolean
}

const SupabaseContext = createContext<SupabaseContextType>({
  user: null,
  profile: null,
  signOut: async () => {},
  refreshProfile: async () => {},
  isLoading: true
})

export function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const refreshProfile = useCallback(async (userId: string) => {
    try {
      console.log('Refreshing profile for user:', userId)

      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      console.log('Profile fetch result:', { existingProfile, fetchError })

      if (existingProfile) {
        setProfile(existingProfile)
        return
      }

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching profile:', fetchError)
        return
      }

      // Create profile if it doesn't exist
      console.log('Creating new profile for user:', userId)
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert([
          {
            id: userId,
            nickname: user?.email ? user.email.split('@')[0] : 'User',
            avatar_url: null,
            updated_at: new Date().toISOString(),
            google_calendar_enabled: false,
            google_calendar_refresh_token: null,
            apple_calendar_enabled: false,
            notifications_enabled: true,
            reminder_time: 1440
          }
        ])
        .select()
        .single()

      if (createError) {
        console.error('Error creating profile:', {
          message: createError.message,
          code: createError.code,
          details: createError.details,
          hint: createError.hint
        })
        throw createError
      }

      if (newProfile) {
        console.log('New profile created successfully:', newProfile)
        setProfile(newProfile)
      } else {
        console.error('No profile returned after creation')
        throw new Error('Failed to create profile: No data returned')
      }
    } catch (error: any) {
      console.error('Error in refreshProfile:', {
        name: error?.name || 'Unknown Error',
        message: error?.message || 'No error message available',
        code: error?.code || 'No error code available',
        details: error?.details || 'No error details available',
        hint: error?.hint || 'No error hint available',
        stack: error?.stack || 'No stack trace available'
      })
      throw error
    }
  }, [user?.email]) // Only depend on user email for nickname generation

  // Initialize auth state
  useEffect(() => {
    let mounted = true
    
    const initializeAuth = async () => {
      try {
        console.log('Starting initializeAuth...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', {
            message: error.message,
            status: error.status,
            name: error.name
          })
          throw error
        }
        
        console.log('Session check result:', {
          hasSession: !!session,
          userId: session?.user?.id || 'none',
          email: session?.user?.email || 'none'
        })
        
        if (session?.user && mounted) {
          console.log('Setting user:', {
            id: session.user.id,
            email: session.user.email
          })
          setUser(session.user)
          await refreshProfile(session.user.id)
        }
      } catch (error: any) {
        console.error('Error in initializeAuth:', {
          name: error?.name || 'Unknown Error',
          message: error?.message || 'No error message available',
          stack: error?.stack || 'No stack trace available'
        })
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'Has session' : 'No session')
        
        if (session?.user && mounted) {
          setUser(session.user)
          await refreshProfile(session.user.id)
        } else if (mounted) {
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // No dependencies needed

  const signOut = async () => {
    try {
      console.log('Starting sign out process...')
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Error during sign out:', error)
        throw error
      }

      console.log('Successfully signed out from Supabase')
      
      // Clear local state
      setUser(null)
      setProfile(null)
      
      // Navigate after state is cleared
      console.log('Navigating to home page...')
      router.push("/")
      router.refresh() // Force a refresh to ensure clean state
      
    } catch (error: any) {
      console.error('Error signing out:', {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        stack: error?.stack
      })
      
      // Force sign out on error
      setUser(null)
      setProfile(null)
      router.push("/")
      router.refresh()
    }
  }

  // Expose a wrapper function that uses the current user ID
  const wrappedRefreshProfile = useCallback(async () => {
    if (user?.id) {
      await refreshProfile(user.id)
    }
  }, [user?.id, refreshProfile])

  return (
    <SupabaseContext.Provider value={{ 
      user, 
      profile, 
      signOut, 
      refreshProfile: wrappedRefreshProfile, 
      isLoading 
    }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider")
  }
  return context
} 