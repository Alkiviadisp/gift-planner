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

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const TIMEOUT = 10000; // 10 seconds

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithTimeout = async (url: string, timeout: number): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      mode: 'no-cors', // Add no-cors mode to handle CORS restrictions
      credentials: 'omit',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

const getDefaultProductImage = (url: string): string | null => {
  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname.toLowerCase();

    // Amazon product image fallback
    if (domain.includes('amazon.com')) {
      const match = url.match(/\/dp\/([A-Z0-9]+)/);
      if (match && match[1]) {
        return `https://images-na.ssl-images-amazon.com/images/P/${match[1]}.01.L.jpg`;
      }
    }

    // Add more e-commerce sites as needed
    // Example: Walmart
    if (domain.includes('walmart.com')) {
      const match = url.match(/\/ip\/([^\/]+)/);
      if (match && match[1]) {
        return `https://i5.walmartimages.com/asr/${match[1]}.jpg`;
      }
    }

    return null;
  } catch {
    return null;
  }
};

const getFaviconUrl = (hostname: string): string => {
  // Try Google's favicon service first as it provides high-quality favicons
  return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
};

const fetchWithRetry = async (url: string, retries = MAX_RETRIES): Promise<Response> => {
  try {
    const response = await fetchWithTimeout(url, TIMEOUT);
    return response;
  } catch (error: any) {
    if (retries > 0 && error.name !== 'AbortError') {
      await wait(RETRY_DELAY * (MAX_RETRIES - retries + 1));
      return fetchWithRetry(url, retries - 1);
    }
    throw error;
  }
};

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
    let image_url: string | null = null;

    if (gift.url) {
      try {
        // Validate and normalize URL
        const validUrl = new URL(gift.url);
        gift.url = validUrl.toString();

        // First try to get a product image based on the URL pattern
        image_url = getDefaultProductImage(gift.url);

        // If no product image is found, use the favicon
        if (!image_url) {
          image_url = getFaviconUrl(validUrl.hostname);
        }

      } catch (error) {
        console.error("Error processing URL:", error);
        // If URL processing fails, don't set an image
      }
    }

    try {
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
        .single();

      if (error) {
        console.error("Database error in createGift:", error);
        throw error;
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
      };
    } catch (error) {
      console.error("Error in createGift:", error);
      throw error;
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

  async getGiftCount(userId: string, categoryId: string): Promise<number> {
    const { count, error } = await supabase
      .from("gifts")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", userId)
      .eq("category_id", categoryId);

    if (error) {
      console.error("Database error in getGiftCount:", error);
      throw error;
    }

    return count || 0;
  },
} 