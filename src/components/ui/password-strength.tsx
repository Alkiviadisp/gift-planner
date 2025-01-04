"use client"

import { cn } from "@/lib/utils"

interface PasswordStrengthProps {
  password: string
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const getStrengthWidth = (password: string) => {
    if (!password) return "0%"
    
    let strength = 0
    // Length check
    if (password.length >= 8) strength += 25
    // Contains number
    if (/\d/.test(password)) strength += 25
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 25
    // Contains uppercase or special char
    if (/[A-Z]/.test(password) || /[^A-Za-z0-9]/.test(password)) strength += 25

    return `${strength}%`
  }

  const getStrengthColor = (width: string) => {
    const percentage = parseInt(width)
    if (percentage <= 25) return "bg-red-500"
    if (percentage <= 50) return "bg-orange-500"
    if (percentage <= 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const width = getStrengthWidth(password)
  const color = getStrengthColor(width)

  return (
    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
      <div
        className={cn("h-full transition-all duration-300", color)}
        style={{ width }}
      />
    </div>
  )
} 