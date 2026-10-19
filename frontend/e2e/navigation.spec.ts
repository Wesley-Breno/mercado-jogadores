import { expect, test } from '@playwright/test'

test('a URL do frontend abre a lista de jogadores', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/jogadores$/)
  await expect(page.getByRole('navigation', { name: 'Menu principal' })).toBeVisible()
})

test('o menu leva a cada módulo da liga', async ({ page }) => {
  await page.goto('/')
  const menu = page.getByRole('navigation', { name: 'Menu principal' })

  for (const label of ['Jogadores', 'Clubes', 'Partidas', 'Classificação']) {
    await expect(menu.getByRole('link', { name: label })).toBeVisible()
  }
})

test('endereço desconhecido mostra a página de não encontrado', async ({ page }) => {
  await page.goto('/endereco-que-nao-existe')

  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
})
