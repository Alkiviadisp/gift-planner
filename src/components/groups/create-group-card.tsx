"use client"

import { useState } from "react"
import { Card, CardHeader } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { CreateGroupDialog } from "./create-group-dialog"
import type { GiftGroup } from "@/lib/groups/groups-service"

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
        className="hover:shadow-md transition-shadow group relative overflow-hidden cursor-pointer bg-white"
        onClick={() => setShowDialog(true)}
      >
        <CardHeader className="relative py-8">
          <div className="flex items-center justify-center flex-col space-y-3">
            <Plus className="h-6 w-6 text-gray-500" />
            <p className="text-gray-500 text-base">Create Group Gift</p>
          </div>
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