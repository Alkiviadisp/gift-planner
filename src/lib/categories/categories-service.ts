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
  async getCategories(userId: string, retryCount = 0): Promise<Category[]> {
    if (!userId) {
      throw new CategoryError('User ID is required to fetch categories', 'MISSING_USER_ID');
    }

    try {
      console.log('Fetching categories for user:', userId)
      
      // First check if the table exists
      const { error: tableCheckError } = await supabase
        .from("gift_categories")
        .select("count")
        .limit(1)

      if (tableCheckError) {
        console.error('Error checking gift_categories table:', tableCheckError)
        throw new CategoryError(
          'Database not properly initialized',
          'DB_NOT_INITIALIZED',
          tableCheckError
        );
      }
      
      // Now fetch the categories
      const response = await supabase
        .from("gift_categories")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      console.log('Raw response from Supabase:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        error: response.error,
      })

      if (response.error) {
        throw new CategoryError(
          response.error.message,
          response.error.code,
          response.error.details
        );
      }

      if (!response.data) {
        console.log('No categories found, returning empty array')
        return []
      }

      // Validate the data structure
      const isValidData = Array.isArray(response.data) && response.data.every(record => 
        typeof record === 'object' &&
        record !== null &&
        'id' in record &&
        'name' in record &&
        'created_at' in record
      )

      if (!isValidData) {
        console.error('Invalid data structure received:', response.data)
        throw new CategoryError(
          'Invalid data structure received from the server',
          'INVALID_DATA_STRUCTURE',
          response.data
        );
      }

      const mappedCategories = (response.data as CategoryRecord[]).map((record) => {
        try {
          if (!record.id || !record.name || !record.created_at) {
            throw new Error('Missing required fields in category record');
          }

          return {
            id: record.id,
            title: record.name,
            date: new Date(record.created_at),
            color: record.color || getRandomColor(),
          }
        } catch (err) {
          console.error('Error mapping category record:', {
            record,
            error: err
          })
          throw new CategoryError(
            'Failed to process category data',
            'DATA_MAPPING_ERROR',
            { record, error: err }
          );
        }
      })

      console.log(`Successfully mapped ${mappedCategories.length} categories:`, 
        mappedCategories.map(c => ({ id: c.id, title: c.title }))
      )
      
      return mappedCategories

    } catch (error: any) {
      // If it's already a CategoryError, just rethrow it
      if (error instanceof CategoryError) {
        throw error;
      }

      // Detailed error logging
      console.error("Error in getCategories:", {
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
          retryCount,
          timestamp: new Date().toISOString()
        }
      })

      // Implement retry logic for specific errors
      const shouldRetry = retryCount < MAX_RETRIES && (
        error.code === 'PGRST301' || // Unauthorized
        error.code === '40001' || // Serialization failure
        error.code === 'PGRST116' || // Resource not found
        error.message?.toLowerCase().includes('connection') ||
        error.message?.toLowerCase().includes('network') ||
        error.message?.toLowerCase().includes('timeout')
      );

      if (shouldRetry) {
        console.log(`Retrying getCategories (attempt ${retryCount + 1} of ${MAX_RETRIES})`)
        await wait(RETRY_DELAY * Math.pow(2, retryCount)) // Exponential backoff
        return this.getCategories(userId, retryCount + 1)
      }

      // Convert to CategoryError with appropriate message
      throw new CategoryError(
        error.message || 'Failed to fetch categories',
        error.code || 'UNKNOWN_ERROR',
        {
          originalError: error,
          details: error.details || error.message,
          hint: error.hint
        }
      );
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