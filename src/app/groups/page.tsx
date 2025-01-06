"use client"

import { CreateGroupCard } from "@/components/groups/create-group-card"

export default function GroupsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Gift Groups</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <CreateGroupCard />
        {/* Other group cards will be added here */}
      </div>
    </div>
  )
} 