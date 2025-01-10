import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { groupsService } from '@/lib/groups/groups-service'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface NotificationActionProps {
  notificationId: string
  category: string
  status: string
  metadata?: {
    group_id?: string
  }
  onActionComplete?: () => void
}

export function NotificationAction({ 
  notificationId, 
  category,
  status,
  metadata,
  onActionComplete 
}: NotificationActionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleViewGroup = () => {
    if (!metadata?.group_id) {
      console.error('No group ID found in notification metadata')
      return
    }

    // Redirect to share page with notification context
    router.push(`/share/group/${metadata.group_id}?from=notification&notification_id=${notificationId}`)
  }

  if (category === 'gift' && status === 'active') {
    return (
      <div className="flex justify-end space-x-2 mt-2">
        <Button
          variant="default"
          size="sm"
          onClick={handleViewGroup}
          disabled={isLoading}
        >
          View Invitation
        </Button>
      </div>
    )
  }

  return null
} 