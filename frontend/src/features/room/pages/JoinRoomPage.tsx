import { Link } from 'react-router-dom'
import { DoorOpen } from 'lucide-react'
import { Card } from '@/components/common/Card'
import { PageHeader } from '@/components/layout/PageHeader'
import { JoinRoomForm } from '@/features/room/components/JoinRoomForm'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/routes/paths'

export default function JoinRoomPage() {
  useDocumentTitle('Join a room')
  return (
    <>
      <PageHeader title="Join a room" description="Use the code or link your interview partner shared with you." />
      <Card className="mx-auto max-w-lg p-6 sm:p-8">
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary-hover">
          <DoorOpen className="h-5 w-5" />
        </div>
        <JoinRoomForm autoFocus />
        <p className="mt-6 text-[13px] text-fg-muted">
          Hosting instead?{' '}
          <Link to={paths.newInterview} className="text-primary-hover hover:underline">
            Create a new interview
          </Link>
        </p>
      </Card>
    </>
  )
}
