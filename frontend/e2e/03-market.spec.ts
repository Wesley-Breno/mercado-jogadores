import { expect, test } from '@playwright/test'

import { brasiliaParts, buyPlayer, createClub, createPlayer, get } from './support/api.ts'
import { brl, signed } from './support/format.ts'

type Club = { id: number; name: string; cash: number; squad_value: number; net_worth: number }

test.describe.configure({ mode: 'serial' })

let tubaroes: { id: number }
let mangue: { id: number }

test.beforeAll(async () => {
  tubaroes = await createClub('Tubarões EC', 'TUB')
  mangue = await createClub('Mangue FC', 'MFC')
  await createPlayer({ name: 'Otávio Rezende', position: 'ATA', level: 75 })
  const cheap = await createPlayer({ name: 'Tiago Moraes', position: 'GOL', level: 50 })
  await buyPlayer(cheap.id, mangue.id)
})

test('F06: compra de jogador livre com o fim da fidelidade enviado com -03:00 e o resultado da API', async ({
  page,
}) => {
  const { day, month, year } = brasiliaParts(new Date(Date.now() + 120 * 86_400_000))
  await page.goto('/jogadores?free=true&search=Otávio')

  await page.getByRole('button', { name: 'Comprar Otávio Rezende' }).click()
  const form = page.getByRole('dialog', { name: 'Comprar jogador' })
  await form
    .getByLabel('Clube comprador')
    .selectOption({ label: 'Tubarões EC (TUB) · caixa 300,00' })
  await form.getByLabel('Data').fill(`${day}${month}${year}`)
  await form.getByLabel('Hora').fill('1500')
  const sent = page.waitForRequest((request) => request.url().endsWith('/buy'))
  const answered = page.waitForResponse((response) => response.url().endsWith('/buy'))
  await form.getByRole('button', { name: 'Confirmar compra' }).click()

  expect((await sent).postDataJSON()).toEqual({
    club_id: tubaroes.id,
    loyalty_until: `${year}-${month}-${day}T15:00-03:00`,
  })
  const purchase = await (await answered).json()
  const result = page.getByRole('dialog', { name: 'Compra concluída' })
  await expect(result).toContainText(
    `Valor${'Valor de mercado no momento da compra'}${brl(purchase.value)}`,
  )
  await expect(result).toContainText(brl(purchase.fee))
  await expect(result).toContainText(brl(purchase.value + purchase.fee))
  await expect(result).toContainText(`${day}/${month}/${year} 15:00`)
  await expect(result).toContainText('ATIVO')
  await expect(result).toContainText(`Novo caixa do Tubarões EC${brl(purchase.club_cash)}`)
  await result.getByRole('button', { name: 'Fechar', exact: true }).click()

  await expect(page.getByRole('row', { name: /Otávio Rezende/ })).toHaveCount(0)
  await page.goto(`/jogadores?club_id=${tubaroes.id}`)
  await expect(page.getByRole('row', { name: /Otávio Rezende/ })).toContainText('Tubarões EC')
})

test('F07: página do clube e lista por patrimônio, na ordem e com os valores da API', async ({
  page,
}) => {
  const club = await get<
    Club & {
      players: { name: string; contract: { remaining_days: number; penalty_rate: number } }[]
    }
  >(`/clubs/${tubaroes.id}`)
  await page.goto(`/clubes/${tubaroes.id}`)

  await expect(page.getByRole('group', { name: 'Caixa' })).toContainText(brl(club.cash))
  await expect(page.getByRole('group', { name: 'Valor do elenco' })).toContainText(
    brl(club.squad_value),
  )
  await expect(page.getByRole('group', { name: 'Patrimônio' })).toContainText(brl(club.net_worth))
  const otavio = page.getByRole('row', { name: /Otávio Rezende/ })
  await expect(otavio).toContainText(String(club.players[0].contract.remaining_days))
  await expect(otavio).toContainText(`${club.players[0].contract.penalty_rate}%`)

  await page.goto('/clubes?sort=net_worth_desc')
  const byNetWorth = await get<Club[]>('/clubs?sort=net_worth_desc')
  const rows = page.getByRole('table', { name: 'Clubes' }).getByRole('row')
  for (const [index, item] of byNetWorth.entries()) {
    await expect(rows.nth(index + 1)).toContainText(item.name)
    await expect(rows.nth(index + 1)).toContainText(brl(item.net_worth))
  }
})

test('F08: venda pelo botão Vender, com confirmação e o resultado da API', async ({ page }) => {
  await page.goto(`/clubes/${tubaroes.id}`)

  await page.getByRole('button', { name: 'Vender Otávio Rezende' }).click()
  const confirm = page.getByRole('dialog', { name: 'Vender Otávio Rezende?' })
  const answered = page.waitForResponse((response) => response.url().endsWith('/sell'))
  await confirm.getByRole('button', { name: 'Confirmar venda' }).click()

  const sale = await (await answered).json()
  const result = page.getByRole('dialog', { name: 'Venda concluída' })
  for (const text of [
    `Valor de compra${brl(sale.purchase_value)}`,
    brl(sale.value),
    `Dias restantes${sale.remaining_days}`,
    brl(sale.penalty),
    `Lucro${signed(sale.profit)}`,
    brl(sale.fee),
    signed(sale.cash_change),
    sale.contract_status,
    `Novo caixa do Tubarões EC${brl(sale.club_cash)}`,
  ]) {
    await expect(result).toContainText(text)
  }
  await result.getByRole('button', { name: 'Fechar', exact: true }).click()
  await expect(page.getByText('Nenhum jogador no elenco')).toBeVisible()
})
