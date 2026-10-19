import { expect, test } from '@playwright/test'

import { buyPlayer, createClub, createPlayer, get, setCondition } from './support/api.ts'

test.describe.configure({ mode: 'serial' })

let leoes: { id: number }

test.beforeAll(async () => {
  leoes = await createClub('Leões da Serra', 'LDS')
  const squad = [
    { name: 'Rui Prado', position: 'GOL' as const },
    { name: 'Téo Brandão', position: 'ZAG' as const },
    { name: 'Davi Lins', position: 'LAT' as const },
    { name: 'Lauro Neves', position: 'MEI' as const },
    { name: 'Otto Rangel', position: 'ATA' as const },
    { name: 'Nei Soares', position: 'ATA' as const },
  ]
  for (const [index, seed] of squad.entries()) {
    const player = await createPlayer({ ...seed, level: 50 + index })
    await buyPlayer(player.id, leoes.id)
    if (seed.name === 'Nei Soares') {
      await setCondition(player.id, 'DOENTE')
    }
  }
})

test('F12: formação e um titular por vaga, sem DOENTE, e a escalação devolvida pela API', async ({
  page,
}) => {
  await page.goto(`/clubes/${leoes.id}?aba=escalacao`)
  await expect(
    page.getByText('Escalação incompleta: o Leões da Serra não pode jogar partidas'),
  ).toBeVisible()

  await page.getByRole('radio', { name: /2-1-1/ }).check()
  const slots = page.getByRole('combobox')
  await expect(slots.nth(4).getByRole('option', { name: /Nei Soares/ })).toHaveCount(0)
  await slots.nth(0).selectOption({ label: 'Rui Prado (GOL)' })
  await slots.nth(1).selectOption({ label: 'Téo Brandão (ZAG)' })
  await slots.nth(2).selectOption({ label: 'Davi Lins (LAT)' })
  await slots.nth(3).selectOption({ label: 'Lauro Neves (MEI)' })
  await slots.nth(4).selectOption({ label: 'Otto Rangel (ATA)' })
  const saved = page.waitForResponse(
    (response) => response.url().endsWith('/lineup') && response.request().method() === 'PUT',
  )
  await page.getByRole('button', { name: 'Salvar escalação' }).click()

  expect((await saved).status()).toBe(200)
  await expect(page.getByText('Escalação salva')).toBeVisible()
  await expect(page.getByText('Completa', { exact: true })).toBeVisible()
  const lineup = await get<{ formation: string; complete: boolean; players: { name: string }[] }>(
    `/clubs/${leoes.id}/lineup`,
  )
  expect(lineup.complete).toBe(true)
  for (const [index, player] of lineup.players.entries()) {
    await expect(slots.nth(index)).toHaveValue(/\d+/)
    await expect(slots.nth(index).locator('option:checked')).toContainText(player.name)
  }
})
