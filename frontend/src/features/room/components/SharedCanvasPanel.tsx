import { useCallback, useMemo, type ReactNode } from 'react'
import { useSync } from '@tldraw/sync'
import {
  AssetRecordType,
  getHashForString,
  Tldraw,
  uniqueId,
  useTldrawCurrentUser,
  type Editor,
  type TLAssetStore,
  type TLBookmarkAsset,
} from 'tldraw'
import 'tldraw/tldraw.css'
import { AlertTriangle } from 'lucide-react'
import { Spinner } from '@/components/common/Spinner'
import { config, getCanvasUrl } from '@/constants/config'
import type { RoomRealtime } from '@/features/room/hooks/useRoomRealtime'
import { presenceColor } from '@/features/room/utils/presence'

/** Uploads go to the sync server; the stored src is relative so it works on any origin. */
function createAssetStore(getTicket: () => Promise<string>): TLAssetStore {
  return {
    async upload(_asset, file) {
      const id = `${uniqueId()}-${file.name}`.replace(/[^A-Za-z0-9._-]/g, '-').slice(0, 200)
      const response = await fetch(getCanvasUrl(`/uploads/${encodeURIComponent(id)}`), {
        method: 'PUT',
        body: file,
        headers: { Authorization: `Bearer ${await getTicket()}`, 'Content-Type': file.type },
      })
      if (!response.ok) throw new Error(`Upload failed (${response.status})`)
      return { src: `${config.canvasBaseUrl}/uploads/${encodeURIComponent(id)}` }
    },
    resolve: (asset) => asset.props.src,
  }
}

/**
 * Pasted links become plain bookmark cards. Link previews are deliberately not fetched: that would
 * mean either calling tldraw's hosted service or letting our server fetch arbitrary URLs.
 */
async function createBookmark({ url }: { url: string }): Promise<TLBookmarkAsset> {
  return {
    id: AssetRecordType.createId(getHashForString(url)),
    typeName: 'asset',
    type: 'bookmark',
    meta: {},
    props: { src: url, title: url, description: '', image: '', favicon: '' },
  }
}

function CanvasMessage({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'danger' }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-fg-muted">
      {tone === 'danger' ? <AlertTriangle className="h-5 w-5 text-danger" aria-hidden /> : <Spinner />}
      <div>{children}</div>
    </div>
  )
}

interface SharedCanvasPanelProps {
  /** Room code. */
  roomId: string
  /** Fresh room ticket (read-only tickets give a view-only board, e.g. on the interview summary). */
  fetchTicket: RoomRealtime['fetchTicket']
  user: { id: string; name: string }
  /** Rendered at the left of the panel's header (the workspace tabs). */
  header?: ReactNode
  className?: string
}

/** System-design whiteboard shared by everyone in the room, synced through the self-hosted tldraw server. */
export function SharedCanvasPanel({ roomId, fetchTicket, user: me, header, className }: SharedCanvasPanelProps) {
  // useSync reconnects whenever its options change identity, so both must be stable.
  const assets = useMemo(() => createAssetStore(fetchTicket), [fetchTicket])
  const uri = useCallback(
    // Resolved on every (re)connect with a fresh room ticket.
    async () => `${getCanvasUrl(`/connect/${encodeURIComponent(roomId)}`, { ws: true })}?token=${encodeURIComponent(await fetchTicket())}`,
    [roomId, fetchTicket],
  )
  const store = useSync({ uri, assets })

  const userPreferences = useMemo(
    () => ({ id: me.id, name: me.name, color: presenceColor(me.id), colorScheme: 'dark' as const }),
    [me.id, me.name],
  )
  const user = useTldrawCurrentUser({ userPreferences })

  const onMount = (editor: Editor) => {
    editor.registerExternalAssetHandler('url', createBookmark)
  }

  const status =
    store.status === 'synced-remote'
      ? store.connectionStatus === 'online'
        ? { label: 'Live', dot: 'bg-success' }
        : { label: 'Reconnecting…', dot: 'bg-warning animate-pulse' }
      : store.status === 'error'
        ? { label: 'Disconnected', dot: 'bg-danger' }
        : { label: 'Connecting…', dot: 'bg-warning animate-pulse' }

  return (
    <section className={`flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface ${className ?? ''}`} aria-label="Shared whiteboard">
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border px-2">
        {header}
        <span className="flex items-center gap-2 px-2 text-xs text-fg-muted" role="status">
          <span className={`h-2 w-2 rounded-full ${status.dot}`} aria-hidden />
          {status.label}
        </span>
      </div>
      <div className="relative min-h-0 flex-1">
        {store.status === 'loading' && <CanvasMessage>Loading the whiteboard…</CanvasMessage>}
        {store.status === 'error' && (
          <CanvasMessage tone="danger">
            {/NOT_AUTHENTICATED|FORBIDDEN/i.test(store.error.message)
              ? "You don't have access to this whiteboard anymore."
              : "The whiteboard server can't be reached. Make sure it is running, then reload the page."}
          </CanvasMessage>
        )}
        {store.status === 'synced-remote' && (
          <div className="absolute inset-0">
            <Tldraw
              store={store}
              user={user}
              colorScheme="dark"
              onMount={onMount}
              autoFocus={false}
              licenseKey={import.meta.env.VITE_TLDRAW_LICENSE_KEY}
            />
          </div>
        )}
      </div>
    </section>
  )
}
