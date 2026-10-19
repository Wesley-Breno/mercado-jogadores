import { expect, test } from '@playwright/test'

import { clubReadyToPlay, createClub, get } from './support/api.ts'

type Side = { club_name: string; goals: number }
type DuelPlayer = { player_name: string; value: number }
type Match = {
  id: number
  home: Side
  away: Side
  duels: { order: number; attacker: DuelPlayer; defender: DuelPlayer; goal: boolean }[]
}

test.describe.configure({ mode: 'serial' })

let gavioes: { id: number }

test.beforeAll(async () => {
  gavioes = await clubReadyToPlay('Gaviões FC', 'GFC', [
    'Ivo Teles',
    'Hugo Vaz',
    'Lino Matos',
    'Mel Cunha',
    'Ugo Falcão',
  ])
  await clubReadyToPlay('Raposas EC', 'REC', [
    'Gil Goleiro',
    'Zeca Zagueiro',
    'Lia Lateral',
    'Ana Meia',
    'Ari Atacante',
  ])
  await createClub('Corujas FC', 'CFC')
})

test('F13: clube sem escalação completa recebe o message da API', async ({ page }) => {
  await page.goto('/partidas')

  await page.getByRole('button', { name: 'Nova partida' }).first().click()
  const form = page.getByRole('dialog', { name: 'Nova partida' })
  await form.getByLabel('Mandante').selectOption({ label: 'Corujas FC (CFC)' })
  await form.getByLabel('Visitante').selectOption({ label: 'Gaviões FC (GFC)' })
  await form.getByRole('button', { name: 'Jogar partida' }).click()

  await expect(form.getByRole('alert')).toContainText('Corujas FC')
})

test('F13: partida com o placar e os 6 duelos devolvidos pela API', async ({ page }) => {
  await page.goto('/partidas')

  await page.getByRole('button', { name: 'Nova partida' }).first().click()
  const form = page.getByRole('dialog', { name: 'Nova partida' })
  await form.getByLabel('Mandante').selectOption({ label: 'Gaviões FC (GFC)' })
  await form.getByLabel('Visitante').selectOption({ label: 'Raposas EC (REC)' })
  const answered = page.waitForResponse(
    (response) => response.url().endsWith('/matches') && response.request().method() === 'POST',
  )
  await form.getByRole('button', { name: 'Jogar partida' }).click()

  const match: Match = await (await answered).json()
  await expect(
    page.getByRole('heading', {
      name: `${match.home.club_name} ${match.home.goals} × ${match.away.goals} ${match.away.club_name}`,
    }),
  ).toBeAttached()
  for (const duel of match.duels) {
    const row = page.getByRole('row', { name: new RegExp(`^${duel.order} `) })
    await expect(row).toContainText(duel.attacker.player_name)
    await expect(row).toContainText(String(duel.attacker.value))
    await expect(row).toContainText(duel.defender.player_name)
    await expect(row).toContainText(String(duel.defender.value))
    await expect(row).toContainText(duel.goal ? 'Gol' : 'Sem gol')
  }
})

test('F14: histórico com filtro por clube, duelos ao abrir e classificação na ordem da API', async ({
  page,
}) => {
  await page.goto('/partidas')
  await page.getByLabel('Clube').selectOption({ label: 'Gaviões FC' })
  await expect(page).toHaveURL(`/partidas?club_id=${gavioes.id}`)
  const history = await get<Match[]>(`/matches?club_id=${gavioes.id}`)
  const rows = page.getByRole('table', { name: 'Histórico de partidas' }).getByRole('row')
  await expect(rows).toHaveCount(history.length + 1)

  await rows
    .nth(1)
    .getByRole('link', { name: /Ver duelos/ })
    .click()
  await expect(page.getByRole('region', { name: /Ataques do Gaviões FC/ })).toBeVisible()

  await page.goto('/classificacao')
  const standings = await get<{ club_name: string; points: number }[]>('/standings')
  const table = page.getByRole('table', { name: 'Classificação' }).getByRole('row')
  await expect(table).toHaveCount(standings.length + 1)
  for (const [index, row] of standings.entries()) {
    await expect(table.nth(index + 1)).toContainText(row.club_name)
  }
})
