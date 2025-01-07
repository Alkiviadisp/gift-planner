"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { CreateCategoryDialog } from "@/components/categories/create-category-dialog"
import { CategoryCard } from "@/components/categories/category-card"
import { CreateCategoryCard } from "@/components/categories/create-category-card"
import { useSupabase } from "@/lib/supabase/provider"
import { categoriesService, Category, CategoryError } from "@/lib/categories/categories-service"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { UserMenu } from "@/components/layout/user-menu"
import { ThemeToggleButton } from "@/components/layout/theme-toggle-button"
import { AuthDialog } from "@/components/auth/auth-dialog"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, isLoading: isAuthLoading } = useSupabase()
  const { toast } = useToast()
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  // Only load categories once on initial mount if user exists
  useEffect(() => {
    if (!user) {
      console.log('No user found in loadCategories')
      return
    }

    const loadData = async () => {
      if (categories.length > 0 || isLoading) return;

      try {
        setIsLoading(true);
        const data = await categoriesService.getCategories(user.id);
        if (data) {
          setCategories(data);
          setError(null);
        }
      } catch (error: any) {
        console.error("Error loading categories:", error);
        const errorMessage = error?.message || "Failed to load categories. Please try again.";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]); // Only depend on user

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

  const handleUpdateCategory = async (categoryId: string, updatedCategory: Omit<Category, "id">) => {
    if (!user) return

    try {
      const updated = await categoriesService.updateCategory(user.id, categoryId, updatedCategory)
      setCategories((prev) => prev.map((cat) => cat.id === categoryId ? updated : cat))
      toast({
        title: "Success",
        description: "Category updated successfully!",
      })
    } catch (error: any) {
      console.error("Error updating category:", error)
      toast({
        title: "Error",
        description: "Failed to update category. Please try again.",
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

  if (!user) {
    return (
      <div className="container py-8">
        {/* Theme Toggle and Sign In */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          <ThemeToggleButton />
          <Button 
            variant="outline" 
            className="border-slate-800 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full font-medium"
            onClick={() => setShowAuthDialog(true)}
          >
            Sign In
          </Button>
        </div>
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Please sign in to view categories.</p>
        </div>
        <AuthDialog 
          open={showAuthDialog} 
          onOpenChange={setShowAuthDialog} 
        />
      </div>
    )
  }

  return (
    <div className="container py-8 relative">
      {/* User Menu */}
      <div className="absolute top-4 right-4 z-50">
        <UserMenu />
      </div>

      <h1 className="text-3xl font-bold mb-8">Gift Categories</h1>
      
      {error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <CreateCategoryCard onCreateCategory={handleCreateCategory} />
          {categories.map((category) => (
            <CategoryCard 
              key={category.id} 
              category={category}
              onDelete={() => handleDeleteCategory(category.id)}
              onUpdate={handleUpdateCategory}
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