import { useEffect, useRef } from 'react'
import { basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { oneDark } from '@codemirror/theme-one-dark'

const theme = EditorView.theme(
  {
    '&': { backgroundColor: 'var(--color-surface)', fontSize: '13px', height: '100%' },
    '.cm-gutters': { backgroundColor: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' },
    '.cm-scroller': { fontFamily: 'var(--font-mono)' },
  },
  { dark: true },
)

/** A view-only CodeMirror for saved code (summary page, replay). */
export function ReadOnlyCode({ value, label }: { value: string; label: string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    const view = new EditorView({
      parent: hostRef.current!,
      state: EditorState.create({
        doc: '',
        extensions: [basicSetup, oneDark, theme, EditorState.readOnly.of(true), EditorView.editable.of(false), EditorView.contentAttributes.of({ 'aria-label': label })],
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
