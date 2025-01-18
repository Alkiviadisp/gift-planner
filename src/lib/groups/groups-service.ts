import { supabase } from "@/lib/supabase/client"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { notificationService } from "@/lib/notifications/notification-service"
import { PASTEL_COLORS } from "@/lib/categories/categories-service"

// Helper function to get a random pastel color
const getRandomPastelColor = (): string => {
  const randomIndex = Math.floor(Math.random() * PASTEL_COLORS.length)
  return PASTEL_COLORS[randomIndex]!
}

export interface GiftGroup {
  id: string
  user_id: string
  name: string
  description: string
  amount: number
  currency: string
  image_url?: string
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

interface CreateGroupInput {
  name: string
  description: string
  amount: number
  currency: string
  imageUrl: string | null
  participants?: Array<{ email: string; participation_status?: string }>
  date?: Date
}

interface UpdateGroupInput {
  name: string
  description: string
  amount: number
  currency: string
  imageUrl: string | null
  participants?: string[]
}

export class GroupsService {
  async getGroups(userId: string): Promise<GiftGroup[]> {
    // First get groups where user is the owner
    const { data: ownedGroups, error: ownedError } = await supabase
      .from("gift_groups")
      .select(`
        *,
        group_participants (
          id,
          email,
          participation_status
        )
      `)
      .eq('user_id', userId)
      .order("created_at", { ascending: false });

    if (ownedError) {
      console.error("Database error in getGroups (owned):", ownedError);
      throw ownedError;
    }

    // Then get groups where user is a participant
    const { data: participatedGroups, error: participatedError } = await supabase
      .from("gift_groups")
      .select(`
        *,
        group_participants (
          id,
          email,
          participation_status
        )
      `)
      .neq('user_id', userId) // Exclude groups where user is owner
      .eq('group_participants.user_id', userId)
      .eq('group_participants.participation_status', 'accepted')
      .order("created_at", { ascending: false });

    if (participatedError) {
      console.error("Database error in getGroups (participated):", participatedError);
      throw participatedError;
    }

    // Combine both sets of groups
    const groups = [...(ownedGroups || []), ...(participatedGroups || [])];

    // Get the user's email
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) throw new Error('User email not found');

    return groups.map((group) => {
      // Get all participant emails from group_participants
      const participantEmails = group.group_participants?.map((p: any) => p.email) || [];
      
      // Add creator's email if not already in the list
      if (!participantEmails.includes(user.email)) {
        participantEmails.push(user.email);
      }

      return {
        ...group,
        // Map new fields to old fields for backward compatibility
        title: group.name || group.title,
        occasion: group.description || group.occasion,
        price: group.amount || group.price,
        product_image_url: group.image_url || group.product_image_url,
        // Convert date string to Date object
        date: new Date(group.date),
        // Set participants array including creator
        participants: participantEmails
      };
    });
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
      console.log('Looking up profile for email:', email);
      
      // First verify the email format
      if (typeof email !== 'string') {
        console.error('Invalid email format:', email);
        return;
      }

      // Get user profile directly by email
      console.log('Querying profiles table...');
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email.toLowerCase()) // Ensure case-insensitive comparison
        .single();

      if (profileError) {
        console.error('Profile lookup error:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        });
        
        if (profileError.code === 'PGRST116') { // No rows found
          console.log('No matching user profile found');
          return; // User doesn't exist, do nothing
        }
        throw profileError;
      }

      if (!profiles) {
        console.log('No matching user found');
        return; // User doesn't exist, do nothing
      }

      console.log('User profile found:', {
        id: profiles.id,
        email: profiles.email
      });

      // Call the create_notification function with required parameters first
      console.log('Creating notification for user:', profiles.id);
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
        console.error('Error sending notification:', {
          code: notifError.code,
          message: notifError.message,
          details: notifError.details,
          hint: notifError.hint
        });
        throw notifError;
      }

      console.log('Successfully sent notification');
      console.log('=== END NOTIFICATION PROCESS ===');
    } catch (error: any) {
      console.error('Error in sendParticipantNotification:', {
        error: error,
        email: email,
        groupId: groupId
      });
    }
  }

  async createGroup(group: CreateGroupInput): Promise<string> {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('No authenticated user');
    if (!user.email) throw new Error('User email not found');

    // Validate required fields
    if (!group.name || !group.description || !group.amount || !group.currency) {
      throw new Error('Missing required fields');
    }

    // Include both old and new field names
    const groupData = {
      // New fields
      name: group.name,
      description: group.description,
      amount: group.amount,
      currency: group.currency,
      image_url: group.imageUrl,
      user_id: user.id,
      // Old fields (required until migration is complete)
      title: group.name,
      occasion: group.description,
      price: group.amount,
      product_image_url: group.imageUrl,
      date: group.date ? group.date.toISOString() : new Date().toISOString(),
      color: getRandomPastelColor(), // Use a random pastel color
    };

    console.log('Creating group with data:', groupData);

    const { data: newGroup, error: createError } = await supabase
      .from('gift_groups')
      .insert(groupData)
      .select()
      .single();

    if (createError) {
      console.error('Error creating group:', createError);
      throw createError;
    }

    // Create a list of all participants with their statuses
    const allParticipants = [
      // Add creator with agreed status
      { email: user.email, participation_status: 'agreed' },
      // Add other participants with their statuses
      ...(group.participants || [])
    ];

    if (allParticipants.length > 0) {
      // Get user profiles for the participants
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('email', allParticipants.map(p => p.email));

      // Create a map of email to user_id
      const emailToUserId = new Map(profiles?.map(p => [p.email, p.id]) || []);

      // Calculate initial contribution amount per participant
      const initialContributionAmount = group.amount / allParticipants.length;

      // Create participant entries
      const participants = allParticipants
        .filter(p => p.email) // Ensure no null emails
        .map(p => ({
          group_id: newGroup.id,
          user_id: emailToUserId.get(p.email) || null,
          email: p.email,
          participation_status: p.participation_status || 'pending',
          contribution_amount: initialContributionAmount
        }));

      const { error: participantError } = await supabase
        .from('group_participants')
        .insert(participants);

      if (participantError) {
        console.error('Error adding participants:', participantError);
        throw participantError;
      }

      // Send notifications to participants (except the creator)
      for (const participant of participants) {
        if (participant.email !== user.email) {
          // Get the email string from the participant object
          const participantEmail = typeof participant.email === 'object' && (participant.email as { email: string }).email 
            ? (participant.email as { email: string }).email 
            : participant.email;
            
          console.log('Sending notification to participant:', participantEmail);
          await this.sendParticipantNotification(
            participantEmail,
            newGroup.id,
            group.name,
            user.id
          );
        }
      }
    }

    return newGroup.id;
  }

  async updateGroup(groupId: string, updates: UpdateGroupInput): Promise<void> {
    const { error: updateError } = await supabase
      .from('gift_groups')
      .update({
        name: updates.name,
        description: updates.description,
        amount: updates.amount,
        currency: updates.currency,
        image_url: updates.imageUrl
      })
      .eq('id', groupId)

    if (updateError) throw updateError

    if (updates.participants) {
      // Get current participants
      const { data: currentParticipants } = await supabase
        .from('group_participants')
        .select('email')
        .eq('group_id', groupId)

      const currentEmails = new Set(currentParticipants?.map(p => p.email) || [])
      const newEmails = new Set(updates.participants)

      // Add new participants
      const newParticipants = updates.participants
        .filter((email: string) => !currentEmails.has(email))
        .map((email: string) => ({
          group_id: groupId,
          email,
          participation_status: 'pending',
          contribution_amount: 0
        }))

      if (newParticipants.length > 0) {
        const { error: participantError } = await supabase
          .from('group_participants')
          .insert(newParticipants)

        if (participantError) throw participantError

        // Get the group name and user ID for notifications
        const { data: group, error: groupError } = await supabase
          .from('gift_groups')
          .select('name, user_id')
          .eq('id', groupId)
          .single()

        if (groupError) throw groupError
        if (!group) throw new Error('Group not found')

        // Send notifications to new participants
        for (const participant of newParticipants) {
          await this.sendParticipantNotification(
            participant.email,
            groupId,
            group.name,
            group.user_id
          )
        }
      }

      // Remove participants that are no longer in the list
      const removedEmails = Array.from(currentEmails)
        .filter(email => !newEmails.has(email))

      if (removedEmails.length > 0) {
        const { error: deleteError } = await supabase
          .from('group_participants')
          .delete()
          .eq('group_id', groupId)
          .in('email', removedEmails)

        if (deleteError) throw deleteError
      }

      // Recalculate contribution amounts
      await supabase.rpc('calculate_group_contributions', {
        p_group_id: groupId
      })
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
      .select(`
        *,
        group_participants (
          id,
          email,
          participation_status
        )
      `)
      .eq("id", groupId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // No rows returned
      console.error("Database error in getGroupById:", error);
      throw error;
    }

    // Get the creator's email from the user profile
    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', data.user_id)
      .single();

    // Get all participant emails from group_participants
    const participantEmails = data.group_participants?.map((p: any) => p.email) || [];
    
    // Add creator's email if not already in the list
    if (creatorProfile?.email && !participantEmails.includes(creatorProfile.email)) {
      participantEmails.push(creatorProfile.email);
    }

    return {
      ...data,
      // Map new fields to old fields for backward compatibility
      title: data.name || data.title,
      occasion: data.description || data.occasion,
      price: data.amount || data.price,
      product_image_url: data.image_url || data.product_image_url,
      // Convert date string to Date object
      date: new Date(data.date),
      // Set participants array including creator
      participants: participantEmails
    };
  }

  async acceptGroupInvitation(notificationId: string): Promise<void> {
    const supabase = createClientComponentClient()
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

      // Get the user's email
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user?.email) throw new Error('User email not found');

      // Get the original creator's email
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', originalGroup.user_id)
        .single();

      if (!creatorProfile?.email) {
        throw new Error('Original creator email not found');
      }

      // Create a new group for the receiver
      const { data: newGroup, error: groupError } = await supabase
        .from('gift_groups')
        .insert([{
          user_id: notification.user_id,
          name: originalGroup.title,
          description: originalGroup.occasion,
          amount: originalGroup.price,
          currency: originalGroup.currency || 'EUR',
          image_url: originalGroup.product_image_url,
          date: originalGroup.date,
          color: originalGroup.color,
          participants: originalGroup.participants,
          // Add new fields for backward compatibility
          title: originalGroup.title,
          occasion: originalGroup.occasion,
          price: originalGroup.price,
          product_image_url: originalGroup.product_image_url,
        }])
        .select()
        .single();

      if (groupError) {
        console.error('Error creating group copy:', groupError);
        throw groupError;
      }

      // Get all participants from the original group
      const { data: originalParticipants, error: participantsError } = await supabase
        .from('group_participants')
        .select('*')
        .eq('group_id', notification.metadata.group_id);

      if (participantsError) {
        console.error('Error fetching original participants:', participantsError);
        throw participantsError;
      }

      // Create a list of all participants including the new owner and original creator
      const allParticipants = [...new Set([
        ...originalParticipants.map(p => p.email),
        user.email,
        creatorProfile.email // Add original creator
      ])];

      // Get user profiles for the participants
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('email', allParticipants);

      const emailToUserId = new Map(profiles?.map(p => [p.email, p.id]) || []);

      // Calculate initial contribution amount
      const initialContributionAmount = originalGroup.price / allParticipants.length;

      // Create participant entries for the new group
      const newParticipants = allParticipants.map(email => ({
        group_id: newGroup.id,
        user_id: emailToUserId.get(email) || null,
        email,
        participation_status: email === user.email ? 'agreed' : 'pending', // New owner is automatically agreed
        contribution_amount: initialContributionAmount
      }));

      const { error: insertError } = await supabase
        .from('group_participants')
        .insert(newParticipants);

      if (insertError) {
        console.error('Error adding participants to new group:', insertError);
        throw insertError;
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

  async copySharedGroup(groupId: string, userId: string): Promise<string> {
    try {
      // Get the original group details
      const originalGroup = await this.getGroupById(groupId);
      if (!originalGroup) {
        throw new Error('Original group not found');
      }

      // Get the user's email
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user?.email) throw new Error('User email not found');

      // Get the original creator's email
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', originalGroup.user_id)
        .single();

      if (!creatorProfile?.email) {
        throw new Error('Original creator email not found');
      }

      // Create a new group for the user
      const { data: newGroup, error: groupError } = await supabase
        .from('gift_groups')
        .insert([{
          user_id: userId,
          name: originalGroup.title,
          description: originalGroup.occasion,
          amount: originalGroup.price,
          currency: originalGroup.currency || 'EUR',
          image_url: originalGroup.product_image_url,
          date: originalGroup.date,
          color: originalGroup.color,
          // New fields
          title: originalGroup.title,
          occasion: originalGroup.occasion,
          price: originalGroup.price,
          product_image_url: originalGroup.product_image_url,
          participants: originalGroup.participants,
        }])
        .select()
        .single();

      if (groupError) {
        console.error('Error copying group:', groupError);
        throw groupError;
      }

      // Get all participants from the original group
      const { data: originalParticipants, error: participantsError } = await supabase
        .from('group_participants')
        .select('*')
        .eq('group_id', groupId);

      if (participantsError) {
        console.error('Error fetching original participants:', participantsError);
        throw participantsError;
      }

      // Create a list of all participants including the new owner and original creator
      const allParticipants = [...new Set([
        ...originalParticipants.map(p => p.email),
        user.email,
        creatorProfile.email // Add original creator
      ])];

      // Get user profiles for the participants
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('email', allParticipants);

      const emailToUserId = new Map(profiles?.map(p => [p.email, p.id]) || []);

      // Calculate initial contribution amount
      const initialContributionAmount = originalGroup.price / allParticipants.length;

      // Create participant entries for the new group
      const newParticipants = allParticipants.map(email => ({
        group_id: newGroup.id,
        user_id: emailToUserId.get(email) || null,
        email,
        participation_status: email === user.email ? 'agreed' : 'pending', // New owner is automatically agreed
        contribution_amount: initialContributionAmount
      }));

      const { error: insertError } = await supabase
        .from('group_participants')
        .insert(newParticipants);

      if (insertError) {
        console.error('Error adding participants to new group:', insertError);
        throw insertError;
      }

      return newGroup.id;
    } catch (error) {
      console.error('Error in copySharedGroup:', error);
      throw error;
    }
  }
}

export const groupsService = new GroupsService()

// Export the copySharedGroup function as a standalone function
export const copySharedGroup = (groupId: string, userId: string): Promise<string> => {
  return groupsService.copySharedGroup(groupId, userId)
} 