import { expect, test } from '@playwright/test'

import { createClub, get } from './support/api.ts'

test.describe.configure({ mode: 'serial' })

test('F05: criação de clube pelo formulário, com o caixa inicial da API', async ({ page }) => {
  await page.goto('/clubes')
  await expect(page.getByText('Nenhum clube cadastrado')).toBeVisible()

  await page.getByRole('button', { name: 'Novo clube' }).first().click()
  const form = page.getByRole('dialog', { name: 'Novo clube' })
  await form.getByLabel('Nome').fill('Águias FC')
  await form.getByLabel('Sigla').fill('agu')
  await form.getByRole('button', { name: 'Criar clube' }).click()

  await expect(page.getByRole('heading', { name: 'Águias FC' })).toBeVisible()
  await expect(page.getByText('Águias FC (AGU) começa com 300,00 em caixa.')).toBeVisible()
  await expect(page.getByText('Nenhum jogador no elenco')).toBeVisible()
})

test('F05: nome repetido é recusado com o message da API', async ({ page }) => {
  await page.goto('/clubes')

  await page.getByRole('button', { name: 'Novo clube' }).click()
  const form = page.getByRole('dialog', { name: 'Novo clube' })
  await form.getByLabel('Nome').fill('  águias   fc ')
  await form.getByLabel('Sigla').fill('AGF')
  await form.getByRole('button', { name: 'Criar clube' }).click()

  await expect(form.getByRole('alert')).toHaveText('Já existe um clube com o nome "Águias FC".')
})

test('F05: lista com nome, sigla, caixa, valor do elenco e patrimônio, na ordem da API', async ({
  page,
}) => {
  await createClub('Delta FC', 'DFC')
  await createClub('Gama SC', 'GSC')
  await page.goto('/clubes')

  const table = page.getByRole('table', { name: 'Clubes' })
  await expect(table.getByRole('row')).toHaveCount(4)
  const byName = await get<{ name: string }[]>('/clubs?sort=name')
  for (const [index, club] of byName.entries()) {
    await expect(table.getByRole('row').nth(index + 1)).toContainText(club.name)
  }
  await expect(table.getByRole('row', { name: /Delta FC/ })).toContainText('300,00')

  await page.getByRole('button', { name: 'Ordenar: nome' }).click()
  await page.getByRole('menuitemradio', { name: 'Patrimônio (maior para o menor)' }).click()
  await expect(page.getByRole('button', { name: /patrimônio \(maior/ })).toBeVisible()
  const byNetWorth = await get<{ name: string }[]>('/clubs?sort=net_worth_desc')
  for (const [index, club] of byNetWorth.entries()) {
    await expect(table.getByRole('row').nth(index + 1)).toContainText(club.name)
  }
})
