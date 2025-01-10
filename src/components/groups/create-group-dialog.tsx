"use client"

import { useState } from "react"
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
import { PASTEL_COLORS } from "@/lib/categories/categories-service"
import { cn } from "@/lib/utils"

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateGroup: (group: Omit<GiftGroup, "id" | "user_id" | "created_at" | "updated_at">) => void
}

const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i)
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

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
      const skuMatch = url.match(/\/(\d{7}\.p)/);
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

const getRandomPastelColor = (): string => {
  const randomIndex = Math.floor(Math.random() * PASTEL_COLORS.length)
  return PASTEL_COLORS[randomIndex]!
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  onCreateGroup,
}: CreateGroupDialogProps) {
  const [title, setTitle] = useState("")
  const [occasion, setOccasion] = useState("")
  const [date, setDate] = useState<Date | null>(null)
  const [price, setPrice] = useState("")
  const [productUrl, setProductUrl] = useState("")
  const [productImageUrl, setProductImageUrl] = useState<string>("")
  const [comments, setComments] = useState("")
  const [currentParticipant, setCurrentParticipant] = useState("")
  const [participants, setParticipants] = useState<string[]>([])
  const [isValidEmail, setIsValidEmail] = useState(true)
  const { toast } = useToast()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleProductUrlChange = (url: string) => {
    setProductUrl(url);
    if (!url.trim()) {
      setProductImageUrl("");
    }
  };

  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch (err) {
      return false;
    }
  };

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
      setParticipants((prev) => [...prev, email])
    }
    setCurrentParticipant("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddParticipant()
    }
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

    // Validate URL if provided
    let finalImageUrl = productImageUrl;
    if (productUrl.trim()) {
      if (!isValidUrl(productUrl.trim())) {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid URL starting with http:// or https://",
          variant: "default",
        })
        return
      }

      // Only try to get product image if URL is valid
      try {
        finalImageUrl = getDefaultProductImage(productUrl.trim());
      } catch (error) {
        finalImageUrl = "";
      }
    }

    const newGroup: Omit<GiftGroup, "id" | "user_id" | "created_at" | "updated_at"> = {
      title: title.trim(),
      occasion: occasion.trim(),
      date,
      price: Number(price),
      product_url: productUrl.trim() || undefined,
      product_image_url: finalImageUrl || undefined,
      comments: comments.trim() || undefined,
      participants,
      color: getRandomPastelColor(),
    }

    try {
      onCreateGroup(newGroup)
      setTitle("")
      setOccasion("")
      setDate(null)
      setPrice("")
      setProductUrl("")
      setProductImageUrl("")
      setComments("")
      setParticipants([])
      setCurrentParticipant("")
      onOpenChange(false)
    } catch (error) {
      console.error('Error in create group dialog:', error)
      toast({
        title: "Error",
        description: "Failed to create Group Gift. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle>Create Group Gift</DialogTitle>
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
                  onChange={(date) => setDate(date)}
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
            <Label>Participants (Email Addresses)</Label>
            <div className="flex gap-2">
              <Input
                value={currentParticipant}
                onChange={(e) => {
                  setCurrentParticipant(e.target.value)
                  setIsValidEmail(true)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter email address"
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
            <Button type="submit">Create Group Gift</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 