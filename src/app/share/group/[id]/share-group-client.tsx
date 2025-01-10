'use client'

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, DollarSign, Gift, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { 
  FacebookShareButton, 
  TwitterShareButton, 
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon
} from "react-share"
import { groupsService } from "@/lib/groups/groups-service"
import type { GiftGroup } from "@/lib/groups/groups-service"
import { useSupabase } from "@/lib/supabase/provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function ShareGroupClient({ id }: { id: string }) {
  const supabase = createClientComponentClient()
  const { user, isLoading: isSessionLoading } = useSupabase()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [group, setGroup] = useState<GiftGroup | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isFromNotification = searchParams.get('from') === 'notification'
  const notificationId = searchParams.get('notification_id')

  // Add debug render for session state
  console.log('Render state:', {
    user: user ? 'Found' : 'Not found',
    isSessionLoading,
    isFromNotification,
    notificationId
  });

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Session check:', session ? 'Found' : 'Not found')
        
        if (session?.user) {
          console.log('User found:', session.user.email)
        }
      } catch (error) {
        console.error('Error checking session:', error)
      }
    }

    initSession()
  }, [supabase.auth])

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Fetching group with ID:', id)
        
        // Get group with public access - simplified query
        const { data: group, error } = await supabase
          .from('gift_groups')
          .select('*')
          .eq('id', id)
          .single()

        console.log('Query result:', { data: group, error })

        if (error) {
          console.error('Database error:', error)
          setError(`Group not found: ${error.message}`)
          return
        }

        if (!group) {
          console.error('No group found with id:', id)
          setError('Group not found')
          return
        }

        // Convert date string to Date object
        const groupWithDate = {
          ...group,
          date: new Date(group.date)
        }

        setGroup(groupWithDate)
      } catch (error) {
        console.error('Unexpected error:', error)
        setError(`An unexpected error occurred: ${error}`)
      }
    }

    if (id) {
      loadData()
    }
  }, [id, supabase])

  const handleAddToMyGroups = async () => {
    if (!user) {
      console.log('No user found in handleAddToMyGroups')
      // Get current session to double check
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        // Redirect to login with the current share URL as the redirect URL
        const redirectUrl = encodeURIComponent(window.location.href)
        router.push(`/login?redirect_to=${redirectUrl}`)
        return
      }
    }

    setIsLoading(true)
    try {
      if (!group) return;

      // Create a copy of the group for the current user
      const updatedGroup: Omit<GiftGroup, "id" | "user_id" | "created_at" | "updated_at"> = {
        title: group.title,
        occasion: group.occasion,
        date: group.date,
        price: group.price,
        product_url: group.product_url,
        product_image_url: group.product_image_url,
        comments: group.comments,
        participants: [], // Start with no participants when copying a group
        color: group.color,
      }

      await groupsService.createGroup(user!.id, updatedGroup, { skipNotifications: true })
      
      // If we came from a notification, mark it as read
      if (isFromNotification && notificationId) {
        const { error: updateError } = await supabase
          .from('mailbox_notifications')
          .update({ status: 'read' })
          .eq('id', notificationId)

        if (updateError) {
          console.error('Error marking notification as read:', updateError)
        }
      }
      
      toast({
        title: "Success!",
        description: "Group gift has been added to your collection",
      })

      // Force a hard navigation to ensure session is maintained
      window.location.href = '/groups'
    } catch (error) {
      console.error('Error copying group:', error)
      toast({
        title: "Error",
        description: "Failed to add group gift. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptInvitation = async () => {
    if (!user || !notificationId) return;

    setIsLoading(true)
    try {
      await groupsService.acceptGroupInvitation(notificationId)
      
      toast({
        title: "Success!",
        description: "Group gift has been added to your collection",
      })

      // Force a hard navigation to ensure session is maintained
      window.location.href = '/groups'
    } catch (error) {
      console.error('Error accepting invitation:', error)
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeclineInvitation = async () => {
    if (!user || !notificationId) return;

    setIsLoading(true)
    try {
      // Mark notification as read/declined
      const { error } = await supabase
        .from('mailbox_notifications')
        .update({ status: 'read' })
        .eq('id', notificationId)

      if (error) throw error;
      
      toast({
        title: "Invitation Declined",
        description: "You have declined the group gift invitation",
      })

      window.location.href = '/groups'
    } catch (error) {
      console.error('Error declining invitation:', error)
      toast({
        title: "Error",
        description: "Failed to decline invitation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (error) {
    return (
      <div className="container max-w-3xl py-8">
        <Card className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Group Not Found</h1>
            <p className="text-gray-600 mb-4">This group gift may have been deleted or doesn't exist.</p>
            <Link href="/groups">
              <Button>Go to Groups</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (!group || isSessionLoading) {
    return (
      <div className="container max-w-3xl py-8">
        <Card className="p-6">
          <div className="text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        </Card>
      </div>
    )
  }

  const shareUrl = `${window.location.origin}/share/group/${id}`
  const shareTitle = `Check out this group gift: ${group.title}`

  // Create redirect URLs with the current share URL
  const redirectUrl = encodeURIComponent(window.location.href)
  const loginUrl = `/login?redirect_to=${redirectUrl}`
  const signupUrl = `/signup?redirect_to=${redirectUrl}`

  return (
    <div className="container max-w-3xl py-8 space-y-8">
      {/* Auth Status Banner - Only show if not signed in and not loading */}
      {!isSessionLoading && !user && !isFromNotification && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-blue-700">Sign in to add this group gift to your collection!</p>
            <div className="flex gap-2">
              <Link href={loginUrl} className="w-full sm:w-auto">
                <Button variant="default">Sign In</Button>
              </Link>
              <Link href={signupUrl} className="w-full sm:w-auto">
                <Button variant="outline">Sign Up</Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Notification Actions - Only show if from notification */}
      {!isSessionLoading && user && isFromNotification && notificationId && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-blue-700">Would you like to join this group gift?</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDeclineInvitation}
                disabled={isLoading}
              >
                {isLoading ? 'Declining...' : 'Decline'}
              </Button>
              <Button
                variant="default"
                onClick={handleAcceptInvitation}
                disabled={isLoading}
              >
                {isLoading ? 'Accepting...' : 'Accept'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Add to My Groups - Show when signed in but not from notification */}
      {!isSessionLoading && user && !isFromNotification && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-blue-700">Add this group gift to your collection?</p>
            <Button
              variant="default"
              onClick={handleAddToMyGroups}
              disabled={isLoading}
            >
              {isLoading ? "Adding..." : "Add to My Groups"}
            </Button>
          </div>
        </Card>
      )}

      {/* Group Gift Card */}
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="p-6" style={{ backgroundColor: group.color }}>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{group.title}</h1>
          <p className="text-gray-700 font-medium">{group.occasion}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Key Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{format(new Date(group.date), 'PPP')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p className="font-medium">${group.price.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Participants</p>
                <p className="font-medium">{group.participants.length}</p>
              </div>
            </div>
          </div>

          {/* Product Section */}
          {group.product_url && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center">
                  <Gift className="h-4 w-4 text-pink-500" />
                </div>
                <h3 className="font-medium text-gray-800">Product Details</h3>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center gap-4">
                  {group.product_image_url && (
                    <img
                      src={group.product_image_url}
                      alt=""
                      className="h-16 w-16 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    {group.product_image_url?.includes('google.com/s2/favicons') && (
                      <p className="text-sm text-gray-600 mb-1">
                        From {new URL(group.product_url).hostname.replace('www.', '')}
                      </p>
                    )}
                    <a
                      href={group.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 flex items-center gap-2 font-medium"
                    >
                      View Product Details
                      <Gift className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Comments Section */}
          {group.comments && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-orange-500" />
                </div>
                <h3 className="font-medium text-gray-800">Comments</h3>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-gray-600">{group.comments}</p>
              </div>
            </div>
          )}

          {/* Share Section */}
          <div className="border-t pt-6">
            <h3 className="font-medium text-gray-800 mb-4">Share with others</h3>
            <div className="flex gap-2">
              <FacebookShareButton url={shareUrl} hashtag="#GiftPlanner">
                <FacebookIcon size={32} round />
              </FacebookShareButton>
              <TwitterShareButton url={shareUrl} title={shareTitle}>
                <TwitterIcon size={32} round />
              </TwitterShareButton>
              <WhatsappShareButton url={shareUrl} title={shareTitle}>
                <WhatsappIcon size={32} round />
              </WhatsappShareButton>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
} 