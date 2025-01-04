"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Gift,
  Users,
  LogOut,
  Settings,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { useSupabase } from "@/lib/supabase/provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
  {
    id: "categories",
    title: "Gift Categories",
    href: "/categories",
    icon: Gift,
  },
  {
    id: "groups",
    title: "Group Gifts",
    href: "/groups",
    icon: Users,
  },
  {
    id: "calendar",
    title: "Calendar",
    href: "/calendar",
    icon: Calendar,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const { user, profile, signOut } = useSupabase()

  return (
    <div className="flex h-screen w-[200px] flex-col border-r bg-background px-2">
      <div className="flex h-14 items-center border-b px-2">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          🎁 Gift Planner
        </Link>
      </div>
      <div className="flex-1 space-y-1 py-4">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={pathname === item.href ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-2",
              pathname === item.href && "bg-secondary"
            )}
            asChild
          >
            <Link href={item.href}>
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          </Button>
        ))}
      </div>
      <div className="border-t p-4">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 px-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {profile?.nickname?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {profile?.nickname || "User"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem asChild>
                <Link href="/account" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut()}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            className="w-full justify-start gap-2"
            onClick={() => setShowAuthDialog(true)}
          >
            Sign In
          </Button>
        )}
      </div>
      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </div>
  )
} 