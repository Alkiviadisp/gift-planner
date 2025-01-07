import { useState, useEffect } from "react"
import { User, Home, Settings, LogOut } from "lucide-react"
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

export function UserMenu() {
  const { user, profile, signOut, refreshProfile, isLoading } = useSupabase()
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  // Add effect to refresh profile when user changes
  useEffect(() => {
    if (user && !profile) {
      refreshProfile()
    }
  }, [user, profile, refreshProfile])

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
            className="border-black text-black hover:bg-black/5 rounded-full font-medium"
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
        <DropdownMenuItem asChild>
          <Link href="/account" className="flex items-center cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Account Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 