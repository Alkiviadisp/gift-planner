import { createClient } from '@supabase/supabase-js'

// Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Configure client with better defaults
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'gift-planner-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: { 'x-my-custom-header': 'gift-planner' }
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
})

// Add connection health check with detailed error logging
export const checkConnection = async () => {
  try {
    const startTime = Date.now()
    
    // First verify environment variables
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration')
    }

    // Check auth status
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError) {
      throw new Error(`Auth check failed: ${authError.message}`)
    }

    // Check database connection with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout')), 5000)
    })

    const dbCheckPromise = supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single()

    const { error: dbError } = await Promise.race([dbCheckPromise, timeoutPromise]) as any

    const endTime = Date.now()
    const responseTime = endTime - startTime

    if (dbError) {
      console.error('Database connection check failed:', {
        error: dbError,
        code: dbError.code || 'UNKNOWN',
        message: dbError.message || 'Unknown error',
        details: dbError.details || 'No details available',
        hint: dbError.hint,
        responseTime: `${responseTime}ms`
      })
      return false
    }

    // Log successful connection
    console.log('Database connection successful', {
      responseTime: `${responseTime}ms`,
      url: supabaseUrl.split('@')[1] // Log only the domain for security
    })

    return true
  } catch (error: any) {
    console.error('Unexpected error during connection check:', {
      error: error.message || error,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
    return false
  }
}

// Add connection pooling helper with better error handling
export const getPooledConnection = async () => {
  let retries = 3
  let lastError = null

  while (retries > 0) {
    try {
      console.log(`Connection attempt ${4 - retries}/3`)
      const isConnected = await checkConnection()
      
      if (isConnected) {
        console.log('Successfully established database connection')
        return supabase
      }

      console.log(`Connection attempt failed, ${retries - 1} retries remaining`)
      retries--

      if (retries > 0) {
        const delay = (4 - retries) * 1000 // Increasing delay with each retry
        console.log(`Waiting ${delay}ms before next attempt...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    } catch (error: any) {
      lastError = error
      console.error('Error getting pooled connection:', {
        error,
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        attempt: 4 - retries
      })
      retries--
      
      if (retries === 0) {
        throw new Error(`Failed to establish database connection: ${error.message}`)
      }
    }
  }

  throw new Error(lastError ? 
    `Failed to establish database connection: ${lastError.message}` : 
    'Failed to establish database connection after multiple attempts'
  )
}

// Add a helper to check if we have a valid session
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}; 