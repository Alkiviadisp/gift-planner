import { supabase } from "@/lib/supabase/client"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

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
  color: string
  created_at: string
  updated_at: string
}

export async function copySharedGroup(groupId: string, userId: string) {
  const supabase = createClientComponentClient()

  try {
    console.log('Copying group:', { groupId, userId })

    // First get the group
    const { data: group, error: getError } = await supabase
      .from('gift_groups')
      .select('*')
      .eq('id', groupId)
      .single()

    if (getError) {
      console.error('Error fetching group:', getError)
      throw new Error(`Failed to get group: ${getError.message}`)
    }

    if (!group) {
      throw new Error('Group not found')
    }

    console.log('Found group:', group)

    // Create a new group for the user with a new Supabase client
    const newSupabase = createClientComponentClient()
    const { data: newGroup, error: insertError } = await newSupabase
      .from('gift_groups')
      .insert({
        title: group.title,
        occasion: group.occasion,
        date: new Date(group.date).toISOString(),
        price: group.price,
        product_url: group.product_url,
        product_image_url: group.product_image_url,
        comments: group.comments,
        participants: group.participants || [],
        color: group.color,
        user_id: userId
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting new group:', insertError)
      throw new Error(`Failed to copy group: ${insertError.message}`)
    }

    console.log('Created new group:', newGroup)
    return {
      ...newGroup,
      date: new Date(newGroup.date),
      participants: newGroup.participants || []
    }
  } catch (error) {
    console.error('Error in copySharedGroup:', error)
    throw error
  }
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
    // Generate a random pastel color
    const generatePastelColor = () => {
      const hue = Math.floor(Math.random() * 360);
      const saturation = 70 + Math.random() * 10; // 70-80%
      const lightness = 85 + Math.random() * 10; // 85-95%
      
      // Convert HSL to Hex
      const h = hue / 360;
      const s = saturation / 100;
      const l = lightness / 100;

      const a = s * Math.min(l, 1 - l);
      const f = (n: number) => {
        const k = (n + h * 12) % 12;
        return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      };
      
      const toHex = (x: number) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };

      const r = toHex(f(0));
      const g = toHex(f(8));
      const b = toHex(f(4));

      return `#${r}${g}${b}`;
    };

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
          color: group.color || generatePastelColor(), // Use provided color or generate one
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
  },

  async updateGroup(
    groupId: string,
    group: Omit<GiftGroup, "id" | "user_id" | "created_at" | "updated_at">
  ): Promise<GiftGroup> {
    const { data, error } = await supabase
      .from("gift_groups")
      .update({
        title: group.title,
        occasion: group.occasion,
        date: group.date.toISOString(),
        price: group.price,
        product_url: group.product_url,
        product_image_url: group.product_image_url,
        comments: group.comments,
        participants: group.participants,
      })
      .eq("id", groupId)
      .select()
      .single()

    if (error) {
      console.error("Database error in updateGroup:", error)
      throw error
    }

    return {
      ...data,
      date: new Date(data.date),
      participants: data.participants || []
    }
  },

  async copySharedGroup(groupId: string, userId: string) {
    const supabase = createClientComponentClient()

    // First get the group
    const { data: group, error: getError } = await supabase
      .from('gift_groups')
      .select('*')
      .eq('id', groupId)
      .single()

    if (getError || !group) {
      throw new Error('Failed to get group')
    }

    // Create a new group for the user
    const { data: newGroup, error: insertError } = await supabase
      .from('gift_groups')
      .insert({
        title: group.title,
        occasion: group.occasion,
        date: group.date,
        price: group.price,
        product_url: group.product_url,
        product_image_url: group.product_image_url,
        comments: group.comments,
        participants: group.participants,
        color: group.color,
        user_id: userId
      })
      .select()
      .single()

    if (insertError) {
      throw new Error('Failed to copy group')
    }

    return newGroup
  }
} 