import { useEffect, useState } from 'react'
import { HocuspocusProvider } from '@hocuspocus/provider'
import * as Y from 'yjs'
import { getCollabUrl } from '@/constants/config'
import type { SharedDocumentName } from '@/features/room/types'
import { presenceColor } from '@/features/room/utils/presence'

export type CollabStatus = 'connecting' | 'synced' | 'offline' | 'denied'

interface UseCollabDocumentOptions {
  code: string
  kind: SharedDocumentName
  /** A fresh room ticket (called on every (re)connect). */
  fetchTicket: () => Promise<string>
  user: { id: string; name: string }
  enabled?: boolean
}

/**
 * One of the room's shared documents, synced through the Hocuspocus server: incremental Yjs updates
 * (no size limit), server-side persistence, and awareness so everyone sees each other's cursors.
 */
export function useCollabDocument({ code, kind, fetchTicket, user, enabled = true }: UseCollabDocumentOptions) {
  const [shared] = useState(() => {
    const doc = new Y.Doc()
    const text = doc.getText(kind)
    return { doc, text, undoManager: new Y.UndoManager(text) }
  })
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null)
  const [status, setStatus] = useState<CollabStatus>('connecting')
  const [readOnly, setReadOnly] = useState(false)

  useEffect(() => {
    if (!enabled) return
    const next = new HocuspocusProvider({
      url: getCollabUrl(),
      name: `${code}/${kind}`,
      document: shared.doc,
      token: fetchTicket,
      onSynced: () => setStatus('synced'),
      onStatus: ({ status: socketStatus }) => {
        if (socketStatus === 'disconnected') setStatus((current) => (current === 'denied' ? current : 'offline'))
      },
      onAuthenticated: ({ scope }) => setReadOnly(scope === 'readonly'),
      onAuthenticationFailed: () => setStatus('denied'),
    })
    const color = presenceColor(user.id)
    next.awareness?.setLocalStateField('user', { name: user.name, color, colorLight: `${color}33` })
    setProvider(next)
    return () => {
      next.destroy()
      setProvider(null)
    }
  }, [code, kind, fetchTicket, shared.doc, user.id, user.name, enabled])

  return { ...shared, provider, status, readOnly }
}
