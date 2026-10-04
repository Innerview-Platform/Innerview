import { useQuery } from '@tanstack/react-query'
import { roomApi } from '@/features/room/api/roomApi'

export const roomKeys = {
  all: ['rooms'] as const,
  state: (roomId: string) => [...roomKeys.all, roomId, 'state'] as const,
  sfuToken: (roomId: string) => [...roomKeys.all, roomId, 'sfu-token'] as const,
}

/**
 * Room state via the join endpoint (see roomApi.join). Modeled as a query because it is idempotent for
 * current participants and is refetched whenever the socket reports participant or feature changes.
 */
export function useRoomState(roomId: string, enabled: boolean) {
  return useQuery({
    queryKey: roomKeys.state(roomId),
    queryFn: () => roomApi.join(roomId),
    enabled,
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  })
}

export function useSfuToken(roomId: string, enabled: boolean) {
  return useQuery({
    queryKey: roomKeys.sfuToken(roomId),
    queryFn: () => roomApi.getSfuToken(roomId),
    enabled,
    // LiveKit tokens stay valid for hours; reuse one across quick remounts instead of minting new ones.
    staleTime: Infinity,
    gcTime: 5 * 60_000,
    retry: false,
  })
}
