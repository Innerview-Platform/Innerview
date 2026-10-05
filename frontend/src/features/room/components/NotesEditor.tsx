import { useEffect, useRef } from 'react'
import { minimalSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, placeholder as placeholderExtension } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { yCollab } from 'y-codemirror.next'
import type { Awareness } from 'y-protocols/awareness'
import type * as Y from 'yjs'
import { editorTheme } from '@/lib/codemirrorTheme'

const notesTheme = EditorView.theme({
  '&': { height: '100%', fontSize: '14px' },
  '.cm-scroller': { fontFamily: 'var(--font-sans)', lineHeight: '1.65' },
  '.cm-content': { padding: '16px 18px' },
  '.cm-activeLine': { backgroundColor: 'transparent' },
})

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
          editorTheme,
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
