import { useRef, useState } from 'react'
import { Eye, FileText, Lock, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/common/Button'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { ConfirmDialog } from '@/components/modals/ConfirmDialog'
import { profileApi } from '@/features/profile/api/profileApi'
import { ResumePreviewModal } from '@/features/profile/components/ResumePreviewModal'
import { useDeleteResume, useUploadResume } from '@/features/profile/hooks/useProfile'
import type { ResumeInfo } from '@/features/profile/types'
import { formatBytes, RESUME_ACCEPT, resumeProblem } from '@/features/profile/utils/files'
import { getErrorMessage } from '@/lib/apiError'
import { cn, formatDate } from '@/lib/utils'

/** Upload, preview, replace and delete your resume. */
export function ResumeCard({ resume }: { resume: ResumeInfo | null }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const upload = useUploadResume()
  const remove = useDeleteResume()

  const onFile = (file: File | undefined) => {
    if (!file) return
    const problem = resumeProblem(file)
    if (problem) {
      toast.error(problem)
      return
    }
    upload.mutate(file, {
      onSuccess: () => toast.success(resume ? 'Resume replaced' : 'Resume uploaded'),
      onError: (error) => toast.error("Couldn't upload your resume", { description: getErrorMessage(error) }),
    })
  }

  const picker = (
    <input
      ref={inputRef}
      type="file"
      accept={RESUME_ACCEPT}
      className="sr-only"
      tabIndex={-1}
      onChange={(event) => {
        onFile(event.target.files?.[0])
        event.target.value = ''
      }}
    />
  )

  return (
    <Card>
      <CardHeader
        title="Resume"
        description={
          <span className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden /> Only you, and your interviewers during a live interview, can open it.
          </span>
        }
      />
      <CardBody className="py-4">
        {picker}
        {resume ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary-hover">
                <FileText className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{resume.filename}</p>
                <p className="text-xs text-fg-muted">
                  {formatBytes(resume.size)} · uploaded {formatDate(resume.uploaded_at)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" leftIcon={<Eye className="h-3.5 w-3.5" />} onClick={() => setPreviewing(true)}>
                Preview
              </Button>
              <Button size="sm" variant="secondary" leftIcon={<Upload className="h-3.5 w-3.5" />} loading={upload.isPending} onClick={() => inputRef.current?.click()}>
                Replace
              </Button>
              <Button size="sm" variant="ghost" className="text-danger" aria-label="Delete resume" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragging(false)
              onFile(event.dataTransfer.files[0])
            }}
            disabled={upload.isPending}
            className={cn(
              'flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors',
              dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-fg-muted',
            )}
          >
            <Upload className="h-6 w-6 text-fg-muted" aria-hidden />
            <span className="text-sm font-medium">{upload.isPending ? 'Uploading…' : 'Upload your resume'}</span>
            <span className="text-xs text-fg-muted">PDF or Word (.docx), up to 5 MB. Drop it here or click to browse.</span>
          </button>
        )}
      </CardBody>

      {resume && (
        <ResumePreviewModal
          open={previewing}
          onClose={() => setPreviewing(false)}
          title="Your resume"
          filename={resume.filename}
          queryKey={['resume', 'me', resume.uploaded_at]}
          load={profileApi.getOwnResume}
        />
      )}
      <ConfirmDialog
        open={confirmDelete}
        title="Delete your resume?"
        description="Interviewers won't be able to see it until you upload a new one."
        confirmLabel="Delete resume"
        loading={remove.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: () => {
              setConfirmDelete(false)
              toast.success('Resume deleted')
            },
            onError: (error) => toast.error("Couldn't delete your resume", { description: getErrorMessage(error) }),
          })
        }
      />
    </Card>
  )
}
