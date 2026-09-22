import { useEffect, useRef } from 'react'
import { basicSetup } from 'codemirror'
import { Compartment, EditorState, type Extension } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { cpp } from '@codemirror/lang-cpp'
import { java } from '@codemirror/lang-java'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'
import { yCollab } from 'y-codemirror.next'
import type * as Y from 'yjs'

export const EDITOR_LANGUAGES = {
  javascript: { label: 'JavaScript / TypeScript', extension: () => javascript({ typescript: true }) },
  python: { label: 'Python', extension: () => python() },
  java: { label: 'Java', extension: () => java() },
  cpp: { label: 'C / C++', extension: () => cpp() },
  plain: { label: 'Plain text', extension: (): Extension => [] },
} as const

export type EditorLanguage = keyof typeof EDITOR_LANGUAGES

const surfaceTheme = EditorView.theme(
  {
    '&': { backgroundColor: 'var(--color-surface)', fontSize: '13.5px' },
    '.cm-gutters': { backgroundColor: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' },
    '.cm-content': { padding: '12px 0' },
  },
  { dark: true },
)

interface CollaborativeEditorProps {
  text: Y.Text
  undoManager: Y.UndoManager
  language: EditorLanguage
  label: string
}

export function CollaborativeEditor({ text, undoManager, language, label }: CollaborativeEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const languageCompartment = useRef(new Compartment())
  const initialLanguage = useRef(language)

  useEffect(() => {
    const view = new EditorView({
      parent: hostRef.current!,
      state: EditorState.create({
        doc: text.toString(),
        extensions: [
          basicSetup,
          keymap.of([indentWithTab]),
          oneDark,
          surfaceTheme,
          languageCompartment.current.of(EDITOR_LANGUAGES[initialLanguage.current].extension()),
          yCollab(text, null, { undoManager }),
          EditorView.contentAttributes.of({ 'aria-label': label }),
        ],
      }),
    })
    viewRef.current = view
    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [text, undoManager, label])

  useEffect(() => {
    viewRef.current?.dispatch({ effects: languageCompartment.current.reconfigure(EDITOR_LANGUAGES[language].extension()) })
  }, [language])

  return <div ref={hostRef} className="h-full min-h-0 overflow-hidden" />
}
