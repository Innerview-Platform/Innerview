/**
 * Spring Data `Page<T>` as serialized by the backend (PageImpl, not the VIA_DTO mode).
 * Only the fields the UI relies on are typed.
 */
export interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  /** Zero-based page index. */
  number: number
  size: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface PageParams {
  /** Zero-based page index (`page` query param). */
  page: number
  /** Page size (`limit` query param). */
  limit: number
}

export interface MessageResponse {
  message: string
}
