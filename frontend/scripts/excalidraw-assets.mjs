import { cpSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Use the installed package's fonts in both Vite development and the production nginx image.
const packageDir = dirname(fileURLToPath(import.meta.resolve('@excalidraw/excalidraw')))
const destination = resolve('public/excalidraw/fonts')
mkdirSync(destination, { recursive: true })
cpSync(resolve(packageDir, 'fonts'), destination, { recursive: true })
