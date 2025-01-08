'use client'

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { copySharedGroup } from "@/lib/groups/groups-service"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect_to')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClientComponentClient()
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          persistSession: true
        }
      })

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (!user?.id) {
        toast({
          title: "Error",
          description: "Failed to get user information",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Check if we're coming from a share link
      if (redirectTo && redirectTo.includes('/share/group/')) {
        try {
          // Extract the group ID from the redirect URL
          const parts = redirectTo.split('/share/group/')
          if (parts.length !== 2) {
            throw new Error('Invalid share URL')
          }

          const groupId = parts[1]?.split('?')[0] // Handle any query parameters
          if (!groupId) {
            throw new Error('Invalid group ID')
          }
          
          // Copy the group to the user's collection
          await copySharedGroup(groupId, user.id)
          
          toast({
            title: "Success!",
            description: "Group gift has been added to your collection",
          })

          // Ensure session is properly set and persisted
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            // Force a hard navigation to ensure session is maintained
            window.location.href = '/groups'
          } else {
            toast({
              title: "Error",
              description: "Session not established. Please try logging in again.",
              variant: "destructive",
            })
          }
          return
        } catch (error) {
          console.error('Error copying group:', error)
          toast({
            title: "Error",
            description: "Failed to add group gift. Please try again.",
            variant: "destructive",
          })
        }
      }

      // Default flow - if not a shared group link
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        if (redirectTo) {
          window.location.href = decodeURIComponent(redirectTo)
        } else {
          window.location.href = '/groups'
        }
      } else {
        toast({
          title: "Error",
          description: "Session not established. Please try logging in again.",
          variant: "destructive",
        })
      }
      
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-lg py-8">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Sign In</h1>
            <p className="text-gray-500">
              Welcome back! Please sign in to continue.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link 
              href={redirectTo ? `/signup?redirect_to=${encodeURIComponent(redirectTo)}` : "/signup"}
              className="text-blue-600 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </form>
      </Card>
    </div>
  )
} 