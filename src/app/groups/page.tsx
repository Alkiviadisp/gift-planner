"use client"

import { useState, useEffect } from "react"
import { CreateGroupCard } from "@/components/groups/create-group-card"
import { GroupCard } from "@/components/groups/group-card"
import { useSupabase } from "@/lib/supabase/provider"
import { groupsService } from "@/lib/groups/groups-service"
import type { GiftGroup } from "@/lib/groups/groups-service"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export default function GroupsPage() {
  const [groups, setGroups] = useState<GiftGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!user && !isLoading) {
      console.log('No user found, redirecting to login...')
      router.push('/')
    }
  }, [user, isLoading, router])

  const loadGroups = async () => {
    if (!user) {
      console.log('No user found in loadGroups')
      return
    }

    try {
      console.log('Loading groups for user:', user.id)
      const groups = await groupsService.getGroups(user.id)
      console.log('Loaded groups:', groups)
      setGroups(groups)
      setError(null)
    } catch (error) {
      console.error("Error loading groups:", error)
      setError("Failed to load Group Gifts")
      toast({
        title: "Error",
        description: "Failed to load Group Gifts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    console.log('User state changed:', user ? 'Logged in' : 'Not logged in')
    loadGroups()
  }, [user])

  const handleCreateGroup = async (group: Omit<GiftGroup, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return

    try {
      const newGroup = await groupsService.createGroup(user.id, group)
      setGroups((prev) => [newGroup, ...prev])
      toast({
        title: "Success",
        description: "Group Gift created successfully!",
      })
    } catch (error) {
      console.error("Error creating group:", error)
      toast({
        title: "Error",
        description: "Failed to create Group Gift. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await groupsService.deleteGroup(groupId)
      setGroups((prev) => prev.filter((group) => group.id !== groupId))
      toast({
        title: "Success",
        description: "Group Gift deleted successfully!",
      })
    } catch (error) {
      console.error("Error deleting group:", error)
      toast({
        title: "Error",
        description: "Failed to delete Group Gift. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateGroup = async (groupId: string, updatedGroup: Omit<GiftGroup, "id" | "user_id" | "created_at" | "updated_at">) => {
    try {
      const updated = await groupsService.updateGroup(groupId, updatedGroup)
      setGroups((prev) => prev.map((group) => group.id === groupId ? updated : group))
      toast({
        title: "Success",
        description: "Group Gift updated successfully!",
      })
    } catch (error) {
      console.error("Error updating group:", error)
      toast({
        title: "Error",
        description: "Failed to update Group Gift. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!user) {
    return (
      <div className="container py-8">
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Please sign in to view categories.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Group Gifts</h1>
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Group Gifts</h1>
      
      {error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <CreateGroupCard onCreateGroup={handleCreateGroup} />
          {groups.map((group) => (
            <GroupCard 
              key={group.id} 
              group={group}
              onDelete={() => handleDeleteGroup(group.id)}
              onUpdate={handleUpdateGroup}
            />
          ))}
        </div>
      )}
    </div>
  )
} 