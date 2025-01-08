"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, ExternalLink, Edit, Copy, Share2 } from "lucide-react"
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

interface GroupCardProps {
  group: GiftGroup
  onDelete: () => void
  onUpdateGroup: (groupId: string, group: Omit<GiftGroup, "id" | "user_id" | "created_at" | "updated_at">) => void
}

export function GroupCard({ group, onDelete, onUpdateGroup }: GroupCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const { toast } = useToast()

  const daysUntil = differenceInDays(group.date, new Date())
  const daysText = daysUntil === 0 
    ? "Today!" 
    : daysUntil === 1 
    ? "Tomorrow" 
    : daysUntil < 0
    ? "Past event"
    : `${daysUntil} days left`

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

  return (
    <>
      <Card 
        className={cn(
          "hover:shadow-md transition-shadow group relative overflow-hidden",
          "hover:translate-y-[-2px] transition-all duration-200"
        )}
        style={{ backgroundColor: group.color }}
      >
        <CardHeader className="relative">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl text-gray-800">{group.title}</CardTitle>
              <div className="space-y-1 mt-2">
                <p className="text-sm text-gray-600">
                  {group.occasion}
                </p>
                <p className="text-sm text-gray-600">
                  {daysText}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {group.participants.length} participant{group.participants.length !== 1 ? 's' : ''}
                </div>
                <p className="text-sm text-gray-600">
                  ${group.price.toFixed(2)}
                </p>
                {group.product_url && (
                  <div className="flex flex-col gap-1">
                    {group.product_image_url && (
                      <div className="flex items-center gap-2">
                        <img
                          src={group.product_image_url}
                          alt=""
                          className="h-6 w-6 object-cover rounded"
                        />
                        {group.product_image_url.includes('google.com/s2/favicons') && (
                          <span className="text-sm text-gray-600">
                            {new URL(group.product_url).hostname.replace('www.', '')}
                          </span>
                        )}
                      </div>
                    )}
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
                {group.comments && (
                  <p className="text-sm text-gray-600 italic">
                    {group.comments}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
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
        onUpdateGroup={onUpdateGroup}
      />
    </>
  )
} 