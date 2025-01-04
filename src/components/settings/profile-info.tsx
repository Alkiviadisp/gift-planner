"use client"

import { useState, useEffect } from "react"
import { Mail, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { useSupabase } from "@/lib/supabase/provider"
import { AvatarUpload } from "@/components/ui/avatar-upload"
import { cn } from "@/lib/utils"

interface ProfileInfoProps {
  isLoading?: boolean
  onAvatarUpdate?: () => Promise<void>
}

export function ProfileInfo({ isLoading = false, onAvatarUpdate }: ProfileInfoProps) {
  const { user, profile } = useSupabase()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    nickname: "",
    email: "",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user && profile) {
      setFormData({
        nickname: profile.nickname || "",
        email: user.email || "",
      })
    }
  }, [user, profile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAvatarUpload = async (file: File) => {
    if (!user) return

    try {
      setLoading(true)

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const { error: uploadError, data } = await supabase.storage
        .from("avatars")
        .upload(fileName, file)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName)

      // Update user profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id)

      if (updateError) {
        throw updateError
      }

      // Call the onAvatarUpdate callback if provided
      await onAvatarUpdate?.()

      toast({
        title: "Avatar updated",
        description: "Your avatar has been updated successfully.",
      })
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Error",
        description: "Failed to update avatar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    try {
      setLoading(true)

      const { error } = await supabase
        .from("profiles")
        .update({
          nickname: formData.nickname,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Information
        </CardTitle>
        <CardDescription>
          Update your profile information and avatar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <AvatarUpload
            avatarUrl={profile?.avatar_url}
            fallback={profile?.nickname?.[0]?.toUpperCase() || "?"}
            onUpload={handleAvatarUpload}
            isLoading={loading}
            size="lg"
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nickname
              </Label>
              <Input
                id="nickname"
                name="nickname"
                value={formData.nickname}
                onChange={handleInputChange}
                className={cn(
                  "font-medium",
                  !formData.nickname && "text-muted-foreground"
                )}
                placeholder="Enter your nickname"
                disabled={loading || isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                className="text-muted-foreground"
                disabled
              />
              <p className="text-sm text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
            <Button type="submit" disabled={loading || isLoading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
} 