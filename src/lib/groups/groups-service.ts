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
  color: string
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
  }
} 