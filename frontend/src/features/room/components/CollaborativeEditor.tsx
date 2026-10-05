import { useEffect, useRef } from 'react'
import { basicSetup } from 'codemirror'
import { Compartment, EditorState, Prec, type Extension } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { StreamLanguage } from '@codemirror/language'
import { cpp } from '@codemirror/lang-cpp'
import { go } from '@codemirror/lang-go'
import { java } from '@codemirror/lang-java'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { rust } from '@codemirror/lang-rust'
import { csharp } from '@codemirror/legacy-modes/mode/clike'
import { yCollab } from 'y-codemirror.next'
import type * as Y from 'yjs'
import type { Awareness } from 'y-protocols/awareness'
import { editorTheme } from '@/lib/codemirrorTheme'

/**
 * Languages the shared editor knows. Keys are Piston language names, so the selected key is sent
 * as-is with RUN_CODE. `template` seeds an empty editor and reads a line of input to show that the
 * terminal is interactive.
 */
export const EDITOR_LANGUAGES = {
  python: {
    label: 'Python',
    extension: () => python(),
    template: `name = input("What's your name? ")\nprint(f"Hello, {name}!")\n`,
  },
  javascript: {
    label: 'JavaScript',
    extension: () => javascript(),
    template: `const readline = require('readline')\nconst rl = readline.createInterface({ input: process.stdin, output: process.stdout })\n\nrl.question("What's your name? ", (name) => {\n  console.log(\`Hello, \${name}!\`)\n  rl.close()\n  process.stdin.destroy() // stdin stays open while the terminal is live; release it so the program exits\n})\n`,
  },
  typescript: {
    label: 'TypeScript',
    extension: () => javascript({ typescript: true }),
    template: `const greet = (name: string): string => \`Hello, \${name}!\`\n\nconsole.log(greet('InnerView'))\n`,
  },
  c: {
    label: 'C',
    extension: () => cpp(),
    template: `#include <stdio.h>\n\nint main(void) {\n    char name[100];\n    printf("What's your name? ");\n    fflush(stdout);\n    scanf("%99s", name);\n    printf("Hello, %s!\\n", name);\n    return 0;\n}\n`,
  },
  'c++': {
    label: 'C++',
    extension: () => cpp(),
    template: `#include <iostream>\n#include <string>\n\nint main() {\n    std::string name;\n    std::cout << "What's your name? " << std::flush;\n    std::getline(std::cin, name);\n    std::cout << "Hello, " << name << "!" << std::endl;\n    return 0;\n}\n`,
  },
  java: {
    label: 'Java',
    extension: () => java(),
    template: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n        System.out.print("What's your name? ");\n        System.out.flush();\n        String name = in.nextLine();\n        System.out.println("Hello, " + name + "!");\n    }\n}\n`,
  },
  go: {
    label: 'Go',
    extension: () => go(),
    template: `package main\n\nimport "fmt"\n\nfunc main() {\n\tvar name string\n\tfmt.Print("What's your name? ")\n\tfmt.Scanln(&name)\n\tfmt.Printf("Hello, %s!\\n", name)\n}\n`,
  },
  rust: {
    label: 'Rust',
    extension: () => rust(),
    template: `use std::io::{self, Write};\n\nfn main() {\n    print!("What's your name? ");\n    io::stdout().flush().unwrap();\n    let mut name = String::new();\n    io::stdin().read_line(&mut name).unwrap();\n    println!("Hello, {}!", name.trim());\n}\n`,
  },
  csharp: {
    label: 'C#',
    extension: (): Extension => StreamLanguage.define(csharp),
    template: `using System;\n\npublic class Program\n{\n    public static void Main()\n    {\n        Console.Write("What's your name? ");\n        string name = Console.ReadLine();\n        Console.WriteLine($"Hello, {name}!");\n    }\n}\n`,
  },
} as const

export type EditorLanguage = keyof typeof EDITOR_LANGUAGES

export const isEditorLanguage = (value: string | undefined): value is EditorLanguage =>
  value !== undefined && Object.hasOwn(EDITOR_LANGUAGES, value)

interface CollaborativeEditorProps {
  text: Y.Text
  undoManager: Y.UndoManager
  language: EditorLanguage
  label: string
  /** Ctrl/Cmd+Enter. */
  onRun?: () => void
  /** Shows other participants' cursors and selections with their names. */
  awareness?: Awareness | null
  readOnly?: boolean
}

export function CollaborativeEditor({ text, undoManager, language, label, onRun, awareness = null, readOnly = false }: CollaborativeEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const languageCompartment = useRef(new Compartment())
  const initialLanguage = useRef(language)
  const onRunRef = useRef(onRun)
  useEffect(() => {
    onRunRef.current = onRun
  })

  useEffect(() => {
    const view = new EditorView({
      parent: hostRef.current!,
      state: EditorState.create({
        doc: text.toString(),
        extensions: [
          Prec.highest(
            keymap.of([
              {
                key: 'Mod-Enter',
                run: () => {
                  onRunRef.current?.()
                  return true
                },
              },
            ]),
          ),
          basicSetup,
          keymap.of([indentWithTab]),
          editorTheme,
          languageCompartment.current.of(EDITOR_LANGUAGES[initialLanguage.current].extension()),
          yCollab(text, awareness, { undoManager }),
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly),
          EditorView.contentAttributes.of({ 'aria-label': label }),
        ],
      }),
    })
    viewRef.current = view
    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [text, undoManager, label, awareness, readOnly])

  useEffect(() => {
    viewRef.current?.dispatch({ effects: languageCompartment.current.reconfigure(EDITOR_LANGUAGES[language].extension()) })
  }, [language])

  return <div ref={hostRef} className="h-full min-h-0 overflow-hidden" />
}
