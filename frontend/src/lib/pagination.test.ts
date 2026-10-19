import { describe, expect, it } from 'vitest'

import { pageRange, visiblePages } from './pagination'

describe('visiblePages', () => {
  it('mostra todas as páginas quando são poucas', () => {
    expect(visiblePages(1, 3)).toEqual([1, 2, 3])
    expect(visiblePages(1, 0)).toEqual([])
  })

  it('resume as páginas distantes com reticências', () => {
    expect(visiblePages(1, 20)).toEqual([1, 2, 'gap', 20])
    expect(visiblePages(10, 20)).toEqual([1, 'gap', 9, 10, 11, 'gap', 20])
    expect(visiblePages(20, 20)).toEqual([1, 'gap', 19, 20])
  })
})

describe('pageRange', () => {
  it('calcula o primeiro e o último item da página', () => {
    expect(pageRange(1, 10, 23)).toEqual([1, 10])
    expect(pageRange(3, 10, 23)).toEqual([21, 23])
  })
})
