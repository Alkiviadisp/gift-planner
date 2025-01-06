import { supabase } from "@/lib/supabase/client"
import { PostgrestError } from "@supabase/supabase-js"

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const TIMEOUT = 10000; // 10 seconds

const withRetry = async <T,>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> => {
  let lastError: any
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      console.error(`Attempt ${attempt} failed:`, {
        error: error?.message,
        code: error?.code,
        details: error?.details
      })
      
      if (attempt === retries) break
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
  
  throw lastError
}

export interface Gift {
  id: string
  recipient: string
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

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithTimeout = async (url: string, timeout: number): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
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

const getDefaultProductImage = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname.toLowerCase();

    // Amazon product image patterns
    if (domain.includes('amazon.')) {
      // Pattern 1: /dp/ or /gp/product/
      const dpMatch = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
      const productId = dpMatch?.[1];
      if (productId) {
        return `https://images-na.ssl-images-amazon.com/images/P/${productId}.jpg`;
      }
      
      // Pattern 2: /images/I/
      const imgMatch = url.match(/\/images\/I\/([A-Za-z0-9%-._]+\.(?:jpg|jpeg|png|gif))/i);
      const imageId = imgMatch?.[1];
      if (imageId) {
        return `https://images-na.ssl-images-amazon.com/images/I/${imageId}`;
      }
    }

    // Walmart patterns
    if (domain.includes('walmart.')) {
      // Pattern 1: /ip/ path
      const ipMatch = url.match(/\/ip\/([^\/]+)/);
      const ipId = ipMatch?.[1];
      if (ipId) {
        return `https://i5.walmartimages.com/asr/${ipId}.jpg`;
      }
      
      // Pattern 2: direct image URL
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

    // Etsy patterns
    if (domain.includes('etsy.')) {
      const listingMatch = url.match(/\/listing\/(\d+)\//);
      const listingId = listingMatch?.[1];
      if (listingId) {
        return `https://i.etsystatic.com/isla/[...]/${listingId}_1.jpg`;
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
      name: record.name,
      price: record.price,
      url: record.url,
      image_url: record.image_url,
      isPurchased: record.is_purchased,
    }))
  },

  async createGift(
    userId: string,
    categoryId: string,
    gift: {
      recipient: string
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

        // Try to get the product image first
        try {
          image_url = getDefaultProductImage(gift.url);
        } catch (error) {
          console.error("Error getting product image:", error);
        }

        // If no product image was found or there was an error, use the favicon
        if (!image_url) {
          image_url = getFaviconUrl(validUrl.hostname);
        }

      } catch (error) {
        console.error("Error processing URL:", error);
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
      name: string
      price: number | null
      url: string | null
      isPurchased: boolean
    }>
  ): Promise<void> {
    console.log("Updating gift with data:", { userId, giftId, updates })
    
    const updateData = {
      ...(updates.recipient !== undefined && { recipient: updates.recipient }),
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
    if (!userId || !categoryId) {
      throw new Error('Missing required parameters: userId and categoryId are required');
    }

    try {
      const { count, error } = await withRetry(async () => {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Database query timed out')), TIMEOUT);
        });

        // Create the actual query promise
        const queryPromise = supabase
          .from("gifts")
          .select("*", { count: 'exact', head: true })
          .eq("user_id", userId)
          .eq("category_id", categoryId);

        // Race between timeout and query
        const result = await Promise.race([queryPromise, timeoutPromise]) as any;

        if (result.error) {
          const pgError = result.error as PostgrestError;
          console.error("Database error in getGiftCount:", {
            error: pgError,
            code: pgError.code,
            message: pgError.message,
            details: pgError.details,
            hint: pgError.hint,
            userId,
            categoryId
          });

          // Handle specific error cases
          if (pgError.code === '42P01') {
            throw new Error('Table not found. Database might be misconfigured.');
          } else if (pgError.code === '42501') {
            throw new Error('Permission denied. Please check your access rights.');
          } else if (pgError.code?.startsWith('28')) {
            throw new Error('Authentication error. Please log in again.');
          } else if (pgError.code === 'PGRST301') {
            throw new Error('Database connection timeout. Please try again.');
          }

          throw pgError;
        }

        return result;
      }, MAX_RETRIES, RETRY_DELAY);

      if (error) {
        console.error("Error in getGiftCount after retries:", {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          userId,
          categoryId
        });
        throw error;
      }

      return count || 0;
    } catch (error: any) {
      console.error("Unexpected error in getGiftCount:", {
        error: error.message || error,
        code: error.code,
        stack: error.stack,
        userId,
        categoryId,
        timestamp: new Date().toISOString()
      });
      
      // Provide a user-friendly error message
      if (error.message?.includes('timeout')) {
        throw new Error('The request took too long to complete. Please try again.');
      } else if (error.code?.startsWith('PGRST')) {
        throw new Error('Database connection error. Please check your internet connection.');
      } else {
        throw new Error('Failed to get gift count: ' + (error.message || 'Unknown error'));
      }
    }
  },
} 