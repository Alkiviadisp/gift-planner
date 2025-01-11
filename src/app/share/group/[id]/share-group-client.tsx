'use client'

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, DollarSign, Gift, MessageSquare, Check, X } from "lucide-react"
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
import { participantService } from "@/lib/groups/participant-service"
import type { GiftGroup } from "@/lib/groups/groups-service"
import type { GroupParticipant } from "@/lib/supabase/database.types"
import { useSupabase } from "@/lib/supabase/provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export default function ShareGroupClient({ id }: { id: string }) {
  const supabase = createClientComponentClient()
  const { user, isLoading: isSessionLoading } = useSupabase()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [group, setGroup] = useState<GiftGroup | null>(null)
  const [participants, setParticipants] = useState<GroupParticipant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isNotificationProcessed, setIsNotificationProcessed] = useState(false)
  const isFromNotification = searchParams.get('from') === 'notification'
  const notificationId = searchParams.get('notification_id')

  // Add debug render for session state
  useEffect(() => {
    console.log('Session state:', {
      user: user ? 'Found' : 'Not found',
      isSessionLoading,
      isFromNotification,
      notificationId
    })
  }, [user, isSessionLoading, isFromNotification, notificationId])

  // Initialize session and handle notification
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Session check:', session ? 'Found' : 'Not found')
        
        if (session?.user) {
          console.log('User found:', session.user.email)
          
          // Handle notification if present
          if (isFromNotification && notificationId && !isNotificationProcessed) {
            try {
              const { error: updateError } = await supabase
                .from('mailbox_notifications')
                .update({ status: 'read' })
                .eq('id', notificationId)
                .single()

              if (updateError) {
                console.error('Error marking notification as read:', updateError)
                toast({
                  title: "Warning",
                  description: "Could not mark notification as read",
                  variant: "default",
                })
              } else {
                setIsNotificationProcessed(true)
              }
            } catch (error) {
              console.error('Error processing notification:', error)
            }
          }
        }
      } catch (error) {
        console.error('Error checking session:', error)
        toast({
          title: "Error",
          description: "Failed to check session status",
          variant: "destructive",
        })
      }
    }

    if (!isSessionLoading) {
      initSession()
    }
  }, [supabase, isFromNotification, notificationId, isNotificationProcessed, isSessionLoading, toast])

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
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

        // Convert date string to Date object and ensure consistent time
        const dateValue = new Date(group.date)
        dateValue.setHours(12, 0, 0, 0)
        
        const groupWithDate = {
          ...group,
          date: dateValue
        }

        setGroup(groupWithDate)
      } catch (error) {
        console.error('Unexpected error:', error)
        setError(`An unexpected error occurred: ${error}`)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      loadData()
    }
  }, [id, supabase])

  // Load participants data
  useEffect(() => {
    const loadParticipants = async () => {
      if (!id) return;
      try {
        const participants = await participantService.getGroupParticipants(id);
        setParticipants(participants);
      } catch (error) {
        console.error('Error loading participants:', error);
      }
    };

    loadParticipants();
  }, [id]);

  const handleAgree = async () => {
    if (!user || !group) return;
    setIsLoading(true);
    try {
      await participantService.updateParticipantStatus(group.id, user.email!, 'agreed');
      const updatedParticipants = await participantService.getGroupParticipants(group.id);
      setParticipants(updatedParticipants);
      toast({
        title: "Success!",
        description: "You have agreed to contribute to this group gift",
      });
    } catch (error) {
      console.error('Error agreeing to contribute:', error);
      toast({
        title: "Error",
        description: "Failed to update your contribution status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!user || !group) return;
    setIsLoading(true);
    try {
      await participantService.updateParticipantStatus(group.id, user.email!, 'declined');
      const updatedParticipants = await participantService.getGroupParticipants(group.id);
      setParticipants(updatedParticipants);
      toast({
        title: "Success!",
        description: "You have declined to contribute to this group gift",
      });
    } catch (error) {
      console.error('Error declining to contribute:', error);
      toast({
        title: "Error",
        description: "Failed to update your contribution status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToMyGroups = async () => {
    if (!user) {
      console.log('No user found in handleAddToMyGroups')
      const currentUrl = window.location.href
      localStorage.setItem('redirectAfterLogin', currentUrl)
      router.push('/login')
      return
    }

    setIsLoading(true)
    try {
      if (!group) return;

      console.log('Adding group to my groups:', {
        groupId: group.id,
        userId: group.user_id
      });

      // Get all current participants and their statuses
      const currentParticipants = await participantService.getGroupParticipants(group.id);
      
      // Use the current user's email as creator
      console.log('Using current user email:', user.email);
      if (!user.email) {
        throw new Error('User email not found');
      }
      
      // Create a copy of the group for the current user
      const updatedGroup = {
        name: group.title,
        description: group.occasion,
        amount: group.price,
        currency: 'EUR',
        imageUrl: group.product_image_url || null,
        date: group.date,
        // Include all participants with their statuses
        participants: [
          // Add current user as creator and agreed
          { email: user.email, participation_status: 'agreed' },
          // Add other participants with their current statuses
          ...currentParticipants
            .filter(p => p.email !== user.email) // Exclude creator as we already added them
            .map(p => ({
              email: p.email,
              participation_status: p.participation_status
            }))
        ]
      }

      console.log('Creating new group with data:', updatedGroup);

      await groupsService.createGroup(updatedGroup)
      
      toast({
        title: "Success!",
        description: "Group gift has been added to your collection. You can now accept or decline using the icons in the card.",
      })

      // Navigate to groups page
      router.push('/groups')
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

  // Calculate total contributions and progress
  const totalContributions = participants
    .filter(p => p.participation_status === 'agreed')
    .reduce((sum, p) => sum + (p.contribution_amount || 0), 0);
  const progress = group ? (totalContributions / group.price) * 100 : 0;

  // Get current user's participant status
  const userParticipant = user ? participants.find(p => p.email === user.email) : null;

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
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="font-medium">${group.price.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Participants</p>
                <div>
                  <p className="font-medium">{participants.length} total</p>
                  <p className="text-xs text-gray-500">
                    {participants.filter(p => p.participation_status === 'agreed').length} agreed
                    {participants.filter(p => p.participation_status === 'declined').length > 0 && 
                      ` • ${participants.filter(p => p.participation_status === 'declined').length} declined`}
                  </p>
                </div>
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
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <a
                      href={group.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      View Product
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contributions Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-500" />
              </div>
              <h3 className="font-medium text-gray-800">Contributions</h3>
            </div>
            
            {/* Progress bar */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Progress</span>
                <span className="font-medium">${totalContributions.toFixed(2)} of ${group.price.toFixed(2)}</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-500 mt-1">
                {progress < 100 
                  ? `${(100 - progress).toFixed(1)}% remaining to reach the goal`
                  : 'Goal reached! 🎉'}
              </p>
            </div>

            {/* Participant list */}
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Participant Contributions</h4>
                <div className="space-y-3">
                  {participants.map((participant) => {
                    const isCurrentUser = user?.email === participant.email;
                    return (
                      <div 
                        key={participant.id} 
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          isCurrentUser ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
                        )}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {participant.email}
                              {isCurrentUser && <span className="text-sm text-blue-600 ml-2">(You)</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn(
                              "text-sm px-2 py-0.5 rounded-full",
                              participant.participation_status === 'agreed' && "bg-green-100 text-green-700",
                              participant.participation_status === 'declined' && "bg-red-100 text-red-700",
                              participant.participation_status === 'pending' && "bg-yellow-100 text-yellow-700"
                            )}>
                              {participant.participation_status === 'agreed' && "Agreed"}
                              {participant.participation_status === 'declined' && "Declined"}
                              {participant.participation_status === 'pending' && "Pending"}
                            </span>
                            {participant.participation_status === 'agreed' && (
                              <span className="text-sm text-gray-500">
                                Contributing: ${participant.contribution_amount.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

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