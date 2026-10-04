import { useMemo, useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/common/Button'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Skeleton } from '@/components/common/Skeleton'
import { ErrorState } from '@/components/feedback/states'
import { Select, TextInput } from '@/components/forms/controls'
import type { ProgrammingLanguage } from '@/features/languages/api/languagesApi'
import {
  useAddMyLanguage,
  useCreateLanguage,
  useLanguageCatalog,
  useMyLanguages,
  useRemoveMyLanguage,
} from '@/features/languages/hooks/useLanguages'
import { getErrorMessage } from '@/lib/apiError'

export function LanguagesManager() {
  const catalog = useLanguageCatalog()
  const mine = useMyLanguages()
  const addLanguage = useAddMyLanguage()
  const removeLanguage = useRemoveMyLanguage()
  const createLanguage = useCreateLanguage()

  const [selectedId, setSelectedId] = useState('')
  const [newName, setNewName] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const available = useMemo(() => {
    const owned = new Set(mine.data?.map((l) => l.id))
    return (catalog.data ?? []).filter((l) => !owned.has(l.id))
  }, [catalog.data, mine.data])

  const add = (language: ProgrammingLanguage) =>
    addLanguage.mutate(language, {
      onSuccess: () => setSelectedId(''),
      onError: (error) => toast.error(`Couldn't add ${language.name}`, { description: getErrorMessage(error) }),
    })

  const remove = (language: ProgrammingLanguage) =>
    removeLanguage.mutate(language, {
      onError: (error) => toast.error(`Couldn't remove ${language.name}`, { description: getErrorMessage(error) }),
    })

  const onAddSelected = (event: FormEvent) => {
    event.preventDefault()
    const language = available.find((l) => l.id === selectedId)
    if (language) add(language)
  }

  const trimmedName = newName.trim()
  const existing = catalog.data?.find((l) => l.name.toLowerCase() === trimmedName.toLowerCase())

  const onCreate = (event: FormEvent) => {
    event.preventDefault()
    if (!trimmedName) return
    // The backend responds 500 for duplicate names, so reuse an existing catalog entry instead.
    if (existing) {
      if (mine.data?.some((l) => l.id === existing.id)) toast.info(`${existing.name} is already on your profile`)
      else add(existing)
      setNewName('')
      setShowCreate(false)
      return
    }
    createLanguage.mutate(trimmedName, {
      onSuccess: (language) => {
        add(language)
        setNewName('')
        setShowCreate(false)
      },
      onError: (error) => toast.error("Couldn't create language", { description: getErrorMessage(error) }),
    })
  }

  const isLoading = catalog.isPending || mine.isPending
  const loadError = catalog.error ?? mine.error

  return (
    <Card>
      <CardHeader title="Programming languages" description="Languages you're comfortable interviewing in." />
      <CardBody>
        {isLoading ? (
          <div className="flex flex-wrap gap-2">
            {['w-16', 'w-24', 'w-20'].map((width) => (
              <Skeleton key={width} className={`h-7 rounded-full ${width}`} />
            ))}
            <Skeleton className="mt-3 h-10 w-full" />
          </div>
        ) : loadError ? (
          <ErrorState
            error={loadError}
            className="py-6"
            onRetry={() => {
              catalog.refetch()
              mine.refetch()
            }}
          />
        ) : (
          <div className="space-y-4">
            {mine.data!.length === 0 ? (
              <p className="text-sm text-fg-muted">No languages added yet.</p>
            ) : (
              <ul className="flex flex-wrap gap-2" aria-label="Your languages">
                {mine.data!.map((language) => (
                  <li
                    key={language.id}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-elevated py-1 pr-1 pl-3 text-[13px]"
                  >
                    {language.name}
                    <button
                      onClick={() => remove(language)}
                      className="rounded-full p-0.5 text-fg-muted hover:bg-border hover:text-fg"
                      aria-label={`Remove ${language.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={onAddSelected} className="flex flex-wrap gap-2">
              <label htmlFor="language-select" className="sr-only">
                Add a language
              </label>
              <Select id="language-select" className="min-w-48 flex-1" value={selectedId} onChange={(e) => setSelectedId(e.target.value)} disabled={available.length === 0}>
                <option value="">{available.length ? 'Select a language…' : 'All catalog languages added'}</option>
                {available.map((language) => (
                  <option key={language.id} value={language.id}>
                    {language.name}
                  </option>
                ))}
              </Select>
              <Button type="submit" variant="secondary" disabled={!selectedId} loading={addLanguage.isPending} leftIcon={<Plus className="h-4 w-4" />}>
                Add
              </Button>
            </form>

            {showCreate ? (
              <form onSubmit={onCreate} className="space-y-2">
                <label htmlFor="new-language" className="text-[13px] font-medium text-fg-secondary">
                  Add a language to the catalog
                </label>
                <div className="flex flex-wrap gap-2">
                  <TextInput id="new-language" className="min-w-40 flex-1" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Rust" autoFocus maxLength={255} />
                  <Button type="submit" disabled={!trimmedName} loading={createLanguage.isPending}>
                    {existing ? 'Add' : 'Create'}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowCreate(false)}>
                    Cancel
                  </Button>
                </div>
                {existing && <p className="text-xs text-fg-muted">{existing.name} already exists in the catalog — it will be added to your profile.</p>}
              </form>
            ) : (
              <button onClick={() => setShowCreate(true)} className="text-[13px] text-primary-hover hover:underline">
                Language not listed?
              </button>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
