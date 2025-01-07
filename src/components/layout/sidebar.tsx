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
  Home,
} from "lucide-react"
import { useSupabase } from "@/lib/supabase/provider"

const navItems = [
  {
    id: "home",
    title: "Home",
    href: "/",
    icon: Home,
  },
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
  const { user } = useSupabase()

  return (
    <div className="flex h-screen w-[200px] flex-col border-r bg-background px-2">
      <div className="flex h-14 items-center border-b px-2">
        <Button
          variant="ghost"
          className="flex items-center gap-2 font-semibold hover:bg-transparent"
          asChild
        >
          <Link href="/">
            🎁 Gift Planner
          </Link>
        </Button>
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
    </div>
  )
} 