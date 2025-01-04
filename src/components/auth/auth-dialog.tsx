"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { Apple } from "lucide-react"
import { PasswordStrength } from "@/components/ui/password-strength"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FormErrors {
  nickname?: string
  email?: string
  password?: string
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    nickname: "",
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const { toast } = useToast()
  const router = useRouter()

  const validateForm = (isSignUp: boolean) => {
    const newErrors: FormErrors = {}

    if (isSignUp && !formData.nickname) {
      newErrors.nickname = "Nickname is required"
    } else if (isSignUp && formData.nickname.length < 3) {
      newErrors.nickname = "Nickname must be at least 3 characters"
    }

    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (isSignUp && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const isSignUp = (event.currentTarget.action as string).includes("sign-up")
    
    if (!validateForm(isSignUp)) return

    setIsLoading(true)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              nickname: formData.nickname,
            },
          },
        })
        if (error) throw error

        toast({
          title: "Verification email sent",
          description: "Please check your email to verify your account.",
        })
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })
        if (error) throw error

        router.refresh()
        onOpenChange(false)
      }
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function signInWithProvider(provider: 'google' | 'apple') {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: provider === 'google' ? {
            access_type: 'offline',
            prompt: 'consent',
          } : undefined,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
        <Tabs defaultValue="sign-in" className="w-full">
          <TabsList className="w-full h-16 grid grid-cols-2 rounded-none bg-muted/50">
            <TabsTrigger value="sign-in" className="text-lg data-[state=active]:bg-background rounded-none">Sign In</TabsTrigger>
            <TabsTrigger value="sign-up" className="text-lg data-[state=active]:bg-background rounded-none">Sign Up</TabsTrigger>
          </TabsList>
          <div className="p-6 space-y-6">
            <div className="grid gap-4">
              <Button
                variant="outline"
                className="h-12"
                onClick={() => signInWithProvider('google')}
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
              >
                <Apple className="mr-2 h-5 w-5" />
                Continue with Apple
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>
            <AnimatePresence mode="wait">
              <TabsContent value="sign-in" asChild>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <form onSubmit={onSubmit} className="space-y-4">
                    <input type="hidden" name="action" value="sign-in" />
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="m@example.com"
                        className={cn("h-12", errors.email && "border-red-500")}
                        required
                        disabled={isLoading}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500">{errors.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={cn("h-12", errors.password && "border-red-500")}
                        required
                        disabled={isLoading}
                      />
                      {errors.password && (
                        <p className="text-sm text-red-500">{errors.password}</p>
                      )}
                    </div>
                    <Button className="w-full h-12 text-base" type="submit" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </motion.div>
              </TabsContent>
              <TabsContent value="sign-up" asChild>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <form onSubmit={onSubmit} className="space-y-4">
                    <input type="hidden" name="action" value="sign-up" />
                    <div className="space-y-2">
                      <Label htmlFor="nickname">Nickname</Label>
                      <Input
                        id="nickname"
                        name="nickname"
                        value={formData.nickname}
                        onChange={handleInputChange}
                        placeholder="johndoe"
                        className={cn("h-12", errors.nickname && "border-red-500")}
                        required
                        disabled={isLoading}
                      />
                      {errors.nickname && (
                        <p className="text-sm text-red-500">{errors.nickname}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="m@example.com"
                        className={cn("h-12", errors.email && "border-red-500")}
                        required
                        disabled={isLoading}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500">{errors.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={cn("h-12", errors.password && "border-red-500")}
                        required
                        disabled={isLoading}
                      />
                      <PasswordStrength password={formData.password} />
                      {errors.password && (
                        <p className="text-sm text-red-500">{errors.password}</p>
                      )}
                    </div>
                    <Button className="w-full h-12 text-base" type="submit" disabled={isLoading}>
                      {isLoading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 