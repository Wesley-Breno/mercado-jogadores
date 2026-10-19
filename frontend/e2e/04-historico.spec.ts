import { readFile } from 'node:fs/promises'

import { expect, test } from '@playwright/test'

import {
  API_URL,
  buyPlayer,
  createClub,
  createPlayer,
  deletePlayer,
  get,
  sellPlayer,
} from './support/api.ts'
import { brl, signed } from './support/format.ts'

type Summary = {
  total_spent: number
  total_received: number
  total_fees: number
  total_penalties: number
  total_profit: number
}

test.describe.configure({ mode: 'serial' })

let epsilon: { id: number }

test.beforeAll(async () => {
  epsilon = await createClub('Épsilon EC', 'EPS')
  const kept = await createPlayer({ name: 'Heitor Gomes', position: 'MEI', level: 70 })
  const sold = await createPlayer({ name: 'Sávio Lima', position: 'MEI', level: 66 })
  const gone = await createPlayer({ name: 'Rafael Nogueira', position: 'LAT', level: 52 })
  for (const player of [kept, sold, gone]) {
    await buyPlayer(player.id, epsilon.id)
  }
  await sellPlayer(sold.id)
  await sellPlayer(gone.id)
  await deletePlayer(gone.id)
})

async function expectTotals(page: import('@playwright/test').Page, summary: Summary) {
  const totals = page.getByLabel('Totais do histórico')
  await expect(totals).toContainText(`Total pago em compras${brl(summary.total_spent)}`)
  await expect(totals).toContainText(`Total recebido em vendas${brl(summary.total_received)}`)
  await expect(totals).toContainText(`Taxas e comissões${brl(summary.total_fees)}`)
  await expect(totals).toContainText(`Multas${brl(summary.total_penalties)}`)
  await expect(totals).toContainText(`Lucro total${signed(summary.total_profit)}`)
}

test('F09 e F10: histórico com variação do caixa com sinal e os totais do summary', async ({
  page,
}) => {
  const history = await get<{ data: { cash_change: number }[]; summary: Summary }>(
    `/clubs/${epsilon.id}/transactions`,
  )
  await page.goto(`/clubes/${epsilon.id}`)

  await page.getByRole('tab', { name: /Histórico/ }).click()

  const rows = page.getByRole('table', { name: 'Histórico de transações' }).getByRole('row')
  await expect(rows).toHaveCount(history.data.length + 1)
  for (const [index, transaction] of history.data.entries()) {
    await expect(rows.nth(index + 1)).toContainText(signed(transaction.cash_change))
  }
  await expectTotals(page, history.summary)
})

test('F09 e F10: filtro por tipo e por jogador, com os totais do filtro', async ({ page }) => {
  await page.goto(`/clubes/${epsilon.id}?aba=historico`)
  await expect(page.getByLabel('Totais do histórico')).toBeVisible()

  await page.getByRole('checkbox', { name: 'Compra' }).click()
  await expect(page.getByRole('checkbox', { name: 'Compra' })).not.toBeChecked()

  const sales = await get<{ data: unknown[]; summary: Summary }>(
    `/clubs/${epsilon.id}/transactions?type=VENDA`,
  )
  await expect(
    page.getByRole('table', { name: 'Histórico de transações' }).getByRole('row'),
  ).toHaveCount(sales.data.length + 1)
  await expectTotals(page, sales.summary)

  await page.getByRole('checkbox', { name: 'Compra' }).click()
  await expect(page.getByRole('checkbox', { name: 'Compra' })).toBeChecked()
  await page.getByLabel('Jogador').selectOption({ label: 'Heitor Gomes' })
  await expect(page).toHaveURL(/player_id=/)
  await expect(
    page.getByRole('table', { name: 'Histórico de transações' }).getByRole('row'),
  ).toHaveCount(2)
})

test('F09: filtro por jogador excluído mostra o message da API', async ({ page }) => {
  await page.goto(`/clubes/${epsilon.id}?aba=historico`)
  await expect(page.getByLabel('Totais do histórico')).toBeVisible()

  await page.getByLabel('Jogador').selectOption({ label: 'Rafael Nogueira' })

  await expect(page.getByRole('alert')).toContainText('O filtro foi recusado')
  await expect(page.getByLabel('Totais do histórico')).toHaveCount(0)
})

test('F11: Exportar CSV baixa o arquivo da API pedido com os filtros aplicados', async ({
  page,
}) => {
  await page.goto(`/clubes/${epsilon.id}?aba=historico&type=VENDA`)
  await expect(page.getByLabel('Totais do histórico')).toBeVisible()

  const requested = page.waitForRequest((request) => request.url().includes('/export'))
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar CSV' }).click()

  expect(new URL((await requested).url()).search).toBe('?type=VENDA')
  const file = await readFile(await (await downloaded).path())
  const api = Buffer.from(
    await (
      await fetch(`${API_URL}/clubs/${epsilon.id}/transactions/export?type=VENDA`)
    ).arrayBuffer(),
  )
  expect(file.equals(api)).toBe(true)
  await expect(page.getByText('CSV baixado')).toBeVisible()
})
