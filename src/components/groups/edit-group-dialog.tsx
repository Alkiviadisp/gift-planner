"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { ChevronLeft, ChevronRight, Plus, X, ExternalLink } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import type { GiftGroup } from "@/lib/groups/groups-service"
import { cn } from "@/lib/utils"
import { GroupParticipant, ParticipantStatus } from "@/lib/supabase/database.types"

const getDefaultProductImage = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname.toLowerCase();

    // Amazon product image patterns
    if (domain.includes('amazon.')) {
      const dpMatch = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
      const productId = dpMatch?.[1];
      if (productId) {
        return `https://images-na.ssl-images-amazon.com/images/P/${productId}.jpg`;
      }
      
      const imgMatch = url.match(/\/images\/I\/([A-Za-z0-9%-._]+\.(?:jpg|jpeg|png|gif))/i);
      const imageId = imgMatch?.[1];
      if (imageId) {
        return `https://images-na.ssl-images-amazon.com/images/I/${imageId}`;
      }
    }

    // Walmart patterns
    if (domain.includes('walmart.')) {
      const ipMatch = url.match(/\/ip\/([^\/]+)/);
      const ipId = ipMatch?.[1];
      if (ipId) {
        return `https://i5.walmartimages.com/asr/${ipId}.jpg`;
      }
      
      const imgMatch = url.match(/\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
      const imgId = imgMatch?.[1];
      if (imgId) {
        return `https://i5.walmartimages.com/asr/${imgId}.jpg`;
      }
    }

    // Target patterns
    if (domain.includes('target.')) {
      const dpMatch = url.match(/\/A-(\d+)/);
      const productId = dpMatch?.[1];
      if (productId) {
        return `https://target.scene7.com/is/image/Target/${productId}`;
      }
    }

    // Best Buy patterns
    if (domain.includes('bestbuy.')) {
      const skuMatch = url.match(/\/(\d+)\.p/);
      const skuId = skuMatch?.[1];
      if (skuId) {
        return `https://pisces.bbystatic.com/image2/BestBuy_US/images/products/${skuId.slice(0, 4)}/${skuId.replace('.p', '_sd.jpg')}`;
      }
    }

    // If no product image pattern matches, try to get a high-quality favicon
    return getFaviconUrl(parsedUrl.hostname);
  } catch (error) {
    console.error('Error extracting product image:', error);
    return getFaviconUrl(new URL(url).hostname);
  }
};

const getFaviconUrl = (hostname: string): string => {
  return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
};

interface EditGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateGroup: (groupId: string, group: { 
    name: string
    description: string
    amount: number
    currency: string
    date: Date
    participants: string[]
    image_url?: string
  }) => void
  group: GiftGroup & {
    participants: Array<string | GroupParticipant>
  }
}

const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i)
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export function EditGroupDialog({
  open,
  onOpenChange,
  onUpdateGroup,
  group,
}: EditGroupDialogProps) {
  const [title, setTitle] = useState(group.title)
  const [occasion, setOccasion] = useState(group.occasion)
  const [date, setDate] = useState<Date>(() => {
    // Ensure we have a valid date object
    const dateValue = group.date instanceof Date ? group.date : new Date(group.date)
    // Set time to noon to avoid timezone issues
    dateValue.setHours(12, 0, 0, 0)
    return dateValue
  })
  const [price, setPrice] = useState(group.price.toString())
  const [productUrl, setProductUrl] = useState(group.product_url || "")
  const [productImageUrl, setProductImageUrl] = useState<string>(group.product_image_url || "")
  const [comments, setComments] = useState(group.comments || "")
  const [currentParticipant, setCurrentParticipant] = useState("")
  const [participants, setParticipants] = useState<string[]>(() => {
    return group.participants.map((p: string | GroupParticipant) => {
      if (typeof p === 'string') return p;
      if ('email' in p) return p.email;
      throw new Error('Invalid participant type');
    });
  });
  const [isValidEmail, setIsValidEmail] = useState(true)
  const { toast } = useToast()

  // Update state when group prop changes
  useEffect(() => {
    setTitle(group.title)
    setOccasion(group.occasion)
    const dateValue = group.date instanceof Date ? group.date : new Date(group.date)
    dateValue.setHours(12, 0, 0, 0)
    setDate(dateValue)
    setPrice(group.price.toString())
    setProductUrl(group.product_url || "")
    setProductImageUrl(group.product_image_url || "")
    setComments(group.comments || "")
    setParticipants(group.participants.map((p: string | GroupParticipant) => {
      if (typeof p === 'string') return p;
      if ('email' in p) return p.email;
      throw new Error('Invalid participant type');
    }));
  }, [group])

  const handleProductUrlChange = (url: string) => {
    setProductUrl(url);
    if (url.trim()) {
      try {
        const imageUrl = getDefaultProductImage(url);
        setProductImageUrl(imageUrl);
      } catch (error) {
        console.error('Error processing URL:', error);
        setProductImageUrl("");
      }
    } else {
      setProductImageUrl("");
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleAddParticipant = () => {
    const email = currentParticipant.trim()
    if (!email) return

    if (!validateEmail(email)) {
      setIsValidEmail(false)
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    setIsValidEmail(true)
    if (!participants.includes(email)) {
      setParticipants([...participants, email])
    }
    setCurrentParticipant("")
  }

  const handleRemoveParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for the Group Gift",
        variant: "destructive",
      })
      return
    }

    if (!occasion.trim()) {
      toast({
        title: "Error",
        description: "Please enter an occasion for the Group Gift",
        variant: "destructive",
      })
      return
    }

    if (!date) {
      toast({
        title: "Error",
        description: "Please select a date for the Group Gift",
        variant: "destructive",
      })
      return
    }

    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price for the Group Gift",
        variant: "destructive",
      })
      return
    }

    if (participants.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one participant to the Group Gift",
        variant: "destructive",
      })
      return
    }

    const updatedGroup = {
      name: title.trim(),
      description: occasion.trim(),
      amount: Number(price),
      currency: group.currency || 'EUR',
      image_url: productImageUrl || undefined,
      date: new Date(date.setHours(12, 0, 0, 0)),
      participants
    }

    try {
      onUpdateGroup(group.id, updatedGroup)
      onOpenChange(false)
    } catch (error) {
      console.error('Error in edit group dialog:', error)
      toast({
        title: "Error",
        description: "Failed to update gift group. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle>Edit Group Gift</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., New Gaming Console"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="occasion">Occasion</Label>
              <Input
                id="occasion"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="e.g., Birthday"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <div className="relative">
                <DatePicker
                  selected={date}
                  onChange={(date) => setDate(date || new Date())}
                  dateFormat="MMM d, yyyy"
                  placeholderText="Select date"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  wrapperClassName="w-full"
                  showPopperArrow={false}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  renderCustomHeader={({
                    date,
                    changeYear,
                    changeMonth,
                    decreaseMonth,
                    increaseMonth,
                    prevMonthButtonDisabled,
                    nextMonthButtonDisabled,
                  }) => (
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <button
                        onClick={decreaseMonth}
                        disabled={prevMonthButtonDisabled}
                        type="button"
                        className="p-1 hover:bg-accent rounded-md disabled:opacity-50"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </button>

                      <div className="flex gap-1.5">
                        <select
                          value={date.getFullYear()}
                          onChange={({ target: { value } }) =>
                            changeYear(Number(value))
                          }
                          className="bg-background border border-input rounded-md text-xs px-1.5 py-0.5"
                        >
                          {years.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>

                        <select
                          value={months[date.getMonth()]}
                          onChange={({ target: { value } }) =>
                            changeMonth(months.indexOf(value))
                          }
                          className="bg-background border border-input rounded-md text-xs px-1.5 py-0.5"
                        >
                          {months.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={increaseMonth}
                        disabled={nextMonthButtonDisabled}
                        type="button"
                        className="p-1 hover:bg-accent rounded-md disabled:opacity-50"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="productUrl">Product URL (Optional)</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  id="productUrl"
                  type="url"
                  value={productUrl}
                  onChange={(e) => handleProductUrlChange(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              {productImageUrl && (
                <div className="flex items-center gap-2 rounded-md border px-2 py-1">
                  <img
                    src={productImageUrl}
                    alt=""
                    className="h-6 w-6 object-cover rounded"
                  />
                  <a
                    href={productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="comments">Comments (Optional)</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComments(e.target.value)}
              placeholder="Add any additional notes..."
              className="resize-none min-h-[60px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="participants">Participants (Email Addresses)</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Notifications will only be sent to registered users. Non-registered users will need to sign up to receive notifications.
            </p>
            <div className="flex gap-2">
              <Input
                id="participants"
                value={currentParticipant}
                onChange={(e) => {
                  setCurrentParticipant(e.target.value)
                  setIsValidEmail(true)
                }}
                placeholder="Enter email address"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddParticipant()
                  }
                }}
                className={cn(
                  "flex-1",
                  !isValidEmail && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              <Button
                type="button"
                onClick={handleAddParticipant}
                variant="secondary"
              >
                Add
              </Button>
            </div>
            {!isValidEmail && (
              <p className="text-sm text-red-500">Please enter a valid email address</p>
            )}
            {participants.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto">
                {participants.map((participant, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2 py-1 text-sm"
                  >
                    {participant}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 -mr-1"
                      onClick={() => handleRemoveParticipant(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit">Update Group Gift</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 