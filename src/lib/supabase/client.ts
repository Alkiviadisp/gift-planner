import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// More detailed logging of environment variables
console.log('Supabase Configuration:', {
  url: {
    exists: !!supabaseUrl,
    valid: supabaseUrl?.startsWith('https://'),
    length: supabaseUrl?.length || 0,
  },
  anonKey: {
    exists: !!supabaseAnonKey,
    length: supabaseAnonKey?.length || 0,
  }
})

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

if (!supabaseUrl.startsWith('https://')) {
  throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL format: Must start with https://')
}

// Create the Supabase client with additional options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'gift-planner-auth',
    flowType: 'pkce',
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'gift-planner'
    }
  }
})

// Test the connection
const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...')
    
    // Test auth configuration
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    console.log('Auth configuration test:', {
      success: !authError,
      hasSession: !!session,
      error: authError ? {
        message: authError.message,
        name: authError.name,
        status: authError.status
      } : null
    })

    if (authError) {
      throw new Error(`Auth configuration error: ${authError.message}`)
    }

    // Test database access with better error handling
    const { data, error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single()

    console.log('Database connection test:', {
      success: !dbError,
      data: data,
      error: dbError ? {
        message: dbError.message,
        code: dbError.code,
        details: dbError.details,
        hint: dbError.hint
      } : null
    })

    if (dbError) {
      if (dbError.code === 'PGRST301') {
        throw new Error('Database access error: Invalid API key or unauthorized access')
      } else if (dbError.code === 'PGRST204') {
        throw new Error('Database access error: Schema validation failed')
      } else {
        throw new Error(`Database access error: ${dbError.message}`)
      }
    }

    return true
  } catch (err: any) {
    console.error('Supabase connection test failed:', {
      name: err?.name || 'Unknown Error',
      message: err?.message || 'No message available',
      stack: err?.stack || 'No stack trace available',
      code: err?.code || 'No error code available'
    })
    return false
  }
}

// Run the connection test and handle the result
testConnection().then((success) => {
  if (!success) {
    console.error('Failed to establish Supabase connection. Please check your configuration.')
  } else {
    console.log('Supabase connection established successfully!')
  }
}) 