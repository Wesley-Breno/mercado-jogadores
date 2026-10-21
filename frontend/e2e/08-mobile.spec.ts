import { type Locator, type Page, expect, test } from '@playwright/test'

import { buyPlayer, createClub, createPlayer, sellPlayer } from './support/api.ts'

/**
 * At 375 px, the player list and the club page with the history have no horizontal scroll of the
 * page (tables may scroll inside their own frame), and every action still opens.
 */

const WIDTH = 375

test.use({ viewport: { width: WIDTH, height: 667 }, isMobile: true, hasTouch: true })
test.describe.configure({ mode: 'serial' })

let tucanos: { id: number }

test.beforeAll(async () => {
  tucanos = await createClub('Tucanos FC', 'TFC')
  const kept = await createPlayer({ name: 'Rui Celular', position: 'MEI', level: 62 })
  const sold = await createPlayer({ name: 'Ivo Celular', position: 'ZAG', level: 58 })
  await createPlayer({ name: 'Davi Celular', position: 'ATA', level: 60 })
  await buyPlayer(kept.id, tucanos.id)
  await buyPlayer(sold.id, tucanos.id)
  await sellPlayer(sold.id)
})

async function expectNoHorizontalScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
}

async function expectInsideScreen(locator: Locator) {
  await expect(locator).toBeVisible()
  const box = await locator.boundingBox()
  expect(box?.x).toBeGreaterThanOrEqual(0)
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(WIDTH)
}

async function openAndCancel(page: Page, button: Locator, dialogName: string) {
  await button.click()
  const dialog = page.getByRole('dialog', { name: dialogName })
  await expectInsideScreen(dialog)
  await dialog.getByRole('button', { name: 'Cancelar' }).click()
  await expect(dialog).toHaveCount(0)
}

test('lista de jogadores a 375 px: sem rolagem horizontal e com as ações acessíveis', async ({
  page,
}) => {
  await page.goto('/jogadores?search=Celular')
  await expect(page.getByRole('row', { name: /Davi Celular/ })).toBeVisible()
  await expectNoHorizontalScroll(page)

  await openAndCancel(page, page.getByRole('button', { name: 'Novo jogador' }), 'Novo jogador')
  await openAndCancel(
    page,
    page.getByRole('button', { name: 'Comprar Davi Celular' }),
    'Comprar jogador',
  )

  await page.getByRole('button', { name: 'Ações de Davi Celular' }).click()
  for (const action of ['Editar', 'Alterar condição', 'Excluir']) {
    await expectInsideScreen(page.getByRole('menuitem', { name: action }))
  }
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Posição', exact: true }).click()
  await expectInsideScreen(page.getByRole('menuitemradio', { name: 'ATA · Atacante' }))
  await page.keyboard.press('Escape')
  await expectNoHorizontalScroll(page)
})

test('página do clube com o histórico a 375 px: sem rolagem horizontal e com as ações acessíveis', async ({
  page,
}) => {
  await page.goto(`/clubes/${tucanos.id}`)
  await expect(page.getByRole('row', { name: /Rui Celular/ })).toBeVisible()
  await expectNoHorizontalScroll(page)
  await expectInsideScreen(page.getByRole('link', { name: 'Comprar jogadores' }))
  await openAndCancel(
    page,
    page.getByRole('button', { name: 'Vender Rui Celular' }),
    'Vender Rui Celular?',
  )

  await page.getByRole('tab', { name: /Histórico/ }).click()

  await expect(
    page.getByRole('table', { name: 'Histórico de transações' }).getByRole('row'),
  ).toHaveCount(4)
  await expectInsideScreen(page.getByLabel('Totais do histórico'))
  await expectInsideScreen(page.getByRole('button', { name: 'Exportar CSV' }))
  await expectInsideScreen(page.getByRole('checkbox', { name: 'Venda' }))
  await expectInsideScreen(page.getByLabel('Jogador'))
  await expectNoHorizontalScroll(page)
})
