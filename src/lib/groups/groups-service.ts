import { supabase } from "@/lib/supabase/client"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { notificationService } from "@/lib/notifications/notification-service"

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

class GroupsService {
  async getGroups(userId: string): Promise<GiftGroup[]> {
    const { data, error } = await supabase
      .from("gift_groups")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error in getGroups:", error)
      throw error
    }

    return data.map((group) => ({
      ...group,
      date: new Date(group.date),
    }))
  }

  private async sendParticipantNotification(
    email: string,
    groupId: string,
    groupTitle: string,
    inviterId: string
  ) {
    try {
      console.log('=== START NOTIFICATION PROCESS ===');
      console.log('Attempting to send notification for group:', groupId);
      
      // Get user profile directly by email
      console.log('Looking up user profile...');
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') { // No rows found
          console.log('No matching user profile found');
          return; // User doesn't exist, do nothing
        }
        console.error('Error looking up user profile');
        throw profileError;
      }

      if (!profiles) {
        console.log('No matching user found');
        return; // User doesn't exist, do nothing
      }

      console.log('User profile found');

      // Call the create_notification function with required parameters first
      const { data: notifData, error: notifError } = await supabase
        .rpc('create_notification', {
          p_user_id: profiles.id,
          p_title: 'New Group Gift Invitation',
          p_message: `You've been invited to join the group gift "${groupTitle}"`,
          p_category: 'gift',
          p_type: 'info',
          p_status: 'active',
          p_priority: 'medium',
          p_requires_action: true,
          p_action_text: 'View Group',
          p_action_url: `/share/group/${groupId}`,
          p_metadata: {
            group_id: groupId,
            inviter_id: inviterId
          }
        });

      if (notifError) {
        console.error('Error sending notification');
        throw notifError;
      }

      console.log('Successfully sent notification');
      console.log('=== END NOTIFICATION PROCESS ===');
    } catch (error: any) {
      console.error('Error in sendParticipantNotification');
      console.error('Error details:', {
        code: error.code
      });
    }
  }

  async createGroup(
    userId: string,
    group: Omit<GiftGroup, "id" | "user_id" | "created_at" | "updated_at">,
    options: { skipNotifications?: boolean } = {}
  ): Promise<GiftGroup> {
    try {
      console.log('Creating new group gift');

      // Create the group
      const { data: newGroup, error: groupError } = await supabase
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
            color: group.color,
          },
        ])
        .select()
        .single()

      if (groupError) {
        console.error('Error creating group');
        throw groupError;
      }

      console.log('Group created successfully');

      // Send notifications to all participants if not skipped
      if (!options.skipNotifications && group.participants.length > 0) {
        console.log(`Sending notifications to ${group.participants.length} participants`);
        await Promise.all(
          group.participants.map((email) =>
            this.sendParticipantNotification(email, newGroup.id, group.title, userId)
          )
        )
      } else {
        console.log('Skipping notifications:', { 
          skipNotifications: options.skipNotifications,
          participantsCount: group.participants.length 
        });
      }

      return {
        ...newGroup,
        date: new Date(newGroup.date),
      }
    } catch (error) {
      console.error("Error in createGroup")
      throw error
    }
  }

  async updateGroup(
    groupId: string,
    updates: Omit<GiftGroup, "id" | "user_id" | "created_at" | "updated_at">
  ): Promise<GiftGroup> {
    try {
      console.log('=== START GROUP UPDATE PROCESS ===');
      
      // Get current group data
      const currentGroup = await this.getGroupById(groupId);
      if (!currentGroup) {
        throw new Error("Group not found");
      }
      console.log('Found existing group');

      // Get the user ID for sending notifications
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("No authenticated user");
      console.log('User authenticated');

      // Update the group
      const { data: updatedGroup, error: updateError } = await supabase
        .from("gift_groups")
        .update({
          title: updates.title,
          occasion: updates.occasion,
          date: updates.date.toISOString(),
          price: updates.price,
          product_url: updates.product_url,
          product_image_url: updates.product_image_url,
          comments: updates.comments,
          participants: updates.participants,
          color: updates.color,
        })
        .eq("id", groupId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating group');
        throw updateError;
      }
      console.log('Group updated successfully');

      // Send notifications to all participants in the updates.participants array
      // This will send notifications even if they were previously added
      if (updates.participants.length > 0) {
        console.log(`Sending notifications to ${updates.participants.length} participants`);
        const notificationPromises = updates.participants.map(async (email) => {
          try {
            await this.sendParticipantNotification(
              email,
              groupId,
              updates.title,
              user.id
            );
            console.log('Notification sent successfully');
          } catch (error) {
            console.error('Error sending notification');
          }
        });

        await Promise.all(notificationPromises);
        console.log('All notifications sent');
      } else {
        console.log('No participants to notify');
      }

      console.log('=== END GROUP UPDATE PROCESS ===');

      return {
        ...updatedGroup,
        date: new Date(updatedGroup.date),
      };
    } catch (error) {
      console.error("Error in updateGroup");
      throw error;
    }
  }

  async deleteGroup(userId: string, groupId: string): Promise<void> {
    try {
      console.log('Attempting to delete group:', { userId, groupId });

      // Validate parameters
      if (!userId || !groupId) {
        throw new Error(`Invalid parameters: userId=${userId}, groupId=${groupId}`);
      }

      const { error } = await supabase
        .from("gift_groups")
        .delete()
        .eq("user_id", userId)
        .eq("id", groupId)

      if (error) {
        console.error("Database error in deleteGroup:", error);
        throw error;
      }

      console.log('Successfully deleted group:', groupId);
    } catch (error) {
      console.error("Error in deleteGroup:", error);
      throw error;
    }
  }

  async getGroupById(groupId: string): Promise<GiftGroup | null> {
    const { data, error } = await supabase
      .from("gift_groups")
      .select("*")
      .eq("id", groupId)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null // No rows returned
      console.error("Database error in getGroupById:", error)
      throw error
    }

    return {
      ...data,
      date: new Date(data.date),
    }
  }

  async acceptGroupInvitation(notificationId: string): Promise<void> {
    try {
      // Get the notification details
      const { data: notification, error: notifError } = await supabase
        .from('mailbox_notifications')
        .select('*')
        .eq('id', notificationId)
        .single();

      if (notifError) {
        console.error('Error fetching notification:', notifError);
        throw notifError;
      }

      if (!notification || !notification.metadata?.group_id) {
        throw new Error('Invalid notification or missing group ID');
      }

      // Get the original group details
      const originalGroup = await this.getGroupById(notification.metadata.group_id);
      if (!originalGroup) {
        throw new Error('Original group not found');
      }

      // Create a new group for the receiver
      const { data: newGroup, error: groupError } = await supabase
        .from('gift_groups')
        .insert([{
          user_id: notification.user_id,
          title: originalGroup.title,
          occasion: originalGroup.occasion,
          date: originalGroup.date,
          price: originalGroup.price,
          product_url: originalGroup.product_url,
          product_image_url: originalGroup.product_image_url,
          comments: originalGroup.comments,
          participants: originalGroup.participants,
          color: originalGroup.color,
        }])
        .select()
        .single();

      if (groupError) {
        console.error('Error creating group copy:', groupError);
        throw groupError;
      }

      // Mark notification as read using the notification service
      await notificationService.markAsRead(notificationId);

      console.log('Successfully accepted group invitation:', {
        notificationId,
        originalGroupId: notification.metadata.group_id,
        newGroupId: newGroup.id
      });
    } catch (error) {
      console.error('Error in acceptGroupInvitation:', error);
      throw error;
    }
  }
}

export const groupsService = new GroupsService() 