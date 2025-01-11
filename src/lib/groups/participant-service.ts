import { supabase } from '@/lib/supabase/client'
import { GroupParticipant, ParticipantStatus } from '../supabase/database.types'

export class ParticipantService {
  async getGroupParticipants(groupId: string): Promise<GroupParticipant[]> {
    // First get the group to get the creator's user_id
    const { data: group, error: groupError } = await supabase
      .from('gift_groups')
      .select('user_id, name')
      .eq('id', groupId)
      .single();

    if (groupError) throw groupError;

    // Get the creator's email
    const { data: creatorProfile, error: creatorError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', group.user_id)
      .single();

    if (creatorError) throw creatorError;

    // Get all participants
    const { data: participants, error } = await supabase
      .from('group_participants')
      .select(`
        id,
        email,
        participation_status,
        contribution_amount,
        agreed_at,
        created_at,
        updated_at,
        user_id,
        group_id
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Create a list of all participants
    const allParticipants = [...(participants || [])];

    // Add creator if not already in the list
    if (creatorProfile?.email && !allParticipants.some(p => p.email === creatorProfile.email)) {
      allParticipants.push({
        id: 'creator',
        email: creatorProfile.email,
        participation_status: 'agreed',
        contribution_amount: participants?.[0]?.contribution_amount || 0, // Use same amount as others
        agreed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: group.user_id,
        group_id: groupId
      });
    }

    return allParticipants;
  }

  private async sendStatusChangeNotification(
    groupId: string,
    groupName: string,
    participantEmail: string,
    creatorId: string,
    status: ParticipantStatus
  ) {
    try {
      console.log('=== START STATUS CHANGE NOTIFICATION ===');
      
      // Get creator's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', creatorId)
        .single();

      if (profileError) {
        console.error('Error getting creator profile:', profileError);
        return;
      }

      // Create notification for the creator
      const { error: notifError } = await supabase
        .rpc('create_notification', {
          p_user_id: creatorId,
          p_title: 'Group Gift Update',
          p_message: `${participantEmail} has ${status} to contribute to "${groupName}"`,
          p_category: 'gift',
          p_type: 'info',
          p_status: 'active',
          p_priority: 'medium',
          p_requires_action: false,
          p_action_text: 'View Group',
          p_action_url: `/share/group/${groupId}`,
          p_metadata: {
            group_id: groupId,
            participant_email: participantEmail,
            status: status
          }
        });

      if (notifError) {
        console.error('Error sending notification:', notifError);
        throw notifError;
      }

      console.log('Successfully sent status change notification');
      console.log('=== END STATUS CHANGE NOTIFICATION ===');
    } catch (error) {
      console.error('Error in sendStatusChangeNotification:', error);
    }
  }

  async updateParticipantStatus(
    groupId: string,
    email: string,
    status: ParticipantStatus
  ): Promise<void> {
    try {
      // Get group details first
      const { data: group, error: groupError } = await supabase
        .from('gift_groups')
        .select('user_id, name')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;

      // Update the status
      const { error } = await supabase
        .rpc('update_participant_status', {
          p_group_id: groupId,
          p_email: email,
          p_status: status,
          p_agreed_at: status === 'agreed' ? new Date().toISOString() : null
        });

      if (error) throw error;

      // Send notification to group creator
      await this.sendStatusChangeNotification(
        groupId,
        group.name,
        email,
        group.user_id,
        status
      );

      // After updating status, recalculate contributions
      await this.calculateContributions(groupId);
    } catch (error) {
      console.error('Error in updateParticipantStatus:', error);
      throw error;
    }
  }

  async calculateContributions(groupId: string): Promise<void> {
    const { error } = await supabase
      .rpc('calculate_group_contributions', {
        p_group_id: groupId
      })

    if (error) throw error
  }

  async getParticipantStatus(groupId: string, email: string): Promise<GroupParticipant | null> {
    const { data, error } = await supabase
      .from('group_participants')
      .select('*')
      .eq('group_id', groupId)
      .eq('email', email)
      .single()

    if (error) throw error
    return data
  }
}

export const participantService = new ParticipantService() 