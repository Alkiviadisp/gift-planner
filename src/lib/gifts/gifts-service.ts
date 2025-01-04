import { supabase } from "@/lib/supabase/client"

export interface Gift {
  id: string
  recipient: string
  recipientEmail: string | null
  name: string
  price: number | null
  url: string | null
  image_url: string | null
  isPurchased: boolean
}

export interface GiftRecord {
  id: string
  user_id: string
  category_id: string
  recipient_email: string | null
  recipient: string
  name: string
  description: string | null
  price: number | null
  url: string | null
  image_url: string | null
  is_purchased: boolean
  created_at: string
  updated_at: string
}

export const giftsService = {
  async getGifts(userId: string, categoryId: string): Promise<Gift[]> {
    const { data, error } = await supabase
      .from("gifts")
      .select("*")
      .eq("user_id", userId)
      .eq("category_id", categoryId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Database error in getGifts:", error)
      throw error
    }

    return (data as GiftRecord[]).map((record) => ({
      id: record.id,
      recipient: record.recipient,
      recipientEmail: record.recipient_email,
      name: record.name,
      price: record.price,
      url: record.url,
      image_url: record.image_url,
      isPurchased: record.is_purchased,
    }))
  },

  async lookupRecipientByEmail(email: string): Promise<{ nickname: string } | null> {
    try {
      console.log('Looking up email:', email)

      // Try to find the profile directly
      const { data, error } = await supabase
        .rpc('lookup_user_by_email', {
          lookup_email: email
        })

      console.log('Profile lookup result:', { data, error })

      if (error) {
        console.error('Error looking up profile:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        return null
      }

      return data ? { nickname: data.nickname } : null
    } catch (err: any) {
      console.error('Unexpected error in lookupRecipientByEmail:', {
        name: err?.name || 'Unknown Error',
        message: err?.message || 'No error message available',
        stack: err?.stack || 'No stack trace available'
      })
      return null
    }
  },

  async createGift(
    userId: string,
    categoryId: string,
    gift: {
      recipient: string
      recipientEmail?: string
      name: string
      price?: number
      url?: string
    }
  ): Promise<Gift> {
    // If URL is provided, try to fetch metadata
    let image_url: string | null = null
    if (gift.url) {
      try {
        const response = await fetch(gift.url)
        const html = await response.text()
        
        // Try to find OpenGraph image
        const ogImage = html.match(/<meta property="og:image" content="(.*?)"/)
        if (ogImage && ogImage[1]) {
          image_url = ogImage[1]
        }
        // Fallback to any image in the page
        else {
          const firstImage = html.match(/<img.*?src="(.*?)"/)
          if (firstImage && firstImage[1]) {
            image_url = firstImage[1]
          }
        }
      } catch (error) {
        console.error("Error fetching URL metadata:", error)
      }
    }

    const { data, error } = await supabase
      .from("gifts")
      .insert([
        {
          user_id: userId,
          category_id: categoryId,
          recipient: gift.recipient,
          recipient_email: gift.recipientEmail || null,
          name: gift.name,
          price: gift.price || null,
          url: gift.url || null,
          image_url,
          is_purchased: false,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Database error in createGift:", error)
      throw error
    }

    return {
      id: data.id,
      recipient: data.recipient,
      recipientEmail: data.recipient_email,
      name: data.name,
      price: data.price,
      url: data.url,
      image_url: data.image_url,
      isPurchased: data.is_purchased,
    }
  },

  async updateGift(
    userId: string,
    giftId: string,
    updates: Partial<{
      recipient: string
      recipientEmail: string | null
      name: string
      price: number | null
      url: string | null
      isPurchased: boolean
    }>
  ): Promise<void> {
    console.log("Updating gift with data:", { userId, giftId, updates })
    
    const updateData = {
      ...(updates.recipient !== undefined && { recipient: updates.recipient }),
      ...(updates.recipientEmail !== undefined && { recipient_email: updates.recipientEmail }),
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.price !== undefined && { price: updates.price }),
      ...(updates.url !== undefined && { url: updates.url }),
      ...(updates.isPurchased !== undefined && { is_purchased: updates.isPurchased }),
    }

    const { error } = await supabase
      .from("gifts")
      .update(updateData)
      .eq("user_id", userId)
      .eq("id", giftId)

    if (error) {
      console.error("Database error in updateGift:", error)
      throw error
    }
  },

  async deleteGift(userId: string, giftId: string): Promise<void> {
    const { error } = await supabase
      .from("gifts")
      .delete()
      .eq("user_id", userId)
      .eq("id", giftId)

    if (error) {
      console.error("Database error in deleteGift:", error)
      throw error
    }
  },
} 