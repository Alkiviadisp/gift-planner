"use client"

import { useState } from "react"
import { useSupabase } from "@/lib/supabase/provider"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { UserMenu } from "@/components/layout/user-menu"

export default function CalendarPage() {
  const { user } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()

  if (!user) {
    return (
      <div className="container py-8">
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Please sign in to view calendar.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 relative">
      {/* User Menu */}
      <div className="absolute top-4 right-4 z-50">
        <UserMenu />
      </div>

      <h1 className="text-3xl font-bold mb-8">Calendar</h1>
      
      <div className="text-center py-8">
        <p className="text-muted-foreground">Calendar feature coming soon!</p>
      </div>
    </div>
  )
} 