import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { TextInput } from '@/components/forms/controls'
import { paths } from '@/routes/paths'

// Room ids are 6 alphanumeric characters (RoomUtil). Pasting a full invite link also works.
const ROOM_ID_PATTERN = /^[A-Za-z0-9]{6}$/

function extractRoomId(input: string): string {
  const trimmed = input.trim()
  const fromLink = trimmed.match(/\/room\/join\/([A-Za-z0-9]+)/)
  return fromLink?.[1] ?? trimmed
}

export function JoinRoomForm({ autoFocus = false }: { autoFocus?: boolean }) {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const roomId = extractRoomId(value)
    if (!ROOM_ID_PATTERN.test(roomId)) {
      setError('Enter the 6-character room code or paste the invite link.')
      return
    }
    navigate(paths.room(roomId))
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <label htmlFor="room-code" className="text-[13px] font-medium text-fg-secondary">
        Room code or invite link
      </label>
      <div className="mt-1.5 flex gap-2">
        <TextInput
          id="room-code"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(null)
          }}
          placeholder="e.g. 3AfpbH"
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'room-code-error' : undefined}
          className="font-mono"
        />
        <Button type="submit" disabled={!value.trim()}>
          Join <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      {error && (
        <p id="room-code-error" className="mt-1.5 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
