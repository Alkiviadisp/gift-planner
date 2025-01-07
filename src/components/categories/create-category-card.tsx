"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { CreateCategoryDialog } from "@/components/categories/create-category-dialog"
import type { Category } from "@/lib/categories/categories-service"

interface CreateCategoryCardProps {
  onCreateCategory: (category: Omit<Category, "id">) => void
}

export function CreateCategoryCard({ onCreateCategory }: CreateCategoryCardProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <>
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

      <CreateCategoryDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateCategory={onCreateCategory}
      />
    </>
  )
} 