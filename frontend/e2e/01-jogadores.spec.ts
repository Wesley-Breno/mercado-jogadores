import { expect, test } from '@playwright/test'

import { type PlayerSeed, createPlayer, get } from './support/api.ts'

/** 12 free players: more than one page of 10, with distinct values to check the order. */
const SQUAD: PlayerSeed[] = [
  { name: 'André Lacerda', position: 'GOL', age: 31, level: 62 },
  { name: 'Bruno Tavares', position: 'GOL', age: 29, level: 58 },
  { name: 'Danilo Freitas', position: 'ZAG', age: 30, agility: 25, level: 66 },
  { name: 'Diego Ramos', position: 'LAT', age: 20, level: 64 },
  { name: 'Eduardo Paiva', position: 'MEI', age: 26, level: 70 },
  { name: 'Ênio Carvalho', position: 'LAT', age: 18, level: 61 },
  { name: 'Felipe Moura', position: 'ZAG', age: 27, level: 72 },
  { name: 'Gabriel Antunes', position: 'ATA', age: 24, level: 68 },
  { name: 'Heitor Gomes', position: 'MEI', age: 22, level: 59 },
  { name: 'Ícaro Mendes', position: 'ATA', age: 32, level: 55 },
  { name: 'João Silva', position: 'ATA', age: 23, level: 74 },
  { name: 'Lucas Ferraz', position: 'MEI', age: 28, level: 57 },
]

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  for (const player of SQUAD) {
    await createPlayer(player)
  }
})

test('F01: 10 jogadores por página, total encontrado e navegação entre páginas', async ({
  page,
}) => {
  await page.goto('/jogadores')

  await expect(page.getByText('Mostrando 1–10 de 12 jogadores')).toBeVisible()
  const table = page.getByRole('table', { name: 'Jogadores' })
  await expect(table.getByRole('row')).toHaveCount(11)
  await expect(table.getByRole('row', { name: /André Lacerda/ })).toContainText('Livre')

  await page.getByRole('button', { name: 'Próxima' }).click()

  await expect(page.getByText('Mostrando 11–12 de 12 jogadores')).toBeVisible()
  await expect(table.getByRole('row')).toHaveCount(3)
})

test('F02: busca sem acento, filtros combinados e ordenação na ordem da API', async ({ page }) => {
  await page.goto('/jogadores')
  await expect(page.getByText('Mostrando 1–10 de 12 jogadores')).toBeVisible()

  await page.getByRole('searchbox', { name: 'Buscar por nome' }).fill('icaro')
  await expect(page.getByText('Mostrando 1–1 de 1 jogador')).toBeVisible()
  await expect(page.getByRole('row', { name: /Ícaro Mendes/ })).toBeVisible()
  await page.getByRole('button', { name: 'Limpar filtros' }).click()

  await page.getByRole('button', { name: 'Posição', exact: true }).click()
  await page.getByRole('menuitemradio', { name: 'ATA · Atacante' }).click()
  await page.getByRole('button', { name: 'Idade', exact: true }).click()
  await page.getByRole('dialog', { name: 'Faixa de idade' }).getByLabel('Até').fill('24')
  await page.getByRole('button', { name: 'Aplicar filtro' }).click()
  await expect(page.getByText('Mostrando 1–2 de 2 jogadores')).toBeVisible()

  await page.getByRole('button', { name: 'Ordenar: nome' }).click()
  await page.getByRole('menuitemradio', { name: 'Maior valor de mercado' }).click()
  const expected = await get<{ data: { name: string }[] }>(
    '/players?position=ATA&max_age=24&sort=value_desc',
  )
  await expect(
    page.getByRole('table', { name: 'Jogadores' }).getByRole('row').nth(1),
  ).toContainText(expected.data[0].name)
})

test('F02: "só livres" não se combina com o filtro por clube', async ({ page }) => {
  await page.goto('/jogadores')

  await page.getByRole('button', { name: /^Livres/ }).click()

  await expect(page.getByRole('button', { name: 'Clube', exact: true })).toBeDisabled()
  await expect(page.getByText('“Livres” não combina com o filtro por clube.')).toBeVisible()
})

test('F04: cadastro com os 7 indicadores e valor base e overall calculados pela API', async ({
  page,
}) => {
  await page.goto('/jogadores')
  await page.getByRole('button', { name: 'Novo jogador' }).click()
  const form = page.getByRole('dialog', { name: 'Novo jogador' })
  const fields = {
    Nome: 'Meia Lua',
    Idade: '25',
    Agilidade: '85',
    Velocidade: '70',
    Finalização: '68',
    Passe: '82',
    Drible: '79',
    Defesa: '55',
    Físico: '64',
    Potencial: '86',
  }
  for (const [label, value] of Object.entries(fields)) {
    await form.getByLabel(label, { exact: true }).fill(value)
  }
  await form.getByText('Meio-campo').click()
  await form.getByRole('button', { name: 'Salvar jogador' }).click()

  const result = page.getByRole('dialog', { name: 'Jogador cadastrado' })
  await expect(result.getByText('40,00').first()).toBeVisible()
  await expect(result.getByText('75', { exact: true })).toBeVisible()
  await result.getByRole('button', { name: 'Fechar', exact: true }).click()
  await expect(page.getByText('Mostrando 1–10 de 13 jogadores')).toBeVisible()
})

test('F04: edição e alteração de condição com os valores devolvidos pela API', async ({ page }) => {
  await page.goto('/jogadores?search=meia lua')

  await page.getByRole('button', { name: 'Ações de Meia Lua' }).click()
  await page.getByRole('menuitem', { name: 'Editar' }).click()
  const edit = page.getByRole('dialog', { name: 'Editar jogador' })
  await edit.getByLabel('Idade', { exact: true }).fill('24')
  await edit.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(edit.getByText('A idade não pode diminuir (atual: 25).')).toBeVisible()
  await edit.getByLabel('Idade', { exact: true }).fill('25')
  await edit.getByLabel('Nome').fill('Meia Lua Neto')
  await edit.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByText('Meia Lua Neto foi salvo. Valor de mercado: 40,00.')).toBeVisible()

  await page.getByRole('button', { name: 'Ações de Meia Lua Neto' }).click()
  await page.getByRole('menuitem', { name: 'Alterar condição' }).click()
  await page.getByRole('radio', { name: /^Mal condicionado/ }).check()
  await page.getByRole('button', { name: 'Salvar condição' }).click()
  await expect(
    page.getByText('Meia Lua Neto agora está Mal condicionado. Valor de mercado: 37,00.'),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Ações de Meia Lua Neto' }).click()
  await page.getByRole('menuitem', { name: 'Alterar condição' }).click()
  await page.getByRole('radio', { name: /^Doente/ }).check()
  await page.getByRole('button', { name: 'Salvar condição' }).click()
  await expect(page.getByText(/agora está Doente/)).toBeVisible()
  await page.getByRole('button', { name: 'Ações de Meia Lua Neto' }).click()
  await page.getByRole('menuitem', { name: 'Alterar condição' }).click()
  await expect(page.getByRole('radio', { name: /^Apto/ })).toBeDisabled()
})

test('F03: Excluir em jogador livre, com confirmação, e ele sai da lista', async ({ page }) => {
  await page.goto('/jogadores')
  await expect(page.getByText('Mostrando 1–10 de 13 jogadores')).toBeVisible()

  await page.getByRole('button', { name: 'Ações de André Lacerda' }).click()
  await page.getByRole('menuitem', { name: 'Excluir' }).click()
  await page.getByRole('button', { name: 'Excluir jogador' }).click()

  await expect(page.getByText('Jogador excluído')).toBeVisible()
  await expect(page.getByText('Mostrando 1–10 de 12 jogadores')).toBeVisible()
  await expect(page.getByRole('row', { name: /André Lacerda/ })).toHaveCount(0)
})
