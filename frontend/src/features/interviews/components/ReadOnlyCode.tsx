import { useEffect, useRef } from 'react'
import { basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { editorTheme } from '@/lib/codemirrorTheme'

const theme = EditorView.theme({ '&': { fontSize: '13px', height: '100%' } })

/** A view-only CodeMirror for saved code (summary page, replay). */
export function ReadOnlyCode({ value, label }: { value: string; label: string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    const view = new EditorView({
      parent: hostRef.current!,
      state: EditorState.create({
        doc: '',
        extensions: [basicSetup, editorTheme, theme, EditorState.readOnly.of(true), EditorView.editable.of(false), EditorView.contentAttributes.of({ 'aria-label': label })],
      }),
    })
    viewRef.current = view
    return () => view.destroy()
  }, [label])

  useEffect(() => {
    const view = viewRef.current
    if (view && view.state.doc.toString() !== value) view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
  }, [value])

  return <div ref={hostRef} className="h-full min-h-0 overflow-hidden" />
}
