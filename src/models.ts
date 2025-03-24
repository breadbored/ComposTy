export type Paginated<T> = {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    has_more: boolean
  }
}
