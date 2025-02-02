"use client"

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { supabase, checkConnection, getPooledConnection } from "./client"
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

const INACTIVITY_TIMEOUT = 10 * 60 * 1000 // 10 minutes in milliseconds
const CONNECTION_CHECK_INTERVAL = 5000 // Check every 5 seconds
const MAX_CONNECTION_RETRIES = 3
const CONNECTION_RETRY_DELAY = 1000 // 1 second
const CONNECTION_TIMEOUT = 30000 // 30 seconds
const FILE_OPERATION_TIMEOUT = 60000 // 60 seconds for file operations

// Add operation types for different timeouts
type OperationType = 'default' | 'file' | 'query';

const getOperationTimeout = (type: OperationType = 'default'): number => {
  switch (type) {
    case 'file':
      return FILE_OPERATION_TIMEOUT;
    case 'query':
      return CONNECTION_TIMEOUT;
    default:
      return CONNECTION_TIMEOUT;
  }
};

// Add error types
type DatabaseError = {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

// Add connection state management
const useConnectionState = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [lastError, setLastError] = useState<DatabaseError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastConnectionTime, setLastConnectionTime] = useState<Date | null>(null);

  const withRetry = useCallback(async (operation: () => Promise<any>) => {
    let attempts = 0;
    const maxAttempts = 3;
    const backoff = 1000;

    while (attempts < maxAttempts) {
      try {
        const result = await operation();
        if (attempts > 0) {
          console.log(`Operation succeeded after ${attempts + 1} attempts`);
        }
        return result;
      } catch (error: any) {
        attempts++;
        console.log(`Attempt ${attempts} failed:`, {
          error: error?.message || 'Unknown error',
          code: error?.code,
          details: error?.details
        });
        
        if (attempts === maxAttempts) {
          throw error;
        }
        
        const delay = backoff * attempts;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, []);

  const checkDatabaseConnection = useCallback(async () => {
    try {
      // First check if we have the required configuration
      if (!supabase) {
        setIsConnected(false);
        throw new Error('Supabase client is not initialized');
      }

      const result = await withRetry(async () => {
        // Simple auth check first
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError) {
          throw new Error(`Auth check failed: ${authError.message}`);
        }

        // Then try a simple database query
        const { error: dbError } = await supabase
          .from('profiles')
          .select('count', { count: 'exact', head: true })
          .limit(1);

        if (dbError) {
          throw new Error(`Database check failed: ${dbError.message}`);
        }

        return true;
      });

      if (result) {
        setIsConnected(true);
        setLastError(null);
        setRetryCount(0);
        setLastConnectionTime(new Date());
        return true;
      }

      throw new Error('Connection check returned false');
    } catch (error: any) {
      console.error('Connection check failed:', {
        message: error?.message || 'Unknown error',
        code: error?.code,
        details: error?.details,
        stack: error?.stack
      });

      setIsConnected(false);
      setLastError({
        code: error?.code || 'CONNECTION_ERROR',
        message: error?.message || 'Connection check failed',
        details: error?.details || error?.stack
      });
      setRetryCount(prev => prev + 1);
      return false;
    }
  }, [withRetry]);

  return {
    isConnected,
    lastError,
    retryCount,
    lastConnectionTime,
    checkConnection: checkDatabaseConnection
  };
};

export function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [lastProfileRefresh, setLastProfileRefresh] = useState<number>(0)
  const router = useRouter()
  const connection = useConnectionState()

  // Add withRetry wrapper with better error handling
  const withRetry = useCallback(async <T,>(
    operation: () => Promise<T>,
    retries = MAX_CONNECTION_RETRIES,
    operationType: OperationType = 'default'
  ): Promise<T> => {
    let lastError: any;
    let operationName = operation.name || 'anonymous operation';
    const timeout = getOperationTimeout(operationType);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Check connection state first
        if (!connection.isConnected) {
          console.log('Connection is down, attempting to reconnect...');
          const isConnected = await connection.checkConnection();
          if (!isConnected) {
            throw new Error('Failed to establish database connection');
          }
        }

        // Execute operation with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, timeout);

        try {
          const result = await Promise.race([
            operation(),
            new Promise<never>((_, reject) => {
              controller.signal.addEventListener('abort', () => {
                reject(new Error(`Operation timed out after ${timeout}ms`));
              });
            })
          ]);

          clearTimeout(timeoutId);
          return result as T;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      } catch (error: any) {
        lastError = error;
        console.error(`Operation attempt ${attempt} failed:`, {
          attempt,
          operationName,
          timeout,
          error: error?.message || 'Unknown error',
          code: error?.code,
          details: error?.details,
          stack: error?.stack
        });

        if (attempt === retries) {
          break;
        }

        const delay = Math.min(
          CONNECTION_RETRY_DELAY * Math.pow(2, attempt - 1),
          10000 // Max 10 seconds delay
        );
        
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Operation failed after all retries');
  }, [connection]);

  // Add profile caching logic
  const PROFILE_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  const shouldRefreshProfile = useCallback(() => {
    if (!user) return false
    if (!profile) return true
    if (profile.id !== user.id) return true
    
    const timeSinceLastRefresh = Date.now() - lastProfileRefresh
    return timeSinceLastRefresh > PROFILE_CACHE_DURATION
  }, [user, profile, lastProfileRefresh])

  // Update refreshProfile with caching
  const refreshProfile = useCallback(async (force: boolean = false) => {
    if (!user) {
      console.log('No user found in refreshProfile, skipping profile refresh')
      setProfile(null)
      setIsProfileLoading(false)
      return
    }

    // Check if we should skip refresh
    if (!force && !shouldRefreshProfile()) {
      console.log('Profile is still fresh, skipping refresh')
      return
    }

    // If we're already loading the profile, don't start another load
    if (isProfileLoading) {
      console.log('Profile refresh already in progress, skipping')
      return
    }

    try {
      setIsProfileLoading(true)
      return await withRetry(async () => {
        console.log('Refreshing profile for user:', {
          userId: user.id,
          email: user.email,
          metadata: user.user_metadata
        })

        // First check if the profile exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle()

        if (fetchError) {
          console.error('Error fetching profile:', {
            error: fetchError,
            code: fetchError.code,
            message: fetchError.message,
            details: fetchError.details,
            hint: fetchError.hint
          })
          throw fetchError
        }

        if (existingProfile) {
          console.log('Found existing profile:', existingProfile)
          setProfile(existingProfile)
          setLastProfileRefresh(Date.now())
          return existingProfile
        }

        // If no profile exists, create one with user metadata
        console.log('No existing profile found, creating new profile...')
        const newProfile = {
          id: user.id,
          nickname: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url || null,
          updated_at: new Date().toISOString(),
          google_calendar_enabled: false,
          google_calendar_refresh_token: null,
          apple_calendar_enabled: false,
          notifications_enabled: true,
          reminder_time: 1440,
          created_at: new Date().toISOString(),
        }

        const { data: createdProfile, error: createError } = await supabase
          .from("profiles")
          .upsert([newProfile])
          .select()
          .single()

        if (createError) {
          throw createError
        }

        if (!createdProfile) {
          throw new Error('No profile data returned after creation')
        }

        console.log('Profile created successfully:', createdProfile)
        setProfile(createdProfile)
        setLastProfileRefresh(Date.now())
        return createdProfile
      }, MAX_CONNECTION_RETRIES, 'query')
    } catch (error: any) {
      console.error('Error in refreshProfile:', error)
      throw error
    } finally {
      setIsProfileLoading(false)
    }
  }, [user, withRetry, isProfileLoading, shouldRefreshProfile])

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error

        if (session?.user) {
          setUser(session.user)
          // Only refresh profile if we don't have it yet
          if (!profile) {
            await refreshProfile()
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          // Only refresh profile on sign in or user update
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            await refreshProfile()
          }
        } else {
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      console.log('Starting sign out process...')
      
      // Sign out from Supabase with retry logic
      const { error } = await withRetry(async () => 
        await supabase.auth.signOut()
      )
      
      if (error) {
        console.error('Error signing out:', error)
        throw error
      }

      // Clear local state after successful sign out
      setUser(null)
      setProfile(null)

      console.log('Successfully signed out, redirecting to home')
      await router.push('/')
    } catch (error) {
      console.error('Error in signOut:', error)
      // Even on error, clear state and redirect
      setUser(null)
      setProfile(null)
      await router.push('/')
    }
  }

  const value = useMemo(() => ({
    user,
    profile,
    signOut,
    refreshProfile: () => refreshProfile(true), // Always force refresh when called explicitly
    isLoading: isLoading || isProfileLoading,
    isProfileLoading,
    isInitialized,
  }), [user, profile, signOut, refreshProfile, isLoading, isProfileLoading, isInitialized])

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
} 