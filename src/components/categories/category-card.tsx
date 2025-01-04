"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { differenceInDays } from "date-fns"

// Pastel colors palette
const PASTEL_COLORS = [
  "bg-[#FFE5E5]", // Soft Pink
  "bg-[#E5F3FF]", // Soft Blue
  "bg-[#E5FFE5]", // Soft Green
  "bg-[#FFF3E5]", // Soft Orange
  "bg-[#F3E5FF]", // Soft Purple
  "bg-[#E5FFF3]", // Soft Mint
  "bg-[#FFE5F3]", // Soft Rose
  "bg-[#F3FFE5]", // Soft Lime
  "bg-[#E5E5FF]", // Soft Lavender
  "bg-[#FFE5E8]", // Soft Coral
]

interface Category {
  id: string
  title: string
  date: Date
}

interface CategoryCardProps {
  category: Category
}

export function CategoryCard({ category }: CategoryCardProps) {
  const daysUntil = differenceInDays(category.date, new Date())
  const daysText = daysUntil === 0 
    ? "Today!" 
    : daysUntil === 1 
    ? "Tomorrow" 
    : `${daysUntil} days left`

  // Get a consistent color based on the category ID
  const colorIndex = parseInt(category.id.slice(0, 8), 16) % PASTEL_COLORS.length
  const backgroundColor = PASTEL_COLORS[colorIndex]

  return (
    <Card className={`hover:shadow-md transition-shadow ${backgroundColor} border-none`}>
      <CardHeader>
        <CardTitle className="text-xl text-gray-800">{category.title}</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          {daysUntil < 0 ? "Past event" : daysText}
        </p>
      </CardHeader>
    </Card>
  )
} 