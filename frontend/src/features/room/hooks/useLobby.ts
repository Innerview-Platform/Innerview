import { useCallback, useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { roomApi } from '@/features/room/api/roomApi'
import type { RoomRealtime } from '@/features/room/hooks/useRoomRealtime'
import type { AccessRequest, RoomRole } from '@/features/room/types'
import { getErrorMessage } from '@/lib/apiError'

/**
 * People asking to join. Host and interviewers get a toast with Admit / Deny for every request, and
 * the waiting list for the People panel. Lives at room level so requests arrive with the panel closed.
 */
export function useLobby(realtime: RoomRealtime) {
  const { me, code, status, subscribeLobby } = realtime
  const queryClient = useQueryClient()
  const requestsKey = useMemo(() => ['rooms', code, 'requests'] as const, [code])
  const requests = useQuery({ queryKey: requestsKey, queryFn: () => roomApi.requests(code), enabled: me.staff && status === 'connected' })

  const removeRequest = useCallback(
    (id: string) => {
      toast.dismiss(`lobby-${id}`)
      queryClient.setQueryData<AccessRequest[]>(requestsKey, (current) => current?.filter((r) => r.id !== id))
    },
    [queryClient, requestsKey],
  )

  const { mutate: decide } = useMutation({
    mutationFn: ({ request, admit, role }: { request: AccessRequest; admit: boolean; role?: RoomRole }) =>
      admit ? roomApi.admit(code, request.id, role) : roomApi.deny(code, request.id),
    onSettled: (_data, _error, { request }) => removeRequest(request.id),
    onError: (error) => toast.error("Couldn't update the request", { description: getErrorMessage(error) }),
  })

  useEffect(
    () =>
      subscribeLobby(({ type, request }) => {
        if (type === 'REQUEST') {
          queryClient.setQueryData<AccessRequest[]>(requestsKey, (current = []) => [...current.filter((r) => r.id !== request.id), request])
          toast(`${request.name} wants to join`, {
            id: `lobby-${request.id}`,
            duration: 60_000,
            action: { label: 'Admit', onClick: () => decide({ request, admit: true }) },
            cancel: { label: 'Deny', onClick: () => decide({ request, admit: false }) },
          })
        } else {
          removeRequest(request.id)
        }
      }),
    [subscribeLobby, queryClient, requestsKey, decide, removeRequest],
  )

  return {
    waiting: me.staff ? (requests.data ?? []) : [],
    admit: (request: AccessRequest) => decide({ request, admit: true }),
    deny: (request: AccessRequest) => decide({ request, admit: false }),
  }
}

export type Lobby = ReturnType<typeof useLobby>
