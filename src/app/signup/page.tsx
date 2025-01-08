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

export default function SignUpPage() {
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
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
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
            description: "Group gift has been added to your collection. Please check your email to verify your account.",
          })
        } catch (error) {
          console.error('Error copying group:', error)
          toast({
            title: "Error",
            description: "Failed to add group gift. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Check your email",
          description: "We've sent you a link to verify your email address.",
        })
      }

      // Refresh the session and redirect
      await supabase.auth.getSession()
      router.push('/groups')
      router.refresh()

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
            <h1 className="text-2xl font-bold">Sign Up</h1>
            <p className="text-gray-500">
              Create an account to start managing your group gifts.
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
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link 
              href={redirectTo ? `/login?redirect_to=${encodeURIComponent(redirectTo)}` : "/login"}
              className="text-blue-600 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </Card>
    </div>
  )
} 