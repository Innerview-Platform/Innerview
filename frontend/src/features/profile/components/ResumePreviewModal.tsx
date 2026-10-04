import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { buttonClasses } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import { ErrorState } from '@/components/feedback/states'
import { Modal } from '@/components/modals/Modal'

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

interface ResumePreviewModalProps {
  open: boolean
  onClose: () => void
  title: string
  /** Shown in the download name. */
  filename?: string
  /** Unique per resume, e.g. ['resume', 'me', uploadedAt]. */
  queryKey: readonly unknown[]
  load: () => Promise<Blob>
}

/** Previews a PDF (browser viewer) or DOCX (rendered in the page) fetched with the access token. */
export function ResumePreviewModal({ open, onClose, title, filename, queryKey, load }: ResumePreviewModalProps) {
  const resume = useQuery({ queryKey, queryFn: load, enabled: open, staleTime: 5 * 60_000, gcTime: 60_000, retry: false })
  const blob = resume.data
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob])
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url)
  }, [url])

  const isDocx = blob?.type === DOCX || filename?.toLowerCase().endsWith('.docx')
  // The room doesn't know the original name, so give the download the right extension at least.
  const downloadName = filename ?? (isDocx ? 'resume.docx' : 'resume.pdf')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={filename}
      className="flex max-h-[92vh] max-w-4xl flex-col"
      footer={
        url && (
          <a href={url} download={downloadName} className={buttonClasses({ variant: 'secondary' })}>
            <Download className="h-4 w-4" /> Download
          </a>
        )
      }
    >
      <div className="h-[70vh] overflow-hidden rounded-lg border border-border bg-white">
        {resume.isPending && (
          <div className="flex h-full items-center justify-center text-fg-muted">
            <Spinner />
          </div>
        )}
        {resume.isError && (
          <ErrorState error={resume.error} title="Couldn't open the resume" onRetry={() => resume.refetch()} retrying={resume.isFetching} />
        )}
        {url && blob && (isDocx ? <DocxView blob={blob} /> : <iframe src={url} title={title} className="h-full w-full" />)}
      </div>
    </Modal>
  )
}

/** docx-preview is loaded only when a Word resume is opened. */
function DocxView({ blob }: { blob: Blob }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const container = containerRef.current
    if (!container) return
    import('docx-preview')
      .then(({ renderAsync }) => {
        if (cancelled) return undefined
        container.innerHTML = ''
        return renderAsync(blob, container, undefined, { inWrapper: true, ignoreLastRenderedPageBreak: true })
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [blob])

  if (failed) {
    return <p className="p-6 text-sm text-neutral-600">This document can't be previewed here. Use Download to open it.</p>
  }
  return <div ref={containerRef} className="h-full overflow-auto" />
}
