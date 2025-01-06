import { supabase } from "@/lib/supabase/client"

export interface GiftGroup {
  id: string
  user_id: string
  title: string
  occasion: string
  date: Date
  price: number
  product_url?: string
  product_image_url?: string
  comments?: string
  participants: string[]
  created_at: string
  updated_at: string
}

export const groupsService = {
  async getGroups(userId: string): Promise<GiftGroup[]> {
    const { data, error } = await supabase
      .from("gift_groups")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Database error in getGroups:", error)
      throw error
    }

    return data.map((group: any) => ({
      ...group,
      date: new Date(group.date),
      participants: group.participants || []
    }))
  },

  async createGroup(
    userId: string,
    group: Omit<GiftGroup, "id" | "user_id" | "created_at" | "updated_at">
  ): Promise<GiftGroup> {
    const { data, error } = await supabase
      .from("gift_groups")
      .insert([
        {
          user_id: userId,
          title: group.title,
          occasion: group.occasion,
          date: group.date.toISOString(),
          price: group.price,
          product_url: group.product_url,
          product_image_url: group.product_image_url,
          comments: group.comments,
          participants: group.participants,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Database error in createGroup:", error)
      throw error
    }

    return {
      ...data,
      date: new Date(data.date),
      participants: data.participants || []
    }
  },

  async deleteGroup(groupId: string): Promise<void> {
    const { error } = await supabase
      .from("gift_groups")
      .delete()
      .eq("id", groupId)

    if (error) {
      console.error("Database error in deleteGroup:", error)
      throw error
    }
  }
} 