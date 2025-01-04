"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Gift,
  Settings,
  Users,
  LogOut,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { useSupabase } from "@/lib/supabase/provider"

const navItems = [
  {
    title: "Gift Categories",
    href: "/categories",
    icon: Gift,
  },
  {
    title: "Group Gifts",
    href: "/groups",
    icon: Users,
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: Calendar,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
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
            key={item.href}
            variant={pathname === item.href ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-2",
              pathname === item.href && "bg-secondary"
            )}
            asChild
          >
            <Link href={item.href}>
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          </Button>
        ))}
      </div>
      <div className="border-t p-4">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {profile?.full_name || "User"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut()}
              className="ml-auto"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
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