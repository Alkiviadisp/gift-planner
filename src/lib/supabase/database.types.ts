export type ParticipantStatus = 'pending' | 'agreed' | 'declined'

export interface GroupParticipant {
  id: string
  group_id: string
  user_id: string | null
  email: string
  contribution_amount: number
  participation_status: ParticipantStatus
  agreed_at: string | null
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      group_participants: {
        Row: GroupParticipant
        Insert: Omit<GroupParticipant, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<GroupParticipant, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
} 