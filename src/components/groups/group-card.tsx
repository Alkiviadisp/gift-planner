"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, ExternalLink, Edit, Copy, Share2, Check, X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { differenceInDays } from "date-fns"
import type { GiftGroup } from "@/lib/groups/groups-service"
import { cn } from "@/lib/utils"
import { EditGroupDialog } from "./edit-group-dialog"
import { useToast } from "@/components/ui/use-toast"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  FacebookShareButton, 
  TwitterShareButton, 
  RedditShareButton,
  RedditIcon,
} from "react-share"
import { Facebook, Twitter, Instagram } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { participantService } from "@/lib/groups/participant-service"
import { useSupabase } from "@/lib/supabase/provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface GroupCardProps {
  group: GiftGroup
  onDelete: () => void
  onUpdateGroup: (groupId: string, group: Omit<GiftGroup, "id" | "user_id" | "created_at" | "updated_at">) => void
}

export function GroupCard({ group, onDelete, onUpdateGroup }: GroupCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const { toast } = useToast()
  const [participants, setParticipants] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useSupabase()
  const supabase = createClientComponentClient()

  useEffect(() => {
    let isMounted = true;
    let isDeleted = false;

    const loadParticipants = async () => {
      // Don't try to load if we already know the group is deleted
      if (isDeleted) return;

      try {
        // First check if the group still exists
        const { data: groupExists, error: groupError } = await supabase
          .from('gift_groups')
          .select('id')
          .eq('id', group.id)
          .single();

        // Handle case where group doesn't exist (including after deletion)
        if (groupError?.code === 'PGRST116' || groupError?.code === '406') {
          if (isMounted) {
            isDeleted = true;
            onDelete();
          }
          return;
        }

        // Handle other errors
        if (groupError) {
          throw groupError;
        }

        // Handle case where query succeeded but no group was found
        if (!groupExists && isMounted) {
          isDeleted = true;
          onDelete();
          return;
        }

        // If we get here, group exists, so load participants
        const participants = await participantService.getGroupParticipants(group.id);
        if (isMounted && !isDeleted) {
          setParticipants(participants);
        }
      } catch (error) {
        // Only log errors that aren't related to group not existing
        const isPostgrestError = (err: unknown): err is { code: string } => {
          return typeof err === 'object' && err !== null && 'code' in err;
        };
        
        if (!isPostgrestError(error) || (error.code !== 'PGRST116' && error.code !== '406')) {
          console.error('Error loading participants:', error);
        }
        // Only set participants to empty if the group still exists and component is mounted
        if (isMounted && !isDeleted) {
          setParticipants([]);
        }
      }
    };

    loadParticipants();

    // Only set up subscription if group isn't deleted
    let channel: ReturnType<typeof supabase.channel> | undefined;
    if (!isDeleted) {
      channel = supabase
        .channel(`group_${group.id}_participants`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'group_participants',
            filter: `group_id=eq.${group.id}`
          },
          async () => {
            // Only reload if not deleted and still mounted
            if (isMounted && !isDeleted) {
              await loadParticipants();
            }
          }
        )
        .subscribe();
    }

    // Cleanup subscription and prevent state updates on unmounted component
    return () => {
      isMounted = false;
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [group.id, supabase, onDelete]);

  const daysUntil = differenceInDays(group.date, new Date())
  const daysText = daysUntil === 0 
    ? "Today!" 
    : daysUntil === 1 
    ? "Tomorrow" 
    : daysUntil < 0
    ? "Past event"
    : `${daysUntil} days left`

  // Calculate total contributions and progress
  const totalContributions = participants
    .filter(p => p.participation_status === 'agreed')
    .reduce((sum, p) => sum + (p.contribution_amount || 0), 0);
  const progress = (totalContributions / group.price) * 100;

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const shareUrl = `${window.location.origin}/share/group/${group.id}`
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: "Link copied!",
        description: "Share link has been copied to your clipboard",
      })
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast({
        title: "Error",
        description: "Failed to copy share link. Please try again.",
        variant: "destructive",
      })
    }
  }

  const shareUrl = `${window.location.origin}/share/group/${group.id}`
  const shareTitle = `Check out this group gift: ${group.title}`

  const handleAgree = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
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

  const handleDecline = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
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

  // Get current user's participant status
  const userParticipant = user ? participants.find(p => p.email === user.email) : null;

  return (
    <>
      <Card 
        className={cn(
          "relative overflow-hidden"
        )}
        style={{ backgroundColor: group.color }}
      >
        <CardHeader className="relative">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <CardTitle className="text-xl text-gray-800">{group.title}</CardTitle>
                <div className="flex gap-2">
                  {/* Show accept/decline icons only if user is a pending participant */}
                  {userParticipant && userParticipant.participation_status === 'pending' && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleAgree}
                        disabled={isLoading}
                        className="hover:bg-green-100"
                        aria-label="Accept invitation"
                      >
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDecline}
                        disabled={isLoading}
                        className="hover:bg-red-100"
                        aria-label="Decline invitation"
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </>
                  )}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                        className="hover:bg-blue-100"
                        aria-label="Share group"
                      >
                        <Share2 className="h-4 w-4 text-blue-500" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto p-2" 
                      onClick={(e) => e.stopPropagation()}
                      align="end"
                    >
                      <div className="flex gap-2">
                        <FacebookShareButton url={shareUrl} hashtag="#GiftPlanner">
                          <div className="w-8 h-8 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all hover:scale-105">
                            <Facebook className="h-4 w-4 text-black" />
                          </div>
                        </FacebookShareButton>
                        <TwitterShareButton url={shareUrl} title={shareTitle}>
                          <div className="w-8 h-8 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all hover:scale-105">
                            <Twitter className="h-4 w-4 text-black" />
                          </div>
                        </TwitterShareButton>
                        <RedditShareButton url={shareUrl} title={shareTitle}>
                          <div className="w-8 h-8 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all hover:scale-105">
                            <RedditIcon size={16} round className="text-black" />
                          </div>
                        </RedditShareButton>
                        <a 
                          href={`https://instagram.com/share?url=${encodeURIComponent(shareUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all hover:scale-105"
                        >
                          <Instagram className="h-4 w-4 text-black" />
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all hover:scale-105 p-0"
                          onClick={handleCopyLink}
                        >
                          <Copy className="h-4 w-4 text-black" />
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEditDialog(true);
                    }}
                    className="hover:bg-blue-100"
                    aria-label="Edit group"
                  >
                    <Edit className="h-4 w-4 text-blue-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                    className="hover:bg-red-100"
                    aria-label="Delete group"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Left Column */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">{group.occasion}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{daysText}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {participants.length} participant{participants.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-2">
                  {/* Show accept/decline buttons if current user is a pending participant */}
                  {userParticipant && userParticipant.participation_status === 'pending' && (
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDecline(e);
                        }}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAgree(e);
                        }}
                        disabled={isLoading}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-sm font-medium text-gray-600">
                      ${group.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-sm text-gray-600">
                      {participants.filter(p => p.participation_status === 'agreed').length} agreed
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              {group.product_url && (
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    {group.product_image_url && (
                      <img
                        src={group.product_image_url}
                        alt=""
                        className="h-8 w-8 object-cover rounded"
                      />
                    )}
                    {group.product_image_url?.includes('google.com/s2/favicons') && (
                      <span className="text-sm text-gray-600">
                        {new URL(group.product_url).hostname.replace('www.', '')}
                      </span>
                    )}
                  </div>
                  <a
                    href={group.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>View Product</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {/* Progress Section */}
              <div className="rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">Progress</span>
                  <span className="font-medium">${totalContributions.toFixed(2)} of ${group.price.toFixed(2)}</span>
                </div>
                <Progress value={progress} className="h-2 bg-transparent" />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-600">
                    {progress < 100 
                      ? `${(100 - progress).toFixed(1)}% remaining`
                      : <span className="text-green-600 font-medium">Goal reached! 🎉</span>}
                  </p>
                </div>
              </div>

              {/* Comments Section */}
              {group.comments && (
                <div className="mt-3 bg-white/50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 italic">
                    {group.comments}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the group gift.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete();
                setShowDeleteDialog(false);
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditGroupDialog
        group={group}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onUpdateGroup={(groupId: string, updates) => {
          onUpdateGroup(groupId, {
            ...updates,
            title: updates.name,
            occasion: updates.description,
            price: updates.amount,
            color: group.color
          });
        }}
      />
    </>
  )
} 