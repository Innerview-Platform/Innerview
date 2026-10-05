import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'
import type { Extension } from '@codemirror/state'

/**
 * Editor chrome and syntax colors expressed as theme tokens (see styles/index.css), so every editor
 * follows the light/dark switch without being reconfigured.
 */
const chrome = EditorView.theme({
  '&': { color: 'var(--color-fg)', backgroundColor: 'var(--color-surface)', fontSize: '13.5px' },
  '.cm-content': { caretColor: 'var(--color-primary)', padding: '12px 0' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--color-primary)', borderLeftWidth: '2px' },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'color-mix(in srgb, var(--color-primary) 22%, transparent)',
  },
  '.cm-gutters': { backgroundColor: 'var(--color-surface)', color: 'var(--color-fg-muted)', borderRight: '1px solid var(--color-border-subtle)' },
  '.cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--color-fg) 4%, transparent)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--color-fg)' },
  '.cm-matchingBracket, .cm-nonmatchingBracket': { backgroundColor: 'color-mix(in srgb, var(--color-primary) 18%, transparent)', outline: 'none' },
  '.cm-searchMatch': { backgroundColor: 'color-mix(in srgb, var(--color-warning) 28%, transparent)' },
  '.cm-foldPlaceholder': { backgroundColor: 'var(--color-elevated)', border: 'none', color: 'var(--color-fg-muted)' },
  '.cm-tooltip': { backgroundColor: 'var(--color-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)', color: 'var(--color-fg)' },
  '.cm-panels': { backgroundColor: 'var(--color-elevated)', color: 'var(--color-fg)' },
  '.cm-placeholder': { color: 'var(--color-fg-muted)' },
  // Remote cursors' name labels (y-codemirror).
  '.cm-ySelectionInfo': { fontFamily: 'var(--font-sans)', fontSize: '11px', padding: '1px 4px', borderRadius: '3px', opacity: '1' },
})

const syntax = HighlightStyle.define([
  { tag: [t.keyword, t.operatorKeyword, t.modifier, t.controlKeyword, t.moduleKeyword], color: 'var(--color-syntax-keyword)' },
  { tag: [t.string, t.special(t.string), t.regexp, t.character], color: 'var(--color-syntax-string)' },
  { tag: [t.number, t.bool, t.null, t.atom], color: 'var(--color-syntax-number)' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.macroName], color: 'var(--color-syntax-function)' },
  { tag: [t.typeName, t.className, t.namespace, t.definition(t.typeName)], color: 'var(--color-syntax-type)' },
  { tag: [t.propertyName, t.attributeName], color: 'var(--color-syntax-property)' },
  { tag: [t.variableName, t.definition(t.variableName)], color: 'var(--color-syntax-variable)' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: 'var(--color-syntax-comment)', fontStyle: 'italic' },
  { tag: [t.meta, t.processingInstruction], color: 'var(--color-fg-muted)' },
  { tag: t.invalid, color: 'var(--color-danger)' },
  // Markdown (problem statement, notes).
  { tag: t.heading, color: 'var(--color-fg)', fontWeight: '600' },
  { tag: t.strong, fontWeight: '600' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.link, color: 'var(--color-primary)', textDecoration: 'underline' },
  { tag: [t.monospace], color: 'var(--color-syntax-string)', fontFamily: 'var(--font-mono)' },
  { tag: [t.list, t.quote], color: 'var(--color-fg-secondary)' },
])

export const editorTheme: Extension = [chrome, syntaxHighlighting(syntax)]
