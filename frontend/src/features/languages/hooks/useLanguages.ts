import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { languagesApi, type ProgrammingLanguage } from '@/features/languages/api/languagesApi'

export const languageKeys = {
  catalog: ['programming-languages'] as const,
  mine: ['profile', 'languages'] as const,
}

const byName = (a: ProgrammingLanguage, b: ProgrammingLanguage) => a.name.localeCompare(b.name)

export function useLanguageCatalog() {
  return useQuery({
    queryKey: languageKeys.catalog,
    queryFn: languagesApi.getCatalog,
    select: (languages) => [...languages].sort(byName),
    staleTime: 10 * 60_000,
  })
}

export function useMyLanguages() {
  return useQuery({
    queryKey: languageKeys.mine,
    queryFn: languagesApi.getMine,
    select: (languages) => [...languages].sort(byName),
  })
}

export function useCreateLanguage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => languagesApi.create(name),
    onSuccess: (language) => {
      queryClient.setQueryData<ProgrammingLanguage[]>(languageKeys.catalog, (current) => (current ? [...current, language] : [language]))
    },
  })
}

/** Adding returns only a message, so the added language is passed in to update the cache optimistically. */
export function useAddMyLanguage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (language: ProgrammingLanguage) => languagesApi.addToMine(language.id),
    onMutate: async (language) => {
      await queryClient.cancelQueries({ queryKey: languageKeys.mine })
      const previous = queryClient.getQueryData<ProgrammingLanguage[]>(languageKeys.mine)
      queryClient.setQueryData<ProgrammingLanguage[]>(languageKeys.mine, (current = []) =>
        current.some((l) => l.id === language.id) ? current : [...current, language],
      )
      return { previous }
    },
    onError: (_error, _language, context) => queryClient.setQueryData(languageKeys.mine, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: languageKeys.mine }),
  })
}

export function useRemoveMyLanguage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (language: ProgrammingLanguage) => languagesApi.removeFromMine(language.id),
    onMutate: async (language) => {
      await queryClient.cancelQueries({ queryKey: languageKeys.mine })
      const previous = queryClient.getQueryData<ProgrammingLanguage[]>(languageKeys.mine)
      queryClient.setQueryData<ProgrammingLanguage[]>(languageKeys.mine, (current = []) => current.filter((l) => l.id !== language.id))
      return { previous }
    },
    onError: (_error, _language, context) => queryClient.setQueryData(languageKeys.mine, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: languageKeys.mine }),
  })
}
