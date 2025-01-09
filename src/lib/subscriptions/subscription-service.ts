import { supabase } from "@/lib/supabase/client"

export type SubscriptionTier = {
  id: 'free' | 'pro' | 'admin'
  name: string
  description: string
  features: {
    max_gifts: number
    max_groups: number
    max_categories: number
    advanced_analytics?: boolean
    priority_support?: boolean
    admin_panel?: boolean
    user_management?: boolean
  }
}

export type SubscriptionHistory = {
  id: string
  user_id: string
  old_tier: string | null
  new_tier: string
  changed_at: string
  changed_by: string | null
  reason: string | null
  metadata: Record<string, any> | null
}

export const subscriptionService = {
  // Get user's current subscription
  async getCurrentSubscription(userId: string) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_start_date, subscription_end_date')
      .eq('id', userId)
      .single()

    if (error) throw error
    return profile
  },

  // Get subscription tier details
  async getSubscriptionTier(tierId: string) {
    const { data, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', tierId)
      .single()

    if (error) throw error
    return data as SubscriptionTier
  },

  // Get all subscription tiers
  async getAllTiers() {
    const { data, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as SubscriptionTier[]
  },

  // Upgrade subscription (admin only)
  async upgradeSubscription(userId: string, newTier: string, reason?: string) {
    const { data: adminCheck, error: adminError } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', supabase.auth.getUser().then(({ data }) => data.user?.id))
      .single()

    if (adminError) throw adminError
    if (adminCheck?.subscription_tier !== 'admin') {
      throw new Error('Only administrators can upgrade subscriptions')
    }

    const { data: currentSub } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single()

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_tier: newTier,
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: null
      })
      .eq('id', userId)

    if (updateError) throw updateError

    // Record the change in subscription history
    const { error: historyError } = await supabase
      .from('subscription_history')
      .insert({
        user_id: userId,
        old_tier: currentSub?.subscription_tier,
        new_tier: newTier,
        changed_by: (await supabase.auth.getUser()).data.user?.id,
        reason,
        metadata: {
          changed_at: new Date().toISOString(),
          action: 'upgrade'
        }
      })

    if (historyError) throw historyError
  },

  // Check if user has reached their subscription limits
  async checkSubscriptionLimits(userId: string, type: 'gifts' | 'groups' | 'categories', currentCount: number) {
    const { data, error } = await supabase
      .rpc('check_subscription_limits', {
        user_id: userId,
        limit_type: type,
        current_count: currentCount
      })

    if (error) throw error
    return data as boolean
  },

  // Get subscription history for a user
  async getSubscriptionHistory(userId: string) {
    const { data, error } = await supabase
      .from('subscription_history')
      .select('*')
      .eq('user_id', userId)
      .order('changed_at', { ascending: false })

    if (error) throw error
    return data as SubscriptionHistory[]
  }
} 