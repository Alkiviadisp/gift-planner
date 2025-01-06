"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, ExternalLink, Edit } from "lucide-react"
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
import { differenceInDays } from "date-fns"
import type { GiftGroup } from "@/lib/groups/groups-service"
import { cn } from "@/lib/utils"
import { EditGroupDialog } from "./edit-group-dialog"

interface GroupCardProps {
  group: GiftGroup
  onDelete: () => void
  onUpdate: (groupId: string, group: Omit<GiftGroup, "id" | "user_id" | "created_at" | "updated_at">) => void
}

export function GroupCard({ group, onDelete, onUpdate }: GroupCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const daysUntil = differenceInDays(group.date, new Date())
  const daysText = daysUntil === 0 
    ? "Today!" 
    : daysUntil === 1 
    ? "Tomorrow" 
    : daysUntil < 0
    ? "Past event"
    : `${daysUntil} days left`

  return (
    <>
      <Card 
        className={cn(
          "hover:shadow-md transition-shadow group relative overflow-hidden cursor-pointer",
          "hover:translate-y-[-2px] transition-all duration-200"
        )}
        style={{ backgroundColor: group.color }}
        onClick={() => setShowEditDialog(true)}
      >
        <CardHeader className="relative">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl text-gray-800">{group.title}</CardTitle>
              <div className="space-y-1 mt-2">
                <p className="text-sm text-gray-600">
                  {group.occasion}
                </p>
                <p className="text-sm text-gray-600">
                  {daysText}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {group.participants.length} participant{group.participants.length !== 1 ? 's' : ''}
                </div>
                <p className="text-sm text-gray-600">
                  ${group.price.toFixed(2)}
                </p>
                {group.product_url && (
                  <div className="flex items-center gap-2">
                    {group.product_image_url && (
                      <img
                        src={group.product_image_url}
                        alt=""
                        className="h-6 w-6 object-cover rounded"
                      />
                    )}
                    <a
                      href={group.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="truncate max-w-[200px]">View Product</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {group.comments && (
                  <p className="text-sm text-gray-600 italic">
                    {group.comments}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowEditDialog(true)
                }}
              >
                <Edit className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
              </Button>
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
          </div>
        </CardHeader>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group Gift</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{group.title}"? This action cannot be undone.
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

      <EditGroupDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onUpdateGroup={onUpdate}
        group={group}
      />
    </>
  )
} 