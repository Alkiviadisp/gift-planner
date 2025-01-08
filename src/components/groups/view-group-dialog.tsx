import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { GiftGroup } from "@/lib/groups/groups-service"
import { format } from "date-fns"
import { ExternalLink, Calendar, Users, DollarSign, Gift, MessageSquare, Copy, Facebook, Twitter, Instagram, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { 
  FacebookShareButton, 
  TwitterShareButton, 
  RedditShareButton,
  RedditIcon
} from "react-share"

interface ViewGroupDialogProps {
  group: GiftGroup
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewGroupDialog({ group, open, onOpenChange }: ViewGroupDialogProps) {
  const { toast } = useToast()

  const handleCopyLink = async () => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogTitle className="sr-only">{group.title}</DialogTitle>
        <button 
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-50 w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all hover:scale-105"
        >
          <X className="h-6 w-6 text-black" />
          <span className="sr-only">Close</span>
        </button>
        <div 
          className="rounded-xl shadow-lg relative overflow-hidden bg-white"
        >
          {/* Background Decorative Icons */}
          <div className="absolute inset-0 pointer-events-none">
            <Gift className="absolute top-[10%] left-[15%] h-12 w-12 text-black/5 transform -rotate-12" />
            <Gift className="absolute top-[20%] right-[10%] h-16 w-16 text-black/5 transform rotate-12" />
            <Gift className="absolute bottom-[15%] left-[20%] h-14 w-14 text-black/5 transform rotate-45" />
            <Gift className="absolute bottom-[25%] right-[25%] h-10 w-10 text-black/5 transform -rotate-12" />
            <Gift className="absolute top-[40%] left-[80%] h-12 w-12 text-black/5 transform rotate-180" />
            <Gift className="absolute top-[60%] left-[40%] h-16 w-16 text-black/5 transform -rotate-45" />
            <Gift className="absolute bottom-[40%] left-[10%] h-10 w-10 text-black/5 transform rotate-90" />
            <Gift className="absolute top-[80%] right-[15%] h-14 w-14 text-black/5 transform rotate-12" />
          </div>

          <div className="min-h-[600px] p-8 flex flex-col relative z-10 space-y-8">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-4xl font-bold text-black mb-3 tracking-tight">
                {group.title}
              </h2>
              <p className="text-black/70 text-xl font-medium">{group.occasion}</p>
            </div>

            {/* Product Section */}
            {group.product_url && (
              <div className="bg-black/5 backdrop-blur-sm rounded-2xl p-6">
                <div className="flex items-center gap-6">
                  {group.product_image_url && (
                    <img
                      src={group.product_image_url}
                      alt=""
                      className="h-24 w-24 object-cover rounded-xl shadow-lg"
                    />
                  )}
                  <div>
                    {group.product_image_url?.includes('google.com/s2/favicons') && (
                      <p className="text-black/70 text-lg mb-2">
                        From {new URL(group.product_url).hostname.replace('www.', '')}
                      </p>
                    )}
                    <a
                      href={group.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-black font-medium text-lg hover:opacity-70 transition-opacity"
                    >
                      View Product
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-black/5 backdrop-blur-sm rounded-2xl p-5">
                <div className="flex flex-col items-center text-center gap-2">
                  <Calendar className="h-8 w-8 text-black mb-1" />
                  <div>
                    <p className="text-black/70 text-sm font-medium mb-1">Date</p>
                    <p className="text-black font-semibold text-lg">{format(group.date, 'PPP')}</p>
                  </div>
                </div>
              </div>
              <div className="bg-black/5 backdrop-blur-sm rounded-2xl p-5">
                <div className="flex flex-col items-center text-center gap-2">
                  <DollarSign className="h-8 w-8 text-black mb-1" />
                  <div>
                    <p className="text-black/70 text-sm font-medium mb-1">Price</p>
                    <p className="text-black font-semibold text-lg">${group.price.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-black/5 backdrop-blur-sm rounded-2xl p-5">
                <div className="flex flex-col items-center text-center gap-2">
                  <Users className="h-8 w-8 text-black mb-1" />
                  <div>
                    <p className="text-black/70 text-sm font-medium mb-1">Participants</p>
                    <p className="text-black font-semibold text-lg">{group.participants.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            {group.comments && (
              <div className="bg-black/5 backdrop-blur-sm rounded-2xl p-6">
                <p className="text-black text-lg leading-relaxed">{group.comments}</p>
              </div>
            )}

            {/* Share Section */}
            <div className="mt-auto pt-4">
              <div className="flex items-center justify-between gap-6 bg-black/5 backdrop-blur-sm rounded-2xl p-6">
                <div className="flex gap-3">
                  <FacebookShareButton url={shareUrl} hashtag="#GiftPlanner">
                    <div className="w-11 h-11 rounded-xl bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all hover:scale-105">
                      <Facebook className="h-5 w-5 text-black" />
                    </div>
                  </FacebookShareButton>
                  <TwitterShareButton url={shareUrl} title={shareTitle}>
                    <div className="w-11 h-11 rounded-xl bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all hover:scale-105">
                      <Twitter className="h-5 w-5 text-black" />
                    </div>
                  </TwitterShareButton>
                  <RedditShareButton url={shareUrl} title={shareTitle}>
                    <div className="w-11 h-11 rounded-xl bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all hover:scale-105">
                      <RedditIcon size={20} round className="text-black" />
                    </div>
                  </RedditShareButton>
                  <a 
                    href={`https://instagram.com/share?url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-xl bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all hover:scale-105"
                  >
                    <Instagram className="h-5 w-5 text-black" />
                  </a>
                </div>
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-black/5 hover:bg-black/10 text-black border-0 rounded-xl h-11 px-6 transition-all hover:scale-105"
                  onClick={handleCopyLink}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 




