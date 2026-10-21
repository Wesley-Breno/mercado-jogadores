import { type Page, type Request, expect, test } from '@playwright/test'

import {
  brasiliaParts,
  buyPlayer,
  clubReadyToPlay,
  createClub,
  createPlayer,
} from './support/api.ts'

/**
 * Each of the 9 actions is sent with a double click on its button: the API must receive one request,
 * and the screen must show the success message.
 */

test.describe.configure({ mode: 'serial' })

let garcas: { id: number }
let falcoesId: number

test.beforeAll(async () => {
  await createPlayer({ name: 'Vítor Compra', position: 'ATA', level: 64 })
  garcas = await createClub('Garças EC', 'GEC')
  const squad = [
    { name: 'Gael Goleiro', position: 'GOL' as const },
    { name: 'Zeno Zagueiro', position: 'ZAG' as const },
    { name: 'Lauro Lateral', position: 'LAT' as const },
    { name: 'Mauro Meia', position: 'MEI' as const },
    { name: 'Artur Atacante', position: 'ATA' as const },
  ]
  for (const [index, seed] of squad.entries()) {
    const player = await createPlayer({ ...seed, level: 52 + index })
    await buyPlayer(player.id, garcas.id)
  }
  await clubReadyToPlay('Pumas FC', 'PFC', [
    'Pedro Goleiro',
    'Paulo Zagueiro',
    'Plínio Lateral',
    'Pietro Meia',
    'Pablo Atacante',
  ])
})

/** The requests the page sends to the API with this method and path. */
function apiRequests(page: Page, method: string, path: RegExp): Request[] {
  const sent: Request[] = []
  page.on('request', (request) => {
    if (request.method() === method && path.test(new URL(request.url()).pathname)) {
      sent.push(request)
    }
  })
  return sent
}

async function openRowAction(page: Page, playerName: string, action: string) {
  await page.goto(`/jogadores?search=${playerName}`)
  await page.getByRole('button', { name: `Ações de ${playerName}` }).click()
  await page.getByRole('menuitem', { name: action }).click()
}

test('cadastrar jogador: um só POST /players', async ({ page }) => {
  const sent = apiRequests(page, 'POST', /\/players$/)
  await page.goto('/jogadores')
  await page.getByRole('button', { name: 'Novo jogador' }).click()
  const form = page.getByRole('dialog', { name: 'Novo jogador' })
  const fields = {
    Nome: 'Clique Duplo',
    Idade: '25',
    Agilidade: '70',
    Velocidade: '60',
    Finalização: '60',
    Passe: '60',
    Drible: '60',
    Defesa: '60',
    Físico: '60',
    Potencial: '65',
  }
  for (const [label, value] of Object.entries(fields)) {
    await form.getByLabel(label, { exact: true }).fill(value)
  }
  await form.getByText('Meio-campo').click()

  await form.getByRole('button', { name: 'Salvar jogador' }).dblclick()

  await expect(page.getByRole('dialog', { name: 'Jogador cadastrado' })).toBeVisible()
  expect(sent).toHaveLength(1)
})

test('editar jogador: um só PUT', async ({ page }) => {
  const sent = apiRequests(page, 'PUT', /\/players\/\d+$/)
  await openRowAction(page, 'Clique Duplo', 'Editar')
  const form = page.getByRole('dialog', { name: 'Editar jogador' })
  await form.getByLabel('Nome').fill('Clique Duplo Neto')

  await form.getByRole('button', { name: 'Salvar alterações' }).dblclick()

  await expect(page.getByText(/Clique Duplo Neto foi salvo/)).toBeVisible()
  expect(sent).toHaveLength(1)
})

test('alterar condição: um só PATCH', async ({ page }) => {
  const sent = apiRequests(page, 'PATCH', /\/players\/\d+\/condition$/)
  await openRowAction(page, 'Clique Duplo Neto', 'Alterar condição')
  await page.getByRole('radio', { name: /^Mal condicionado/ }).check()

  await page.getByRole('button', { name: 'Salvar condição' }).dblclick()

  await expect(page.getByText(/agora está Mal condicionado/)).toBeVisible()
  expect(sent).toHaveLength(1)
})

test('excluir jogador: um só DELETE', async ({ page }) => {
  const sent = apiRequests(page, 'DELETE', /\/players\/\d+$/)
  await openRowAction(page, 'Clique Duplo Neto', 'Excluir')

  await page.getByRole('button', { name: 'Excluir jogador' }).dblclick()

  await expect(page.getByText('Jogador excluído')).toBeVisible()
  expect(sent).toHaveLength(1)
})

test('criar clube: um só POST /clubs', async ({ page }) => {
  const sent = apiRequests(page, 'POST', /\/clubs$/)
  await page.goto('/clubes')
  await page.getByRole('button', { name: 'Novo clube' }).first().click()
  const form = page.getByRole('dialog', { name: 'Novo clube' })
  await form.getByLabel('Nome').fill('Falcões FC')
  await form.getByLabel('Sigla').fill('FAL')

  await form.getByRole('button', { name: 'Criar clube' }).dblclick()

  await expect(page.getByText('Falcões FC (FAL) começa com 300,00 em caixa.')).toBeVisible()
  expect(sent).toHaveLength(1)
  falcoesId = Number(new URL(page.url()).pathname.split('/').at(-1))
})

test('comprar jogador: um só POST /buy', async ({ page }) => {
  const sent = apiRequests(page, 'POST', /\/players\/\d+\/buy$/)
  const { day, month, year } = brasiliaParts(new Date(Date.now() + 90 * 86_400_000))
  await page.goto('/jogadores?free=true&search=Vítor Compra')
  await page.getByRole('button', { name: 'Comprar Vítor Compra' }).click()
  const form = page.getByRole('dialog', { name: 'Comprar jogador' })
  await form
    .getByLabel('Clube comprador')
    .selectOption({ label: 'Falcões FC (FAL) · caixa 300,00' })
  await form.getByLabel('Data').fill(`${day}${month}${year}`)
  await form.getByLabel('Hora').fill('1500')

  await form.getByRole('button', { name: 'Confirmar compra' }).dblclick()

  await expect(page.getByRole('dialog', { name: 'Compra concluída' })).toBeVisible()
  expect(sent).toHaveLength(1)
})

test('vender jogador: um só POST /sell', async ({ page }) => {
  const sent = apiRequests(page, 'POST', /\/players\/\d+\/sell$/)
  await page.goto(`/clubes/${falcoesId}`)
  await page.getByRole('button', { name: 'Vender Vítor Compra' }).click()

  await page.getByRole('button', { name: 'Confirmar venda' }).dblclick()

  await expect(page.getByRole('dialog', { name: 'Venda concluída' })).toBeVisible()
  expect(sent).toHaveLength(1)
})

test('salvar escalação: um só PUT /lineup', async ({ page }) => {
  const sent = apiRequests(page, 'PUT', /\/clubs\/\d+\/lineup$/)
  await page.goto(`/clubes/${garcas.id}?aba=escalacao`)
  await page.getByRole('radio', { name: /2-1-1/ }).check()
  const slots = page.getByRole('combobox')
  const starters = [
    'Gael Goleiro (GOL)',
    'Zeno Zagueiro (ZAG)',
    'Lauro Lateral (LAT)',
    'Mauro Meia (MEI)',
    'Artur Atacante (ATA)',
  ]
  for (const [index, label] of starters.entries()) {
    await slots.nth(index).selectOption({ label })
  }

  await page.getByRole('button', { name: 'Salvar escalação' }).dblclick()

  await expect(page.getByText('Escalação salva')).toBeVisible()
  expect(sent).toHaveLength(1)
})

test('jogar partida: um só POST /matches', async ({ page }) => {
  const sent = apiRequests(page, 'POST', /\/matches$/)
  await page.goto('/partidas')
  await page.getByRole('button', { name: 'Nova partida' }).first().click()
  const form = page.getByRole('dialog', { name: 'Nova partida' })
  await form.getByLabel('Mandante').selectOption({ label: 'Garças EC (GEC)' })
  await form.getByLabel('Visitante').selectOption({ label: 'Pumas FC (PFC)' })

  await form.getByRole('button', { name: 'Jogar partida' }).dblclick()

  await expect(page.getByText('Partida jogada')).toBeVisible()
  await expect(page).toHaveURL(/\/partidas\/\d+$/)
  expect(sent).toHaveLength(1)
})
