import { useEffect } from 'react'
import { pageTitle } from '@/seo/site'

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title
    document.title = pageTitle(title)
    return () => {
      document.title = previous
    }
  }, [title])
}
