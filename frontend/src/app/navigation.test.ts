import { describe, expect, it } from 'vitest'

import { breadcrumbFor, pageTitle } from './navigation'

describe('breadcrumbFor', () => {
  it.each([
    ['/jogadores', ['Mercado', 'Jogadores']],
    ['/clubes/3', ['Mercado', 'Clubes']],
    ['/partidas', ['Liga', 'Partidas']],
    ['/classificacao', ['Liga', 'Classificação']],
    ['/desconhecido', []],
  ])('%s', (pathname, expected) => {
    expect(breadcrumbFor(pathname)).toEqual(expected)
  })
})

describe('pageTitle', () => {
  it.each([
    [['Mercado', 'Jogadores'], 'Jogadores · Passe'],
    [['Mercado', 'Clubes', 'Águias FC'], 'Águias FC · Passe'],
    [[], 'Página não encontrada · Passe'],
  ])('%j', (breadcrumb, expected) => {
    expect(pageTitle(breadcrumb)).toBe(expected)
  })
})
