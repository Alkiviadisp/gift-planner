"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { CreateCategoryDialog } from "@/components/categories/create-category-dialog"
import { CategoryCard } from "@/components/categories/category-card"

interface Category {
  id: string
  title: string
  date: Date
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Gift Categories</h1>

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
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>

      <CreateCategoryDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateCategory={(category: Category) => {
          setCategories((prev) => [...prev, category])
          setShowCreateDialog(false)
        }}
      />
    </div>
  )
} 