"use client"

import { useState } from "react"
import { useSupabase } from "@/lib/supabase/provider"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { UserMenu } from "@/components/layout/user-menu"
import { ThemeToggleButton } from "@/components/layout/theme-toggle-button"
import { Button } from "@/components/ui/button"
import { AuthDialog } from "@/components/auth/auth-dialog"

export default function CalendarPage() {
  const { user } = useSupabase()
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  if (!user) {
    return (
      <div className="container py-8">
        {/* Theme Toggle and Sign In */}
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
          <p className="text-muted-foreground">Please sign in to view calendar.</p>
        </div>
        <AuthDialog 
          open={showAuthDialog} 
          onOpenChange={setShowAuthDialog} 
        />
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