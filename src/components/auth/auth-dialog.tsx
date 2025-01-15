"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { MultiStepSignup } from "./multi-step-signup"

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  })
  const { toast } = useToast()
  const router = useRouter()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      return "Email is required"
    }
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address"
    }
    return ""
  }

  const validatePassword = (password: string) => {
    if (!password) {
      return "Password is required"
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters long"
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter"
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter"
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number"
    }
    return ""
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({ email: "", password: "", general: "" })

    try {
      const formData = new FormData(e.currentTarget)
      const email = formData.get("email") as string
      const password = formData.get("password") as string
      const isSignUp = e.currentTarget.dataset.action === "sign-up"

      // Validate email and password
      const emailError = validateEmail(email)
      const passwordError = validatePassword(password)

      if (emailError || passwordError) {
        setErrors({
          email: emailError,
          password: passwordError,
          general: "",
        })
        return
      }

      if (isSignUp) {
        const nickname = formData.get("nickname") as string
        if (!nickname?.trim()) {
          setErrors(prev => ({ ...prev, general: "Nickname is required" }))
          return
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nickname: nickname.trim(),
              avatar_url: null,
              full_name: nickname.trim(),
              subscription_tier: 'free',
              subscription_start_date: new Date().toISOString()
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (error) {
          if (error.message.includes("already registered")) {
            setErrors(prev => ({ ...prev, email: "This email is already registered" }))
          } else {
            throw error
          }
          return
        }

        toast({
          title: "Check your email",
          description: "We sent you a verification link to complete your registration.",
        })
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            setErrors(prev => ({ ...prev, general: "Invalid email or password" }))
          } else if (error.message.includes("Email not confirmed")) {
            setErrors(prev => ({ ...prev, general: "Please verify your email first" }))
          } else {
            throw error
          }
          return
        }

        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        })

        onOpenChange(false)
        router.push("/categories")
      }
    } catch (error: any) {
      console.error('Authentication error:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        stack: error?.stack
      })
      setErrors(prev => ({
        ...prev,
        general: "An unexpected error occurred. Please try again."
      }))
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value
    const isSignUp = e.target.form?.dataset.action === "sign-up"
    
    if (isSignUp) {
      const error = validatePassword(password)
      setErrors(prev => ({ ...prev, password: error }))
    } else {
      setErrors(prev => ({ ...prev, password: "" }))
    }
  }

  const signInWithProvider = async (provider: 'google' | 'apple') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      // The OAuth flow will handle the redirect automatically
      // After successful auth, the user will be redirected to /auth/callback
      // which should then redirect to /categories
    } catch (error) {
      console.error('OAuth error:', error)
      toast({
        title: "Error",
        description: "Failed to sign in. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogTitle className="sr-only">Authentication</DialogTitle>
        <Tabs defaultValue="sign-in" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sign-in">Sign In</TabsTrigger>
            <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
          </TabsList>

          {errors.general && (
            <div className="mt-4 p-3 bg-destructive/15 text-destructive text-sm rounded-md">
              {errors.general}
            </div>
          )}

          <TabsContent value="sign-in">
            <form onSubmit={handleSubmit} data-action="sign-in" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="sign-in-email">Email</Label>
                <Input
                  id="sign-in-email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  disabled={isLoading}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "sign-in-email-error" : undefined}
                />
                {errors.email && (
                  <p id="sign-in-email-error" className="text-sm text-destructive">
                    {errors.email}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sign-in-password">Password</Label>
                <Input
                  id="sign-in-password"
                  name="password"
                  type="password"
                  required
                  disabled={isLoading}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "sign-in-password-error" : undefined}
                />
                {errors.password && (
                  <p id="sign-in-password-error" className="text-sm text-destructive">
                    {errors.password}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="mr-2">Signing in...</span>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="sign-up">
            <div className="py-4">
              <MultiStepSignup />
            </div>
          </TabsContent>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            <Button
              variant="outline"
              className="h-12"
              onClick={() => signInWithProvider('google')}
              disabled={isLoading}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>
            <Button
              variant="outline"
              className="h-12"
              onClick={() => signInWithProvider('apple')}
              disabled={isLoading}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"
                  fill="currentColor"
                />
              </svg>
              Continue with Apple
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 