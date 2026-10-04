import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAppDispatch } from '@/app/hooks'
import { Button } from '@/components/common/Button'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Alert } from '@/components/feedback/Alert'
import { FormField } from '@/components/forms/FormField'
import { PasswordInput, TextInput } from '@/components/forms/controls'
import { Modal } from '@/components/modals/Modal'
import { loggedOut } from '@/features/auth/slices/authSlice'
import { profileApi } from '@/features/profile/api/profileApi'
import type { UserProfile } from '@/features/profile/types'
import { getErrorMessage } from '@/lib/apiError'

/** Danger zone: permanently delete the account after typing the username (and password, if any). */
export function DeleteAccountCard({ profile }: { profile: UserProfile }) {
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [password, setPassword] = useState('')
  const expected = profile.username ?? profile.email
  const matches = confirmation.trim().replace(/^@/, '').toLowerCase() === expected.toLowerCase()

  const remove = useMutation({
    mutationFn: () => profileApi.deleteAccount({ confirmation: confirmation.trim(), password: profile.has_password ? password : undefined }),
    onSuccess: () => {
      setOpen(false)
      toast.success('Your account was deleted')
      dispatch(loggedOut()) // clears the session and cached data; the router returns to sign-in
    },
  })

  const close = () => {
    if (remove.isPending) return
    setOpen(false)
    setConfirmation('')
    setPassword('')
    remove.reset()
  }

  return (
    <Card className="border-danger/25">
      <CardHeader title="Delete account" description="Permanently delete your account and personal data. This can't be undone." />
      <CardBody className="flex justify-end py-4">
        <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => setOpen(true)}>
          Delete account
        </Button>
      </CardBody>

      <Modal
        open={open}
        onClose={close}
        dismissible={!remove.isPending}
        title="Delete your account?"
        className="max-w-lg"
        footer={
          <>
            <Button variant="ghost" onClick={close} disabled={remove.isPending}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              disabled={!matches || (profile.has_password && !password)}
              onClick={() => remove.mutate()}
            >
              Delete my account
            </Button>
          </>
        }
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (matches && (!profile.has_password || password)) remove.mutate()
          }}
        >
          <div className="space-y-2 text-sm text-fg-secondary">
            <p>
              <strong className="text-fg">Deleted:</strong> your profile, photo, resume, programming languages, rating and the reviews
              others wrote about you. You'll be signed out everywhere.
            </p>
            <p>
              <strong className="text-fg">Kept, without your name:</strong> interviews you took part in and reviews you wrote, which now show
              "Deleted user", so your partners' history stays intact. Interviews you scheduled are cancelled.
            </p>
          </div>
          {remove.isError && <Alert tone="danger">{getErrorMessage(remove.error)}</Alert>}
          <FormField label={<>Type <span className="font-mono text-fg">{expected}</span> to confirm</>}>
            {(field) => (
              <TextInput {...field} autoComplete="off" autoCapitalize="none" spellCheck={false} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
            )}
          </FormField>
          {profile.has_password && (
            <FormField label="Password">
              {(field) => <PasswordInput {...field} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
            </FormField>
          )}
          <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
        </form>
      </Modal>
    </Card>
  )
}
