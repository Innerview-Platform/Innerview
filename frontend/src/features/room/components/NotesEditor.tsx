import { useEffect, useRef } from 'react'
import { minimalSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, placeholder as placeholderExtension } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { yCollab } from 'y-codemirror.next'
import type { Awareness } from 'y-protocols/awareness'
import type * as Y from 'yjs'

const notesTheme = EditorView.theme(
  {
    '&': { backgroundColor: 'var(--color-surface)', fontSize: '13.5px', height: '100%' },
    '.cm-scroller': { fontFamily: 'var(--font-sans)', lineHeight: '1.6' },
    '.cm-content': { padding: '14px 16px' },
    '.cm-placeholder': { color: 'var(--color-fg-muted)' },
    '&.cm-focused': { outline: 'none' },
  },
  { dark: true },
)

interface NotesEditorProps {
  text: Y.Text
  undoManager: Y.UndoManager
  awareness?: Awareness | null
  readOnly?: boolean
  placeholder: string
  label: string
}

/** Markdown editor bound to a shared Yjs text (problem statement, private notes). */
export function NotesEditor({ text, undoManager, awareness = null, readOnly = false, placeholder, label }: NotesEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const view = new EditorView({
      parent: hostRef.current!,
      state: EditorState.create({
        doc: text.toString(),
        extensions: [
          minimalSetup,
          keymap.of([indentWithTab]),
          markdown(),
          EditorView.lineWrapping,
          placeholderExtension(placeholder),
          oneDark,
          notesTheme,
          yCollab(text, awareness, { undoManager }),
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly),
          EditorView.contentAttributes.of({ 'aria-label': label }),
        ],
      }),
    })
    return () => view.destroy()
  }, [text, undoManager, awareness, readOnly, placeholder, label])

  return <div ref={hostRef} className="h-full min-h-0 overflow-hidden" />
}
