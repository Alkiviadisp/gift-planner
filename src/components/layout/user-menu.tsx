import { useState, useEffect } from "react"
import { User, Home, Settings, LogOut, Bell } from "lucide-react"
import { useSupabase } from "@/lib/supabase/provider"
import { Button } from "@/components/ui/button"
import { AuthDialog } from "@/components/auth/auth-dialog"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "./theme-toggle"
import { MailboxDialog } from "@/components/mailbox/mailbox-dialog"
import { notificationService } from "@/lib/notifications/notification-service"

export function UserMenu() {
  const { user, profile, signOut, refreshProfile, isLoading } = useSupabase()
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [showMailbox, setShowMailbox] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Only refresh profile if we have a user but no profile
  useEffect(() => {
    if (user && !profile) {
      refreshProfile()
    }
  }, [user]) // Only depend on user changes, not profile

  // Load unread count when user is available
  useEffect(() => {
    if (!user) return

    let subscription: any

    const loadUnreadCount = async () => {
      try {
        const count = await notificationService.getUnreadCount()
        setUnreadCount(count)
      } catch (error) {
        console.error('Error loading unread count:', error)
      }
    }

    const setupSubscription = async () => {
      subscription = await notificationService.subscribeToNotifications(
        user.id,
        (notification) => {
          if (notification.status === 'unread') {
            setUnreadCount(prev => prev + 1)
          }
        }
      )
    }

    loadUnreadCount()
    setupSubscription()

    return () => {
      subscription?.unsubscribe()
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        <Avatar className="h-8 w-8 animate-pulse">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 border border-muted">
            <AvatarFallback>
              <Home className="h-4 w-4 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <Button 
            variant="outline" 
            className="border-slate-800 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full font-medium"
            onClick={() => setShowAuthDialog(true)}
          >
            Sign In
          </Button>
        </div>
        <AuthDialog 
          open={showAuthDialog} 
          onOpenChange={setShowAuthDialog} 
        />
      </div>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 px-2"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={profile?.avatar_url ?? undefined} 
                alt={profile?.nickname || user.email || 'User avatar'} 
              />
              <AvatarFallback>
                {profile?.nickname?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden sm:inline-block">
              {profile?.nickname || user.email?.split('@')[0] || 'Loading...'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-56" 
          align="end" 
          forceMount
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {profile?.nickname || user.email?.split('@')[0] || 'Loading...'}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setShowMailbox(true)}
          >
            <Bell className="mr-2 h-4 w-4" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account" className="flex items-center cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Account Settings
            </Link>
          </DropdownMenuItem>
          <ThemeToggle />
          <DropdownMenuItem
            className="cursor-pointer text-red-600 focus:text-red-600"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <MailboxDialog
        open={showMailbox}
        onOpenChange={setShowMailbox}
      />
    </>
  )
} 