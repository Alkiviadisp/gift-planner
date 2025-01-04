"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { differenceInDays } from "date-fns"
import { GiftList } from "@/components/gifts/gift-list"

interface Category {
  id: string
  title: string
  date: Date
  color: string
}

interface CategoryCardProps {
  category: Category
  onDelete: () => void
}

export function CategoryCard({ category, onDelete }: CategoryCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showGiftDialog, setShowGiftDialog] = useState(false)
  const daysUntil = differenceInDays(category.date, new Date())
  const daysText = daysUntil === 0 
    ? "Today!" 
    : daysUntil === 1 
    ? "Tomorrow" 
    : `${daysUntil} days left`

  return (
    <>
      <Card 
        className="hover:shadow-md transition-shadow group relative overflow-hidden cursor-pointer"
        style={{ backgroundColor: category.color }}
        onClick={() => setShowGiftDialog(true)}
      >
        <CardHeader className="relative">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl text-gray-800">{category.title}</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                {daysUntil < 0 ? "Past event" : daysText}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                setShowDeleteDialog(true)
              }}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Dialog open={showGiftDialog} onOpenChange={setShowGiftDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{category.title} - Gifts</DialogTitle>
          </DialogHeader>
          <GiftList categoryId={category.id} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{category.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete()
                setShowDeleteDialog(false)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 