"use client"

import { useState } from "react"
import { Card, CardHeader } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { CreateGroupDialog } from "./create-group-dialog"
import type { GiftGroup } from "@/lib/groups/groups-service"
import { cn } from "@/lib/utils"

interface CreateGroupCardProps {
  onCreateGroup: (group: Omit<GiftGroup, "id" | "user_id" | "created_at" | "updated_at">) => void
}

export function CreateGroupCard({ onCreateGroup }: CreateGroupCardProps) {
  const [showDialog, setShowDialog] = useState(false)

  const handleCreateGroup = async (group: Omit<GiftGroup, "id" | "user_id" | "created_at" | "updated_at">) => {
    await onCreateGroup(group)
    setShowDialog(false)
  }

  return (
    <>
      <Card 
        className={cn(
          "hover:shadow-md transition-shadow border-dashed group relative overflow-hidden",
          "hover:translate-y-[-2px] transition-all duration-200 cursor-pointer"
        )}
        onClick={() => setShowDialog(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setShowDialog(true)
          }
        }}
      >
        <CardHeader className="relative flex flex-col items-center justify-center min-h-[180px]">
          <Plus className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">Create Group Gift</span>
        </CardHeader>
      </Card>

      <CreateGroupDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onCreateGroup={handleCreateGroup}
      />
    </>
  )
} 