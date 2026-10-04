import { useCallback, useEffect, useState } from 'react'
import * as Y from 'yjs'
import type { RoomRealtime } from '@/features/room/hooks/useRoomRealtime'
import type { CodeUpdatePayload } from '@/features/room/types'
import { base64ToBytes, bytesToBase64 } from '@/features/room/utils/base64'

const REMOTE_ORIGIN = Symbol('remote')
const SEND_THROTTLE_MS = 120

/**
 * Binds a Yjs document to the backend's code channel.
 *
 * The server stores the latest CODE_UPDATE payload as the snapshot served to late joiners, so every
 * message carries the *full* document state (not an incremental update). Applying a full state is
 * idempotent, which also makes the server's echo of our own updates harmless.
 */
export function useSharedCode(realtime: Pick<RoomRealtime, 'status' | 'send' | 'subscribeCode' | 'subscribeParticipantJoined'>) {
  const { status, send, subscribeCode, subscribeParticipantJoined } = realtime
  const [shared] = useState(() => {
    const doc = new Y.Doc()
    const text = doc.getText('code')
    return { doc, text, undoManager: new Y.UndoManager(text) }
  })
  const { doc, text } = shared

  const encode = useCallback(
    (): CodeUpdatePayload => ({ base64Vector: bytesToBase64(Y.encodeStateAsUpdate(doc)), plainText: text.toString() }),
    [doc, text],
  )

  const broadcastState = useCallback(() => {
    if (text.length > 0) send('CODE_UPDATE', encode())
  }, [encode, send, text])

  // Remote updates (including the snapshot the server sends after JOIN_FEATURE).
  useEffect(
    () =>
      subscribeCode(({ base64Vector }) => {
        if (!base64Vector) return
        try {
          Y.applyUpdate(doc, base64ToBytes(base64Vector), REMOTE_ORIGIN)
        } catch {
          // Ignore payloads that aren't Yjs updates (e.g. written by another client implementation).
        }
      }),
    [doc, subscribeCode],
  )

  // Local edits, throttled.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const flush = () => {
      timer = null
      send('CODE_UPDATE', encode())
    }
    const onUpdate = (_update: Uint8Array, origin: unknown) => {
      if (origin === REMOTE_ORIGIN || timer) return
      timer = setTimeout(flush, SEND_THROTTLE_MS)
    }
    doc.on('update', onUpdate)
    return () => {
      doc.off('update', onUpdate)
      if (timer) {
        clearTimeout(timer)
        flush()
      }
    }
  }, [doc, encode, send])

  // On every (re)connect: join the editor feature (the server replies with its snapshot) and push our state.
  useEffect(() => {
    if (status !== 'connected') return
    send('JOIN_FEATURE', { element: 'SHARED_EDITOR' })
    broadcastState()
  }, [status, send, broadcastState])

  // The server's snapshot is written with a debounce, so give newcomers our current state directly.
  useEffect(() => subscribeParticipantJoined(() => broadcastState()), [subscribeParticipantJoined, broadcastState])

  /** COMPILE_CODE: the backend flushes the code to storage immediately (no compiler output is returned). */
  const saveSnapshot = useCallback(() => send('COMPILE_CODE', encode()), [encode, send])

  return { ...shared, saveSnapshot }
}
