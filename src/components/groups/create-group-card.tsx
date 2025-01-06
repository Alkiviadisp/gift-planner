"use client"

import { Card, CardHeader } from "@/components/ui/card"
import { Plus } from "lucide-react"

export function CreateGroupCard() {
  return (
    <Card 
      className="hover:shadow-md transition-shadow group relative overflow-hidden cursor-pointer bg-white"
    >
      <CardHeader className="relative py-8">
        <div className="flex items-center justify-center flex-col space-y-3">
          <Plus className="h-6 w-6 text-gray-500" />
          <p className="text-gray-500 text-base">Create Gift Group</p>
        </div>
      </CardHeader>
    </Card>
  )
} 