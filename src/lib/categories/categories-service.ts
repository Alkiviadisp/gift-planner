import { supabase } from "@/lib/supabase/client"

// Pastel colors palette
export const PASTEL_COLORS = [
  "#FFE5E5", // Soft Pink
  "#E5F3FF", // Soft Blue
  "#E5FFE5", // Soft Green
  "#FFF3E5", // Soft Orange
  "#F3E5FF", // Soft Purple
  "#E5FFF3", // Soft Mint
  "#FFE5F3", // Soft Rose
  "#F3FFE5", // Soft Lime
  "#E5E5FF", // Soft Lavender
  "#FFE5E8", // Soft Coral
] as string[]

const getRandomColor = (): string => {
  const randomIndex = Math.floor(Math.random() * PASTEL_COLORS.length)
  return PASTEL_COLORS[randomIndex]!
}

export interface Category {
  id: string
  title: string
  date: Date
  color: string
}

export interface CategoryRecord {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string | null
  created_at: string
  updated_at: string
}

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export class CategoryError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'CategoryError';
  }
}

export const categoriesService = {
  async verifyAccess(userId: string): Promise<boolean> {
    try {
      console.log('Verifying access for user:', userId);
      
      // First check if the user has access to their profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('Profile access check failed:', {
          error: profileError,
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          userId
        })
        return false
      }

      // Then check if they can access gift categories
      const { data: categoryData, error: categoryError } = await supabase
        .from('gift_categories')
        .select('count')
        .eq('user_id', userId)
        .limit(1)

      if (categoryError) {
        console.error('Category access check failed:', {
          error: categoryError,
          code: categoryError.code,
          message: categoryError.message,
          details: categoryError.details,
          userId
        })
        return false
      }

      console.log('Access verification successful for user:', userId);
      return true
    } catch (error: any) {
      console.error('Access verification failed:', {
        error: error?.message || error,
        code: error?.code,
        details: error?.details,
        stack: error?.stack,
        userId
      })
      return false
    }
  },

  async getCategories(userId: string): Promise<Category[]> {
    if (!userId) {
      throw new CategoryError('User ID is required to fetch categories', 'MISSING_USER_ID');
    }

    try {
      console.log('Starting getCategories for user:', userId);

      // First verify access
      const hasAccess = await this.verifyAccess(userId)
      if (!hasAccess) {
        console.error('Access denied for user:', userId);
        throw new CategoryError(
          'Access denied. Please sign in again.',
          'ACCESS_DENIED'
        )
      }

      // First check if the table exists and we can access it
      const { error: tableCheckError } = await supabase
        .from("gift_categories")
        .select("count")
        .limit(1)

      if (tableCheckError) {
        console.error('Error checking gift_categories table:', {
          error: tableCheckError,
          code: tableCheckError.code,
          message: tableCheckError.message,
          details: tableCheckError.details,
          userId
        })
        throw new CategoryError(
          'Database not properly initialized',
          'DB_NOT_INITIALIZED',
          tableCheckError
        );
      }

      console.log('Table check passed, fetching categories...');
      
      // Now fetch the categories
      const { data, error } = await supabase
        .from("gift_categories")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error('Error fetching categories:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          userId
        })
        throw new CategoryError(
          error.message,
          error.code,
          error.details
        );
      }

      if (!data) {
        console.log('No categories found for user:', userId);
        return []
      }

      console.log('Successfully fetched categories:', {
        count: data.length,
        userId
      });

      return data.map((record: CategoryRecord) => ({
        id: record.id,
        title: record.name,
        date: new Date(record.created_at),
        color: record.color || getRandomColor(),
      }))
    } catch (error: any) {
      console.error('Error in getCategories:', {
        error: error?.message || error,
        code: error?.code,
        details: error?.details,
        stack: error?.stack,
        userId
      })
      throw error
    }
  },

  async createCategory(userId: string, category: { title: string; date: Date }, retryCount = 0): Promise<Category> {
    if (!userId) {
      throw new CategoryError('User ID is required to create a category', 'MISSING_USER_ID');
    }

    const color = getRandomColor()
    
    try {
      const response = await supabase
        .from("gift_categories")
        .insert([
          {
            user_id: userId,
            name: category.title,
            description: `Occasion date: ${category.date.toISOString().split("T")[0]}`,
            created_at: category.date.toISOString(),
            color,
          },
        ])
        .select()
        .single()

      if (response.error) {
        throw new CategoryError(
          response.error.message,
          response.error.code,
          response.error.details
        );
      }

      if (!response.data) {
        throw new CategoryError(
          'No data returned after category creation',
          'NO_DATA_RETURNED'
        );
      }

      return {
        id: response.data.id,
        title: response.data.name,
        date: new Date(response.data.created_at),
        color: response.data.color!,
      }

    } catch (error: any) {
      // If it's already a CategoryError, just rethrow it
      if (error instanceof CategoryError) {
        throw error;
      }

      console.error("Error in createCategory:", {
        error: {
          name: error?.name,
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          stack: error?.stack
        },
        context: {
          userId,
          category,
          retryCount,
          timestamp: new Date().toISOString()
        }
      })

      // Implement retry logic for specific errors
      const shouldRetry = retryCount < MAX_RETRIES && (
        error.code === 'PGRST301' || // Unauthorized
        error.code === '40001' || // Serialization failure
        error.message?.toLowerCase().includes('connection')
      );

      if (shouldRetry) {
        console.log(`Retrying createCategory (attempt ${retryCount + 1} of ${MAX_RETRIES})`)
        await wait(RETRY_DELAY * Math.pow(2, retryCount)) // Exponential backoff
        return this.createCategory(userId, category, retryCount + 1)
      }

      // Convert to CategoryError with appropriate message
      throw new CategoryError(
        error.message || 'Failed to create category',
        error.code,
        {
          originalError: error,
          details: error.details,
          hint: error.hint
        }
      );
    }
  },

  async deleteCategory(userId: string, categoryId: string, retryCount = 0): Promise<void> {
    if (!userId || !categoryId) {
      throw new CategoryError(
        'User ID and category ID are required to delete a category',
        'MISSING_PARAMETERS'
      );
    }

    try {
      const response = await supabase
        .from("gift_categories")
        .delete()
        .eq("user_id", userId)
        .eq("id", categoryId)

      if (response.error) {
        throw new CategoryError(
          response.error.message,
          response.error.code,
          response.error.details
        );
      }

    } catch (error: any) {
      // If it's already a CategoryError, just rethrow it
      if (error instanceof CategoryError) {
        throw error;
      }

      console.error("Error in deleteCategory:", {
        error: {
          name: error?.name,
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          stack: error?.stack
        },
        context: {
          userId,
          categoryId,
          retryCount,
          timestamp: new Date().toISOString()
        }
      })

      // Implement retry logic for specific errors
      const shouldRetry = retryCount < MAX_RETRIES && (
        error.code === 'PGRST301' || // Unauthorized
        error.code === '40001' || // Serialization failure
        error.message?.toLowerCase().includes('connection')
      );

      if (shouldRetry) {
        console.log(`Retrying deleteCategory (attempt ${retryCount + 1} of ${MAX_RETRIES})`)
        await wait(RETRY_DELAY * Math.pow(2, retryCount)) // Exponential backoff
        return this.deleteCategory(userId, categoryId, retryCount + 1)
      }

      // Convert to CategoryError with appropriate message
      throw new CategoryError(
        error.message || 'Failed to delete category',
        error.code,
        {
          originalError: error,
          details: error.details,
          hint: error.hint
        }
      );
    }
  },
} 