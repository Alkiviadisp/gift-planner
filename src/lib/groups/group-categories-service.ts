import { supabase } from "../supabase/client"
import type { Database } from "../supabase/database.types"
import { PASTEL_COLORS } from "../categories/categories-service"

export interface GroupCategory {
  id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

export class GroupCategoriesService {
  async getCategories(): Promise<GroupCategory[]> {
    const { data, error } = await supabase
      .from('group_categories')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching categories:', error)
      throw error
    }

    return data || []
  }

  async createCategory(name: string): Promise<GroupCategory> {
    const color = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)]!

    const { data, error } = await supabase
      .from('group_categories')
      .insert([{ name, color }])
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      throw error
    }

    return data
  }

  async updateCategory(id: string, name: string): Promise<void> {
    const { error } = await supabase
      .from('group_categories')
      .update({ name })
      .eq('id', id)

    if (error) {
      console.error('Error updating category:', error)
      throw error
    }
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('group_categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting category:', error)
      throw error
    }
  }
}

export const groupCategoriesService = new GroupCategoriesService() 