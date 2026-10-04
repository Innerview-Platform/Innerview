import { useEffect, useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { Camera, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/modals/Modal'
import { useDeleteAvatar, useUploadAvatar } from '@/features/profile/hooks/useProfile'
import { cropToSquareJpeg, IMAGE_TYPES, imageProblem } from '@/features/profile/utils/files'
import { getErrorMessage } from '@/lib/apiError'

interface AvatarEditorProps {
  name: string
  avatarUrl: string | null
  size?: number
}

/** Your photo with a "change" button: pick an image, crop it to a square, upload. */
export function AvatarEditor({ name, avatarUrl, size = 88 }: AvatarEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<Area | null>(null)
  const upload = useUploadAvatar()
  const remove = useDeleteAvatar()

  // Free the preview's object URL when it's replaced or the editor closes.
  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
  }, [imageUrl])

  const close = () => {
    setImageUrl(null)
    setZoom(1)
    setCrop({ x: 0, y: 0 })
  }

  const onFile = (file: File | undefined) => {
    if (!file) return
    const problem = imageProblem(file)
    if (problem) {
      toast.error(problem)
      return
    }
    setImageUrl(URL.createObjectURL(file))
  }

  const save = async () => {
    if (!imageUrl || !area) return
    try {
      const blob = await cropToSquareJpeg(imageUrl, area)
      await upload.mutateAsync(blob)
      toast.success('Photo updated')
      close()
    } catch (error) {
      toast.error("Couldn't update your photo", { description: getErrorMessage(error) })
    }
  }

  return (
    <>
      <div className="relative">
        <Avatar label={name} src={avatarUrl} size={size} className="ring-4 ring-surface" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-fg-secondary shadow-sm transition-colors hover:text-fg"
          aria-label={avatarUrl ? 'Change photo' : 'Add photo'}
          title={avatarUrl ? 'Change photo' : 'Add photo'}
        >
          <Camera className="h-4 w-4" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_TYPES.join(',')}
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            onFile(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </div>

      <Modal
        open={Boolean(imageUrl)}
        onClose={close}
        dismissible={!upload.isPending}
        title="Crop your photo"
        description="Drag to position, and zoom to fit your face in the circle."
        className="max-w-lg"
        footer={
          <>
            {avatarUrl && (
              <Button
                variant="ghost"
                className="mr-auto text-danger"
                leftIcon={<Trash2 className="h-4 w-4" />}
                loading={remove.isPending}
                disabled={upload.isPending}
                onClick={() =>
                  remove.mutate(undefined, {
                    onSuccess: () => {
                      toast.success('Photo removed')
                      close()
                    },
                    onError: (error) => toast.error("Couldn't remove your photo", { description: getErrorMessage(error) }),
                  })
                }
              >
                Remove photo
              </Button>
            )}
            <Button variant="ghost" onClick={close} disabled={upload.isPending}>
              Cancel
            </Button>
            <Button onClick={save} loading={upload.isPending} disabled={!area}>
              Save photo
            </Button>
          </>
        }
      >
        {imageUrl && (
          <>
            <div className="relative h-72 overflow-hidden rounded-lg bg-black sm:h-80">
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setArea(pixels)}
              />
            </div>
            <label className="mt-4 flex items-center gap-3 text-sm text-fg-secondary">
              Zoom
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="flex-1 accent-primary"
              />
            </label>
          </>
        )}
      </Modal>
    </>
  )
}
