import { useQuery } from '@tanstack/react-query'
import { roomApi } from '@/features/room/api/roomApi'

export const roomKeys = {
  all: ['rooms'] as const,
  access: (code: string) => [...roomKeys.all, code, 'access'] as const,
  sfuToken: (code: string) => [...roomKeys.all, code, 'sfu-token'] as const,
}

export function useSfuToken(code: string, enabled: boolean) {
  return useQuery({
    queryKey: roomKeys.sfuToken(code),
    queryFn: () => roomApi.getSfuToken(code),
    enabled,
    // LiveKit tokens stay valid for hours; reuse one across quick remounts instead of minting new ones.
    staleTime: Infinity,
    gcTime: 5 * 60_000,
    retry: false,
  })
}
