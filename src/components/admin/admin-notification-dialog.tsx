"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { Megaphone } from "lucide-react"
import { AdminNotificationForm } from "./admin-notification-form"

export function AdminNotificationDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Megaphone className="h-4 w-4" />
          Send Notification
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogTitle>Send Admin Notification</DialogTitle>
        <AdminNotificationForm />
      </DialogContent>
    </Dialog>
  )
} 