import { Suspense } from "react"
import ShareGroupClient from "./share-group-client"

interface ShareGroupPageProps {
  params: { id: string }
}

export default function ShareGroupPage({ params }: ShareGroupPageProps) {
  return (
    <Suspense fallback={
      <div className="container max-w-3xl py-8">
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <ShareGroupClient id={params.id} />
    </Suspense>
  )
} 