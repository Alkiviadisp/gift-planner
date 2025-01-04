"use client"

import { useState } from "react"
import { Camera } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface AvatarUploadProps {
  avatarUrl?: string | null
  fallback: string
  onUpload: (file: File) => Promise<void>
  isLoading?: boolean
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-20 w-20",
}

export function AvatarUpload({
  avatarUrl,
  fallback,
  onUpload,
  isLoading = false,
  size = "md",
}: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create a preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    // Upload the file
    await onUpload(file)

    // Clean up the preview URL
    URL.revokeObjectURL(url)
    setPreviewUrl(null)
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className={cn(sizeClasses[size], isLoading && "opacity-50")}>
        <AvatarImage src={previewUrl || avatarUrl || undefined} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      <div>
        <Label htmlFor="avatar" className="cursor-pointer">
          <div className="flex items-center gap-2 rounded-md bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20">
            <Camera className="h-4 w-4" />
            {isLoading ? "Uploading..." : "Change Avatar"}
          </div>
          <Input
            id="avatar"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </Label>
      </div>
    </div>
  )
} 