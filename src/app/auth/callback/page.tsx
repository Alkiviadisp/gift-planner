"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/provider"

export default function AuthCallbackPage() {
  const router = useRouter()
  const { user } = useSupabase()

  useEffect(() => {
    if (user) {
      router.push("/categories")
    }
  }, [user, router])

  return (
    <div className="flex h-[50vh] items-center justify-center">
      <p className="text-muted-foreground">Completing authentication...</p>
    </div>
  )
} 