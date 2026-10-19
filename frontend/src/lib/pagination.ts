type PageLink = number | 'gap'

/** Page buttons to show: all of them when there are few, otherwise the ends and the neighbors. */
export function visiblePages(page: number, totalPages: number): PageLink[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }
  const pages = [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b)
  return pages.flatMap((value, index): PageLink[] =>
    index > 0 && value - pages[index - 1] > 1 ? ['gap', value] : [value],
  )
}

/** "Mostrando 11–20 de 23": positions of the first and last items of a page that has items. */
export function pageRange(page: number, limit: number, totalItems: number): [number, number] {
  return [(page - 1) * limit + 1, Math.min(page * limit, totalItems)]
}
