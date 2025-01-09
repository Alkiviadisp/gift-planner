"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/provider"
import { subscriptionService, type SubscriptionTier } from "@/lib/subscriptions/subscription-service"
import { format } from "date-fns"

export function SubscriptionInfo() {
  const { user, profile, refreshProfile } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [tierDetails, setTierDetails] = useState<SubscriptionTier | null>(null)

  useEffect(() => {
    if (profile?.subscription_tier) {
      loadTierDetails()
    }
  }, [profile?.subscription_tier])

  const loadTierDetails = async () => {
    try {
      if (!profile?.subscription_tier) return
      const details = await subscriptionService.getSubscriptionTier(profile.subscription_tier)
      setTierDetails(details)
    } catch (error) {
      console.error('Error loading tier details:', error)
      toast({
        title: "Error",
        description: "Failed to load subscription details",
        variant: "destructive",
      })
    }
  }

  if (!profile || !tierDetails) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Loading subscription information...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>Manage your subscription plan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">{tierDetails.name}</h3>
          <p className="text-muted-foreground">{tierDetails.description}</p>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Features & Limits</h4>
          <ul className="space-y-1 text-sm">
            <li>Maximum Gifts: {tierDetails.features.max_gifts === -1 ? 'Unlimited' : tierDetails.features.max_gifts}</li>
            <li>Maximum Groups: {tierDetails.features.max_groups === -1 ? 'Unlimited' : tierDetails.features.max_groups}</li>
            <li>Maximum Categories: {tierDetails.features.max_categories === -1 ? 'Unlimited' : tierDetails.features.max_categories}</li>
            {tierDetails.features.advanced_analytics && <li>✓ Advanced Analytics</li>}
            {tierDetails.features.priority_support && <li>✓ Priority Support</li>}
            {tierDetails.features.admin_panel && <li>✓ Admin Panel Access</li>}
            {tierDetails.features.user_management && <li>✓ User Management</li>}
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Subscription Details</h4>
          <div className="text-sm space-y-1">
            <p>Started: {format(new Date(profile.subscription_start_date), 'PPP')}</p>
            {profile.subscription_end_date && (
              <p>Ends: {format(new Date(profile.subscription_end_date), 'PPP')}</p>
            )}
          </div>
        </div>

        {profile.subscription_tier === 'free' && (
          <Button
            onClick={() => window.location.href = '/upgrade'}
            className="w-full"
          >
            Upgrade to Pro
          </Button>
        )}
      </CardContent>
    </Card>
  )
} 