"use client"

import { useState, useEffect, useCallback } from "react"
import { CreateGroupCard } from "@/components/groups/create-group-card"
import { GroupCard } from "@/components/groups/group-card"
import { useSupabase } from "@/lib/supabase/provider"
import { groupsService } from "@/lib/groups/groups-service"
import type { GiftGroup } from "@/lib/groups/groups-service"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { UserMenu } from "@/components/layout/user-menu"
import { ThemeToggleButton } from "@/components/layout/theme-toggle-button"
import { Button } from "@/components/ui/button"
import { AuthDialog } from "@/components/auth/auth-dialog"

// This interface represents the form input, which is different from the database model
interface CreateGroupFormInput {
  title: string
  occasion: string
  date: Date
  price: number
  product_url?: string
  product_image_url?: string
  comments?: string
  participants: string[]
  color: string
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<GiftGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!user && !isLoading) {
      router.push('/')
    }
  }, [user, isLoading, router])

  // Memoize loadGroups to prevent unnecessary recreations
  const loadGroups = useCallback(async () => {
    if (!user) return

    try {
      const groups = await groupsService.getGroups(user.id)
      setGroups(groups)
      setError(null)
    } catch (error) {
      setError("Failed to load Group Gifts")
      toast({
        title: "Error",
        description: "Failed to load Group Gifts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, toast])

  // Load groups when user changes
  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  const handleCreateGroup = async (group: CreateGroupFormInput) => {
    if (!user) return
    try {
      await groupsService.createGroup({
        name: group.title,
        description: group.occasion,
        amount: group.price,
        currency: 'EUR',
        imageUrl: group.product_image_url || null,
        participants: group.participants.map(email => ({ email })),
        date: group.date
      })

      await loadGroups()
      
      toast({
        title: "Success", 
        description: "Group Gift created successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create Group Gift. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!user) return
    
    try {
      await groupsService.deleteGroup(user.id, groupId)
      await loadGroups()
      toast({
        title: "Success",
        description: "Group Gift deleted successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete Group Gift. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateGroup = async (groupId: string, updatedGroup: CreateGroupFormInput) => {
    if (!user) return
    try {
      await groupsService.updateGroup(groupId, {
        name: updatedGroup.title,
        description: updatedGroup.occasion,
        amount: updatedGroup.price,
        currency: 'EUR',
        imageUrl: updatedGroup.product_image_url || null,
        participants: updatedGroup.participants
      })

      await loadGroups()
      
      toast({
        title: "Success",
        description: "Group Gift updated successfully!",
      })
    } catch (error) {
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
          <p className="text-muted-foreground">Please sign in to view group gifts.</p>
        </div>
        <AuthDialog 
          open={showAuthDialog} 
          onOpenChange={setShowAuthDialog} 
        />
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
      {/* Header with user menu */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <ThemeToggleButton />
        <UserMenu />
      </div>

      {/* Main content */}
      <div>
        <h1 className="text-3xl font-bold mb-8">Group Gifts</h1>
        
        {/* Error message */}
        {error && (
          <div className="text-red-500 mb-4">
            {error}
          </div>
        )}

        {/* Groups grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CreateGroupCard onCreateGroup={handleCreateGroup} />
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onDelete={() => handleDeleteGroup(group.id)}
              onUpdateGroup={handleUpdateGroup}
            />
          ))}
          {groups.length === 0 && !error && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No group gifts yet. Create one to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 