"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { CreateCategoryDialog } from "@/components/categories/create-category-dialog"
import { CategoryCard } from "@/components/categories/category-card"
import { useSupabase } from "@/lib/supabase/provider"
import { categoriesService, Category, CategoryError } from "@/lib/categories/categories-service"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isLoading: isAuthLoading, profile } = useSupabase()
  const { toast } = useToast()
  const [hasLoadedInitially, setHasLoadedInitially] = useState(false)

  useEffect(() => {
    const loadCategoriesIfNeeded = async () => {
      // Only load categories if:
      // 1. We haven't loaded them yet
      // 2. Auth check is complete
      // 3. User is logged in
      // 4. Profile is loaded
      if (!hasLoadedInitially && !isAuthLoading && user && profile) {
        await loadCategories()
        setHasLoadedInitially(true)
      }
    }
    
    loadCategoriesIfNeeded()
  }, [user, isAuthLoading, hasLoadedInitially, profile])

  const loadCategories = async () => {
    if (!user?.id) {
      console.log('No user ID available, skipping category load')
      return
    }

    console.log('Starting to load categories for user:', {
      userId: user.id,
      hasProfile: !!profile,
      isAuthLoading
    })

    setIsLoading(true)
    setError(null)

    let retryCount = 0
    const maxRetries = 3
    const initialTimeout = 10000 // 10 seconds

    const attemptLoad = async (timeout: number): Promise<Category[]> => {
      try {
        console.log(`Attempting to load categories (attempt ${retryCount + 1}/${maxRetries + 1}, timeout: ${timeout}ms)`)
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new CategoryError('Request timed out', 'TIMEOUT')), timeout)
        })

        const categoriesPromise = categoriesService.getCategories(user.id)
        return await Promise.race([categoriesPromise, timeoutPromise]) as Category[]
      } catch (error) {
        if (error instanceof CategoryError && error.code === 'TIMEOUT' && retryCount < maxRetries) {
          retryCount++
          console.log(`Timeout occurred, retrying with longer timeout (${timeout * 1.5}ms)`)
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000))
          return attemptLoad(timeout * 1.5)
        }
        throw error
      }
    }

    try {
      const data = await attemptLoad(initialTimeout)

      console.log('Categories loaded successfully:', {
        count: data.length,
        categories: data.map(c => ({ id: c.id, title: c.title }))
      })

      setCategories(data)
    } catch (error: any) {
      console.error("Error loading categories:", {
        error: {
          name: error?.name,
          message: error?.message,
          code: error?.code,
          details: error?.details,
          stack: error?.stack
        },
        context: {
          userId: user.id,
          retryCount,
          timestamp: new Date().toISOString()
        }
      })

      // Set user-friendly error message based on error type
      let errorMessage = "Failed to load categories. Please try again."
      let shouldRefresh = false
      
      if (error instanceof CategoryError) {
        switch (error.code) {
          case 'DB_NOT_INITIALIZED':
            errorMessage = "The database is not properly initialized. Please contact support."
            break;
          case 'TIMEOUT':
            errorMessage = "The connection is taking longer than expected. Please check your connection and try again."
            break;
          case 'MISSING_USER_ID':
            errorMessage = "Authentication error. Please sign in again."
            shouldRefresh = true
            break;
          case 'PGRST301':
            errorMessage = "Session expired. Please sign in again."
            shouldRefresh = true
            break;
          case 'INVALID_DATA_STRUCTURE':
            errorMessage = "Server returned invalid data. Please try again."
            break;
          case 'DATA_MAPPING_ERROR':
            errorMessage = "Error processing data. Please try again."
            break;
          case 'UNKNOWN_ERROR':
            errorMessage = error.message || "An unknown error occurred. Please try again."
            break;
          default:
            if (error.message) {
              errorMessage = error.message
            }
        }
      } else if (error.message?.toLowerCase().includes('network')) {
        errorMessage = "Network error. Please check your connection."
      }

      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })

      if (shouldRefresh) {
        // Wait a bit before refreshing to show the error message
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCategory = async (category: Omit<Category, "id">) => {
    if (!user) return

    try {
      const newCategory = await categoriesService.createCategory(user.id, {
        title: category.title,
        date: category.date,
      })

      console.log('Category created successfully:', {
        id: newCategory.id,
        title: newCategory.title
      })

      setCategories((prev) => [newCategory, ...prev])
      setShowCreateDialog(false)
      toast({
        title: "Success",
        description: "Category created successfully!",
      })
    } catch (error: any) {
      console.error("Error creating category:", {
        error: {
          name: error?.name,
          message: error?.message,
          code: error?.code,
          details: error?.details,
          stack: error?.stack
        },
        context: {
          userId: user.id,
          category,
          timestamp: new Date().toISOString()
        }
      })

      // Set user-friendly error message based on error type
      let errorMessage = "Failed to create category. Please try again."
      
      if (error instanceof CategoryError) {
        switch (error.code) {
          case '23505':
            errorMessage = "A category with this name already exists."
            break;
          case 'PGRST301':
            errorMessage = "Session expired. Please sign in again."
            break;
          default:
            if (error.message) {
              errorMessage = error.message
            }
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!user) return

    try {
      await categoriesService.deleteCategory(user.id, categoryId)
      
      console.log('Category deleted successfully:', {
        categoryId,
        userId: user.id
      })

      setCategories((prev) => prev.filter((cat) => cat.id !== categoryId))
      toast({
        title: "Success",
        description: "Category deleted successfully!",
      })
    } catch (error: any) {
      console.error("Error deleting category:", {
        error: {
          name: error?.name,
          message: error?.message,
          code: error?.code,
          details: error?.details,
          stack: error?.stack
        },
        context: {
          userId: user.id,
          categoryId,
          timestamp: new Date().toISOString()
        }
      })

      // Set user-friendly error message based on error type
      let errorMessage = "Failed to delete category. Please try again."
      
      if (error instanceof CategoryError) {
        switch (error.code) {
          case 'PGRST116':
            errorMessage = "Category not found. It may have been already deleted."
            break;
          case 'PGRST301':
            errorMessage = "Session expired. Please sign in again."
            break;
          default:
            if (error.message) {
              errorMessage = error.message
            }
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Show loading spinner while checking auth state
  if (isAuthLoading) {
    return (
      <div className="container py-8">
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show sign in message if no user
  if (!user) {
    return (
      <div className="container py-8">
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Please sign in to view categories.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Gift Categories</h1>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
            <p className="text-muted-foreground">Loading categories...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadCategories} variant="outline">
            Try Again
          </Button>
        </div>
      ) : categories.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <Card 
            className="flex flex-col items-center justify-center h-[140px] cursor-pointer hover:shadow-md transition-shadow border-dashed"
            onClick={() => setShowCreateDialog(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                setShowCreateDialog(true)
              }
            }}
          >
            <Plus className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Create Category</span>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <Card 
            className="flex flex-col items-center justify-center h-[140px] cursor-pointer hover:shadow-md transition-shadow border-dashed"
            onClick={() => setShowCreateDialog(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                setShowCreateDialog(true)
              }
            }}
          >
            <Plus className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Create Category</span>
          </Card>

          {categories.map((category) => (
            <CategoryCard 
              key={category.id} 
              category={category}
              onDelete={() => handleDeleteCategory(category.id)}
            />
          ))}
        </div>
      )}

      <CreateCategoryDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateCategory={handleCreateCategory}
      />
    </div>
  )
} 