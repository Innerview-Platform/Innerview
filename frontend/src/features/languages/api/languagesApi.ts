import { apiClient } from '@/lib/axios'
import type { MessageResponse } from '@/types/api'

/** ProgrammingLanguageDto */
export interface ProgrammingLanguage {
  id: string
  name: string
}

export const languagesApi = {
  /** GET /api/programming-languages — the shared catalog. */
  async getCatalog(): Promise<ProgrammingLanguage[]> {
    const { data } = await apiClient.get<ProgrammingLanguage[]>('/api/programming-languages')
    return data
  },

  /** POST /api/programming-languages — any signed-in user may add to the catalog. */
  async create(name: string): Promise<ProgrammingLanguage> {
    const { data } = await apiClient.post<ProgrammingLanguage>('/api/programming-languages', { name: name.trim() })
    return data
  },

  /** GET /api/profile/languages */
  async getMine(): Promise<ProgrammingLanguage[]> {
    const { data } = await apiClient.get<ProgrammingLanguage[]>('/api/profile/languages')
    return data
  },

  /** POST /api/profile/languages */
  async addToMine(languageId: string): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>('/api/profile/languages', { language_id: languageId })
    return data
  },

  /** DELETE /api/profile/languages/{languageId} */
  async removeFromMine(languageId: string): Promise<MessageResponse> {
    const { data } = await apiClient.delete<MessageResponse>(`/api/profile/languages/${languageId}`)
    return data
  },
}
