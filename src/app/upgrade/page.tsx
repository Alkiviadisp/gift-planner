"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/provider"
import { subscriptionService, type SubscriptionTier } from "@/lib/subscriptions/subscription-service"

export default function UpgradePage() {
  const router = useRouter()
  const { user, profile, refreshProfile } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [tiers, setTiers] = useState<SubscriptionTier[]>([])

  useEffect(() => {
    loadTiers()
  }, [])

  const loadTiers = async () => {
    try {
      const allTiers = await subscriptionService.getAllTiers()
      // Filter out admin tier and current tier
      setTiers(allTiers.filter(tier => 
        tier.id !== 'admin' && tier.id !== profile?.subscription_tier
      ))
    } catch (error) {
      console.error('Error loading tiers:', error)
      toast({
        title: "Error",
        description: "Failed to load subscription tiers",
        variant: "destructive",
      })
    }
  }

  const handleUpgrade = async (tierId: string) => {
    setIsLoading(true)
    try {
      // Here you would typically integrate with a payment provider
      // For now, we'll just show a message
      toast({
        title: "Coming Soon",
        description: "Payment integration will be available soon!",
      })
      
      // After successful payment, you would call:
      // await subscriptionService.upgradeSubscription(user.id, tierId, "Upgraded via payment")
      // await refreshProfile()
      // router.push('/account')
    } catch (error) {
      console.error('Error upgrading subscription:', error)
      toast({
        title: "Error",
        description: "Failed to upgrade subscription",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Please sign in</h1>
          <p className="text-muted-foreground">
            You need to be signed in to upgrade your subscription.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Upgrade Your Plan</h1>
          <p className="text-muted-foreground">
            Choose the plan that best fits your needs
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {tiers.map((tier) => (
            <Card key={tier.id} className="relative overflow-hidden">
              {tier.id === 'pro' && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-sm font-medium rounded-bl">
                  Recommended
                </div>
              )}
              <CardHeader>
                <CardTitle>{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h4 className="font-medium">Features</h4>
                  <ul className="space-y-1 text-sm">
                    <li>Up to {tier.features.max_gifts === -1 ? 'Unlimited' : tier.features.max_gifts} Gifts</li>
                    <li>Up to {tier.features.max_groups === -1 ? 'Unlimited' : tier.features.max_groups} Groups</li>
                    <li>Up to {tier.features.max_categories === -1 ? 'Unlimited' : tier.features.max_categories} Categories</li>
                    {tier.features.advanced_analytics && <li>✓ Advanced Analytics</li>}
                    {tier.features.priority_support && <li>✓ Priority Support</li>}
                  </ul>
                </div>

                <Button
                  onClick={() => handleUpgrade(tier.id)}
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : `Upgrade to ${tier.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Need help choosing? Contact our support team for guidance.
          </p>
        </div>
      </div>
    </div>
  )
} 