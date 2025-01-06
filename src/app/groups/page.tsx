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
      setError("Failed to load gift groups")
      toast({
        title: "Error",
        description: "Failed to load gift groups. Please try again.",
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
    if (!user) {
      console.log('No user found in handleCreateGroup')
      return
    }

    try {
      console.log('Creating group:', group)
      const newGroup = await groupsService.createGroup(user.id, group)
      console.log('Group created:', newGroup)
      setGroups((prev) => [...prev, newGroup])
      toast({
        title: "Success",
        description: "Gift group created successfully!",
      })
    } catch (error) {
      console.error("Error creating group:", error)
      toast({
        title: "Error",
        description: "Failed to create gift group. Please try again.",
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
        description: "Gift group deleted successfully!",
      })
    } catch (error) {
      console.error("Error deleting group:", error)
      toast({
        title: "Error",
        description: "Failed to delete gift group. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!user) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Gift Groups</h1>
        <div className="text-center py-8">Please log in to view your gift groups.</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Gift Groups</h1>
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Gift Groups</h1>
      
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
            />
          ))}
        </div>
      )}
    </div>
  )
} 