"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Calendar, Gift, Bell, Users, Heart, Sparkles } from "lucide-react"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { UserMenu } from "@/components/layout/user-menu"
import Link from "next/link"

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const features = [
  {
    title: "Smart Gift Tracking",
    description: "Keep track of all your gift ideas and purchases in one place",
    icon: Gift
  },
  {
    title: "Event Calendar",
    description: "Never miss important dates with our integrated calendar",
    icon: Calendar
  },
  {
    title: "Reminders",
    description: "Get timely notifications for upcoming occasions",
    icon: Bell
  },
  {
    title: "Gift Lists",
    description: "Create and manage gift lists for different occasions",
    icon: Heart
  },
  {
    title: "Collaborative Planning",
    description: "Share and collaborate on gift ideas with family and friends",
    icon: Users
  },
  {
    title: "Smart Suggestions",
    description: "Get personalized gift recommendations based on interests",
    icon: Sparkles
  }
]

export default function Home() {
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  return (
    <main className="min-h-screen relative">
      {/* User Menu */}
      <div className="absolute top-4 right-4 z-50">
        <UserMenu />
      </div>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="max-w-7xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h1 
            className="text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Make Gift-Giving Magical
          </motion.h1>
          <motion.p 
            className="text-xl mb-8 text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Plan, track, and organize your gifts effortlessly. Never forget a special occasion again!
          </motion.p>
          <motion.div 
            className="flex gap-4 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button size="lg" className="rounded-full" asChild>
              <Link href="/categories">
                <Gift className="w-4 h-4 mr-2" />
                Gift Categories
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full" asChild>
              <Link href="/groups">
                <Users className="w-4 h-4 mr-2" />
                Group Gifts
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full" asChild>
              <Link href="/calendar">
                <Calendar className="w-4 h-4 mr-2" />
                Calendar
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            className="text-3xl font-bold text-center mb-12"
            {...fadeIn}
          >
            Everything You Need for Perfect Gifting
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  className="p-6 rounded-xl bg-card hover:shadow-lg transition-shadow duration-300 border"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Icon className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-6">Ready to Start Planning?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of thoughtful gift-givers who make every occasion special
          </p>
          <Button size="lg" className="rounded-full" onClick={() => setShowAuthDialog(true)}>
            Start Free Today
          </Button>
        </motion.div>
      </section>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </main>
  )
} 