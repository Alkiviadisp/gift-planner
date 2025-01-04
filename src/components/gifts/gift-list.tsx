"use client"

import { useState, useEffect } from "react"
import { Plus, ExternalLink, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Gift, giftsService } from "@/lib/gifts/gifts-service"
import { useSupabase } from "@/lib/supabase/provider"

interface GiftListProps {
  categoryId: string
  onGiftChange?: () => void
}

export function GiftList({ categoryId, onGiftChange }: GiftListProps) {
  const [gifts, setGifts] = useState<Gift[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [giftToDelete, setGiftToDelete] = useState<string | null>(null)
  const [showAddGiftDialog, setShowAddGiftDialog] = useState(false)
  const [newGift, setNewGift] = useState({
    recipient: "",
    name: "",
    price: "",
    url: "",
  })
  const { user } = useSupabase()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      loadGifts()
    }
  }, [user, categoryId])

  const loadGifts = async () => {
    try {
      const data = await giftsService.getGifts(user!.id, categoryId)
      setGifts(data)
      onGiftChange?.()
    } catch (error) {
      console.error("Error loading gifts:", error)
      toast({
        title: "Error",
        description: "Failed to load gifts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddGift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGift.recipient.trim() || !newGift.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter both recipient and gift name.",
        variant: "destructive",
      })
      return
    }

    try {
      const gift = await giftsService.createGift(user!.id, categoryId, {
        recipient: newGift.recipient.trim(),
        name: newGift.name.trim(),
        price: newGift.price ? parseFloat(newGift.price) : undefined,
        url: newGift.url.trim() || undefined,
      })
      setGifts((prev) => [...prev, gift])
      setNewGift({ recipient: "", name: "", price: "", url: "" })
      setShowAddGiftDialog(false)
      onGiftChange?.()
      toast({
        title: "Success",
        description: "Gift added successfully!",
      })
    } catch (error) {
      console.error("Error adding gift:", error)
      toast({
        title: "Error",
        description: "Failed to add gift. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleTogglePurchased = async (giftId: string, isPurchased: boolean) => {
    try {
      await giftsService.updateGift(user!.id, giftId, { isPurchased })
      setGifts((prev) =>
        prev.map((gift) =>
          gift.id === giftId ? { ...gift, isPurchased } : gift
        )
      )
      toast({
        title: "Success",
        description: `Gift marked as ${isPurchased ? "purchased" : "not purchased"}`,
      })
    } catch (error: any) {
      console.error("Error updating gift:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to update gift status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteGift = async (giftId: string) => {
    try {
      await giftsService.deleteGift(user!.id, giftId)
      setGifts((prev) => prev.filter((gift) => gift.id !== giftId))
      onGiftChange?.()
      toast({
        title: "Success",
        description: "Gift deleted successfully!",
      })
    } catch (error) {
      console.error("Error deleting gift:", error)
      toast({
        title: "Error",
        description: "Failed to delete gift. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGiftToDelete(null)
    }
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading gifts...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowAddGiftDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Gift
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead>Gift</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Link</TableHead>
              <TableHead className="w-[100px] text-center">Purchased</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gifts.map((gift) => (
              <TableRow key={gift.id}>
                <TableCell>{gift.recipient}</TableCell>
                <TableCell>{gift.name}</TableCell>
                <TableCell>
                  {gift.price ? `$${gift.price.toFixed(2)}` : "-"}
                </TableCell>
                <TableCell>
                  {gift.url && (
                    <div className="flex items-center gap-2">
                      {gift.image_url && (
                        <img
                          src={gift.image_url}
                          alt=""
                          className="h-6 w-6 object-cover rounded"
                        />
                      )}
                      <a
                        href={gift.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                      >
                        <span className="truncate max-w-[200px]">{gift.url}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={gift.isPurchased}
                    onCheckedChange={(checked) => 
                      handleTogglePurchased(gift.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setGiftToDelete(gift.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {gifts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                  No gifts added yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showAddGiftDialog} onOpenChange={setShowAddGiftDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Gift</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddGift} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Name</Label>
              <Input
                id="recipient"
                placeholder="Who is this gift for?"
                value={newGift.recipient}
                onChange={(e) => setNewGift((prev) => ({ ...prev, recipient: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Gift Name</Label>
              <Input
                id="name"
                placeholder="What is the gift?"
                value={newGift.name}
                onChange={(e) => setNewGift((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (optional)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="How much does it cost?"
                value={newGift.price}
                onChange={(e) => setNewGift((prev) => ({ ...prev, price: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Product URL (optional)</Label>
              <Input
                id="url"
                placeholder="Where can it be found online?"
                value={newGift.url}
                onChange={(e) => setNewGift((prev) => ({ ...prev, url: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddGiftDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Gift</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!giftToDelete} onOpenChange={() => setGiftToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Gift</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this gift? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => giftToDelete && handleDeleteGift(giftToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 