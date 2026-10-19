# Passe — Mercado de Jogadores

Aplicação web fullstack do estudo de caso **SENAI/PE – CÓD. 237 Desenvolvedor I (Fullstack)**: o mercado de
jogadores de uma liga de futebol fictícia, com jogadores, clubes, compra e venda com contrato de fidelidade,
histórico de transações, escalação, partidas e classificação.

- `backend/`: API REST em Python com FastAPI, SQLAlchemy e PostgreSQL.
- `frontend/`: interface em React com TypeScript, criada com Vite.
- `docs/`: enunciado, barema, glossário, mockup e registro do uso de IA.

## 1. Pré-requisitos

| Ferramenta | Versão | Uso |
| --- | --- | --- |
| Docker Engine | 27 ou superior | Sobe banco, API e interface em contêineres |
| Docker Compose | v2 | Orquestra os serviços com um comando |
| PostgreSQL | 16 | Imagem pública `postgres:16.15-alpine3.24`, iniciada pelo Compose (não precisa instalar) |
| Python | 3.12 | Imagem pública `python:3.12.15-slim-bookworm`; no host, só para desenvolvimento e testes |
| Node.js (com npm) | 22 LTS | Imagem pública `node:22.23.3-alpine3.24` no build da interface; no host, para os testes, o lint e a formatação do frontend |

## 2. Banco de dados

PostgreSQL 16 em contêiner, com os dados no volume `db-data`. O banco é criado vazio pelos comandos da seção 3: ao
subir, a API aplica as migrations versionadas do Alembic (`backend/migrations/versions`) antes de iniciar o servidor.
Nenhum dado de exemplo é carregado.

Para recriar do zero, apagando todos os dados e aplicando as migrations de novo, com a aplicação no ar (na raiz do
repositório):

```bash
docker compose exec backend alembic downgrade base
docker compose exec backend alembic upgrade head
```

A API continua no ar durante a recriação, e os ids voltam a começar em 1. Outra forma, que também apaga o volume:
`docker compose down -v` seguido de `docker compose up -d --build`.

## 3. Instalar e executar

Na raiz do repositório:

```bash
cp .env.example .env
docker compose up -d --build
```

| Serviço | Endereço |
| --- | --- |
| Interface (frontend) | http://localhost:5173 |
| Origem da API (o prefixo `/api/v1` é acrescentado pelas rotas) | http://localhost:8000 |
| Documentação interativa (Swagger) | http://localhost:8000/docs |
| Verificação de saúde da API | http://localhost:8000/api/v1/health |

Para parar: `docker compose down`.

## 4. Variáveis de ambiente

Modelo em [`.env.example`](.env.example), na raiz, lido pelo Compose; o Compose usa os mesmos valores como padrão
se o `.env` não existir. Para executar fora do Docker, os modelos são [`backend/.env.example`](backend/.env.example) e
[`frontend/.env.example`](frontend/.env.example).

| Variável | Usada por | Função |
| --- | --- | --- |
| `POSTGRES_USER` | `db` | Usuário do PostgreSQL |
| `POSTGRES_PASSWORD` | `db` | Senha do PostgreSQL (só para o ambiente local) |
| `POSTGRES_DB` | `db` | Nome do banco da aplicação |
| `CORS_ORIGIN` | `backend` | Única origem liberada no CORS: a URL do frontend |
| `DATABASE_URL` | `backend` | Conexão da API e das migrations com o PostgreSQL; no Compose, montada a partir das variáveis `POSTGRES_*` |
| `TEST_DATABASE_URL` | testes | Banco usado pelos testes (padrão: `mercado_test` em `localhost`); no Compose, aponta para o serviço `db` |
| `VITE_API_URL` | `frontend` | Endereço da API com `/api/v1`, usado pelo navegador; entra no build da interface |
| `E2E_BASE_URL` | testes E2E | URL da interface testada pelo Playwright (padrão: `http://localhost:5173`) |
| `E2E_API_URL` | testes E2E | Endereço da API, com `/api/v1`, usado para preparar os dados (padrão: `http://localhost:8000/api/v1`) |

## 5. Estrutura de pastas e bibliotecas

```text
backend/
  app/
    main.py       cria a aplicação (factory), registra CORS, erros, logs e rotas
    core/         configuração, fuso de Brasília, exceções de domínio, tratamento central de erros e log
    api/          rotas (routers/), schemas de entrada e saída (schemas/), validadores estritos,
                  leitura estrita dos query params (params.py) e dependências (sessão do banco, ids
                  da URL); sem regra de negócio
    services/     casos de uso: orquestram repositórios e domínio e controlam a transação
    repositories/ consultas ao banco com o SQLAlchemy
    domain/       regras de negócio puras, sem framework nem banco: listas de valores, texto (V4, acentos,
                  ordem alfabética, busca), dinheiro (Decimal e arredondamento) e valores do jogador
                  (overall, valor base e valor de mercado)
    models/       modelos do ORM: tabelas e colunas em português, atributos em inglês
  migrations/     migrations do Alembic (versions/ guarda cada versão do schema)
  tests/          testes automatizados (pytest): api/ (HTTP) e db/ (schema e restrições)
frontend/
  src/
    app/          providers (React Query e rotas), layout, menu lateral e as rotas das telas
    api/          cliente HTTP (fetch) com o tratamento central do `message` das recusas, tipos e
                  funções de cada recurso da API (a única camada que chama a API)
    features/     telas por módulo (players/, clubs/, market/, transactions/, lineup/, matches/,
                  standings/): componentes, hooks do React Query e funções puras de cada tela, como a
                  leitura dos filtros do endereço e as vagas da escalação
    components/   componentes reutilizáveis de interface (ui/): tabela com os estados de
                  carregamento, vazio e erro, paginação, campo com rótulo e erro, menus e badges
    hooks/        hooks genéricos (atraso da busca, ação com clique único, atualização do mercado)
    lib/          formatação de moeda e data no padrão brasileiro e utilitários
    test/         configuração dos testes de componente (Vitest + Testing Library) e a API simulada
  e2e/            testes de ponta a ponta (Playwright) contra a aplicação no ar, um arquivo por
                  módulo do roteiro da interface (F01 a F14), com a preparação pela API em support/
  Dockerfile      build com Node e entrega dos arquivos estáticos com nginx
docs/             enunciado, barema, glossário, ficha de exemplo, mockup e registro do uso de IA
docker-compose.yml
```

### Backend

| Biblioteca | Versão | Motivo |
| --- | --- | --- |
| FastAPI | 0.146.0 | Framework da API REST (opção 3 da stack), com OpenAPI e Swagger nativos |
| Uvicorn | 0.54.0 | Servidor ASGI que executa a API |
| Pydantic | 2.14.1 | Validação declarativa dos corpos e serialização das respostas |
| pydantic-settings | 2.16.0 | Leitura da configuração a partir de variáveis de ambiente |
| SQLAlchemy | 2.1.5 | ORM com consultas parametrizadas e transações |
| Alembic | 1.20.0 | Migrations versionadas do banco |
| psycopg (binary) | 3.3.6 | Driver do PostgreSQL |
| pytest | 9.1.1 | Testes automatizados (desenvolvimento) |
| httpx2 | 2.14.0 | Cliente HTTP exigido pelo `TestClient` do Starlette nos testes (desenvolvimento) |
| Ruff | 0.17.1 | Lint e verificação de formatação (desenvolvimento) |

As versões de todas as dependências, inclusive as transitivas, estão fixadas em `backend/requirements.txt` e
`backend/requirements-dev.txt`.

### Frontend

| Biblioteca | Versão | Motivo |
| --- | --- | --- |
| React e React DOM | 19.3.1 | Interface (exigido pela stack) |
| Vite e @vitejs/plugin-react | 8.3.4 e 6.1.2 | Projeto criado com o template oficial `react-ts`; servidor de desenvolvimento e build |
| TypeScript | 6.0.3 | Tipagem estrita (`strict: true`) do código da interface |
| React Router | 8.4.0 | Navegação entre as telas, no modo declarativo (biblioteca), sem o modo framework |
| TanStack Query | 5.104.4 | Busca e cache dos dados da API, estado de envio dos botões e atualização após cada ação |
| React Hook Form | 7.90.0 | Formulários com validação antes do envio e mensagem junto ao campo |
| Zod e @hookform/resolvers | 4.6.7 e 5.9.2 | Esquemas de validação dos formulários ligados ao React Hook Form |
| Tailwind CSS e @tailwindcss/vite | 4.3.3 | Estilos e responsividade; a paleta padrão (zinc e blue) é a mesma do mockup |
| lucide-react | 1.59.0 | Ícones do menu e das telas, do mesmo estilo do mockup |
| @fontsource-variable/geist | 5.3.0 | Fonte Geist do mockup, empacotada no build (sem depender de CDN) |
| Vitest e jsdom | 5.0.5 e 30.1.3 | Testes de componente e de funções, sem modo de observação (desenvolvimento) |
| Testing Library (react, dom, user-event, jest-dom) | 16.3.3, 10.4.2, 14.6.8 e 7.0.1 | Testar os componentes como o usuário os usa (desenvolvimento) |
| Playwright | 1.64.1 | Testes de ponta a ponta no Chrome, na janela de 1366 × 768 da banca (desenvolvimento) |
| oxlint | 1.88.0 | Lint do código TypeScript e das regras de hooks do React (desenvolvimento) |
| Prettier | 3.9.10 | Formatação e verificação da formatação (desenvolvimento) |

As versões estão fixadas no `frontend/package.json` e no `frontend/package-lock.json`.

## 6. Testes, lint e formatação

Backend, em contêiner (só precisa do Docker), na raiz do repositório:

```bash
docker compose --profile test run --rm --build backend-test pytest
docker compose --profile test run --rm --build backend-test ruff check .
docker compose --profile test run --rm --build backend-test ruff format --check .
```

Os comandos terminam sozinhos; o de formatação só verifica, sem alterar arquivos. Os testes de banco usam o banco
`mercado_test`, criado e migrado por eles no mesmo PostgreSQL, sem tocar no banco da aplicação. A integração contínua
(`.github/workflows/ci.yml`) executa as mesmas verificações em Ubuntu 24.04 a cada envio.

Frontend, no host (Node.js 22 com npm), na pasta `frontend`:

```bash
npm ci
npm test
npm run lint
npm run format:check
```

Os três terminam sozinhos, sem modo de observação; o de formatação só verifica. Testes de ponta a ponta
(Playwright), com a aplicação no ar (`docker compose up -d --build`) e o **banco recriado** (seção 2), porque
seguem o roteiro da interface a partir da liga vazia; na pasta `frontend`:

```bash
npx playwright install chromium
npm run test:e2e
```

Eles preparam pela API só o que cada item não verifica na tela e, se o banco não estiver vazio, param antes de
começar com a instrução de recriá-lo. Na integração contínua, o job `compose-e2e` sobe a aplicação com os
comandos da seção 3 em Ubuntu 24.04 e roda esses testes.

Alternativa no host para o backend (Python 3.12 com `venv`), com o banco no ar (`docker compose up -d db`),
na pasta `backend`:

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
cp .env.example .env
.venv/bin/pytest
.venv/bin/alembic upgrade head
.venv/bin/uvicorn app.main:create_app --factory --reload --no-access-log
```

## 7. Guia para a avaliação

Mapa de onde está cada item dos roteiros, para conferir no código e nos testes. Com a aplicação no ar, a
documentação interativa da API fica em http://localhost:8000/docs.

### Roteiro da API (B1)

| Itens | Regras | Onde está | Testes |
| --- | --- | --- | --- |
| B01 a B04 | Cadastro, validação, edição e condição | `api/validators.py`, `api/schemas/players.py`, `services/players.py` | `tests/api/test_players_create.py`, `test_players_update.py`, `test_error_handling.py` |
| B05 e B06 | Valor de mercado, overall e valor base (RN02 a RN06) | `domain/pricing.py`, `services/valuation.py` | `tests/domain/test_pricing.py` (tabelas do enunciado) |
| B07 | Busca, filtros, ordenação e paginação (RN07) | `api/params.py`, `domain/player_listing.py`, `services/player_listing.py` | `tests/api/test_players_list.py` |
| B08 | Exclusão lógica (RN09) | `services/players.py` | `tests/api/test_players_update.py` |
| B09 e B17 | Clubes, sigla, limite e ordem por patrimônio (RN10 e RN11) | `domain/club_rules.py`, `services/clubs.py` | `tests/api/test_clubs.py`, `tests/domain/test_club_rules.py` |
| B10 a B13 | Compra, taxa, limite de caixa e fidelidade (RN01, RN12 a RN14) | `domain/market.py`, `services/market.py` | `tests/api/test_market_buy.py`, `tests/domain/test_market.py` |
| B14 a B16 | Multa, venda, comissão e recompra (RN15 e RN16) | `domain/market.py` (`settle_sale`), `services/market.py` | `tests/api/test_market_sell.py`, `tests/domain/test_market.py` |
| B18 e B19 | Histórico, `summary` e CSV (RN17 e RN18) | `domain/transaction_summary.py`, `services/transactions.py`, `api/transactions_csv.py` | `tests/api/test_transactions.py`, `tests/domain/test_transaction_summary.py` |
| B20 | Escalação (RN19) | `domain/lineup.py`, `services/lineups.py` | `tests/api/test_lineups.py`, `tests/domain/test_lineup.py` |
| B21 e B22 | Partida, histórico de partidas e classificação (RN20 e RN21) | `domain/match_engine.py`, `domain/standings.py`, `services/matches.py` | `tests/api/test_matches.py`, `test_standings.py`, `tests/domain/test_match_engine.py`, `test_standings.py` |
| Banco | 7 tabelas, chaves e unicidades | `models/`, `migrations/versions/` | `tests/db/test_schema.py` |

Os caminhos acima são relativos a `backend/app` e `backend/tests`.

### Roteiro da interface (F1)

| Itens | Tela | Teste de ponta a ponta |
| --- | --- | --- |
| F01 a F04 | Jogadores (`/jogadores`): tabela, busca, filtros, ordenação, cadastro, edição, condição e exclusão | `frontend/e2e/01-jogadores.spec.ts` |
| F05 | Clubes (`/clubes`): lista ordenável e criação | `frontend/e2e/02-clubes.spec.ts` |
| F06 a F08 | Comprar na linha do jogador livre; página do clube (`/clubes/:id`) com Vender | `frontend/e2e/03-mercado.spec.ts` |
| F09 a F11 | Aba Histórico do clube: filtros, totais e Exportar CSV | `frontend/e2e/04-historico.spec.ts` |
| F12 | Aba Escalação do clube | `frontend/e2e/05-escalacao.spec.ts` |
| F13 e F14 | Partidas (`/partidas`), partida com os duelos (`/partidas/:id`) e classificação (`/classificacao`) | `frontend/e2e/06-liga.spec.ts` |

Os testes de componente (Vitest) de cada tela ficam ao lado dela, em `frontend/src/features/`, e cobrem também os
estados de carregamento, lista vazia e erro.

## 8. Decisões e premissas

### Backend: contrato da API

- A API responde só nos caminhos sem barra final: um caminho com barra final não redireciona (o roteiro da
  banca não segue redirecionamentos) e responde 404.
- Toda recusa tem o corpo `{"message": "..."}` em português e `Content-Type: application/json`. Erros de validação do
  FastAPI, que por padrão seriam 422, respondem 400; um erro inesperado responde 500 com mensagem genérica, sem
  detalhes internos, e o detalhe vai só para o log da aplicação.
- Método não previsto num caminho existente responde 405 (o enunciado aceita 404 ou 405).
- Corpo enviado sem `Content-Type: application/json` não é lido como JSON (padrão do FastAPI contra CSRF) e a
  requisição é recusada com 400 por falta do corpo.
- Validação estrita dos campos: inteiro só como número JSON (`50.0` vale 50; `"15"`, `true` e `50.5` são
  recusados), listas de valores sensíveis a maiúsculas, `null` tratado como ausente e campos desconhecidos ou
  controlados pelo sistema ignorados. A mensagem diz o campo e o motivo, em português.
- Id da URL que não é inteiro positivo sem zeros à esquerda, ou que passa de 2.147.483.647, responde 404 (V8),
  conferido por uma dependência antes da lógica do endpoint.
- Query params lidos como texto e validados à mão: inteiros só com dígitos e sem zeros à esquerda, decimais no
  formato `10.55`, listas exatamente como no enunciado e parâmetro presente com valor vazio recusado (400).
  Parâmetro desconhecido é ignorado. As faixas sem um dos limites usam o extremo do campo (idade 16 a 45, valor
  0 a 550).
- Datas nas respostas: sempre convertidas para -03:00 e sem frações de segundo (`2027-03-02T10:15:00-03:00`).
- Valores em moedas saem como números JSON (`40.0`), e não como texto, que é o padrão do Pydantic para `Decimal`.
- V4: só o espaço U+0020 é removido das pontas e compactado; outros espaços Unicode (como o U+00A0) são mantidos,
  e caracteres de controle (categoria `Cc`, como tabulação e quebra de linha) são recusados.
- Mensagens de recusa citam os valores em formato brasileiro (`O custo da compra (50,40) passa do limite de 50% do
  caixa (50,00).`).
- Nome ou sigla de clube repetidos: a mensagem cita o clube já cadastrado (`Já existe um clube com o nome "Águias
  FC".`, `A sigla AGU já é do clube "Águias FC".`), para quem digitou "águias fc" entender com qual nome bateu.
- Log: uma linha por requisição, com data e hora de Brasília, método, caminho e status, pelo módulo `logging` da
  biblioteca padrão. O log de acesso do Uvicorn fica desligado (`--no-access-log`) para não duplicar a linha.
- Endpoint adicional `GET /api/v1/health`, usado para saber quando a API está no ar.

### Backend: regras de negócio

- O instante do servidor vem de um relógio injetável (`core/clock.py`), sempre em -03:00, usado por todas as regras
  de data; nos testes, ele pode ser trocado por um relógio fixo.
- Dinheiro sempre em `Decimal`, nunca em `float`. O arredondamento para 2 casas usa `ROUND_HALF_UP`, que no Python
  leva o 5 para longe do zero também nos negativos (−0,385 → −0,39), e é feito uma vez, no resultado final.
- Overall e valor de mercado são calculados a cada consulta, num único lugar (`services/valuation.py`, que usa
  `domain/pricing.py`); o valor base é calculado uma vez, no cadastro, e gravado.
- Ordem alfabética e busca por nome são calculadas no Python (minúsculas, sem acentos, comparação por code point),
  e não pela collation do banco, para seguir a regra das Premissas em qualquer ambiente.
- Listagem de jogadores (RN07): posição, condição, livre ou com clube, clube e idade são filtrados no banco; a
  busca, a faixa de valor de mercado (que é calculado, não gravado) e a ordenação são feitas no Python, com as
  mesmas funções do domínio, e a paginação vem por último. Com no máximo algumas centenas de jogadores, isso
  evita duplicar em SQL a fórmula do valor de mercado.
- Na ordenação, os critérios pedidos vêm primeiro, e o empate é desfeito pelo nome (ordem das Premissas) e
  depois pelo id; os dois sentidos de valor e de idade são o mesmo campo, então `value_asc,value_desc` é 400.
- Edição, condição e exclusão de jogador travam a linha do jogador (`SELECT ... FOR UPDATE`) durante a operação,
  para que duas operações simultâneas sobre o mesmo jogador não se sobreponham.
- Alteração de condição: enviar a condição atual responde 200 sem gravar nada; passar a `DOENTE` tira o jogador
  da escalação na mesma transação (RN19); de `DOENTE` direto para `APTO` é 409.
- Clubes: a criação trava a tabela `clubes` (`LOCK TABLE ... SHARE ROW EXCLUSIVE`) durante a transação, para que
  duas criações simultâneas não passem do limite de 20 clubes nem repitam nome ou sigla; leituras continuam
  livres. A sigla é conferida contra o nome sem acentos e sem diferenciar maiúsculas: a primeira letra da sigla é a
  primeira letra do nome, e as outras aparecem depois, na mesma ordem.
- `POST /clubs` responde os campos mínimos do clube (sem o elenco, que nasce vazio); `GET /clubs/{id}` traz também
  `players`, cada um com os campos de `GET /players/{id}` e o `contract`.
- Dias restantes de fidelidade e percentual de multa (RN15) ficam num único lugar (`domain/market.py`) e servem
  tanto à consulta do clube quanto à venda. Os dias são contados com fração e arredondados para cima.
- Compra (RN12 a RN14): numa única transação do banco, com as linhas do jogador e do clube travadas, sempre nessa
  ordem (a venda usa a mesma ordem, o que evita deadlock). O preço é o valor de mercado no momento; a taxa só existe
  acima de 30,00; o limite compara `custo × 2` com o caixa, para não arredondar a metade (caixa 261,15 → limite
  130,575). Ordem das recusas: dados inválidos (400), jogador ou clube inexistente (404) e regras de negócio
  (409: jogador não livre, recompra pelo clube que vendeu, elenco com 12, custo acima do limite).
- Fim da fidelidade fora da janela (não futuro ou mais de 1.095 dias depois da compra) é 400, como manda o item
  2.3.1 do enunciado, e é conferido antes de buscar o jogador e o clube.
- Venda (RN15 e RN16): todos os valores (dias restantes, percentual e multa com teto de 10,00, lucro, comissão
  progressiva arredondada uma vez e crédito) saem de uma única função do domínio, `settle_sale`. O contrato vira
  `RESCINDIDO` quando há multa e `ENCERRADO` quando a fidelidade foi cumprida; o jogador volta a ficar livre, sai
  da escalação e a transação `VENDA` é gravada, tudo na mesma transação do banco. Caixa baixo não impede venda.
- Histórico (RN17): as transações guardam nome e valores do momento e nunca são recalculadas; o `summary` é
  calculado num único lugar (`domain/transaction_summary.py`) sobre as transações já filtradas. `player_id` de
  jogador excluído é 404, mas as transações dele continuam no histórico sem o filtro.
- Exportação CSV (RN18): gerada com o módulo `csv` da biblioteca padrão (separador `;`, aspas só quando o nome tem
  `;` ou aspas, com as aspas internas duplicadas), em UTF-8 sem BOM e com LF em todas as linhas. A resposta traz
  `Content-Disposition` com o nome do arquivo; as recusas continuam em JSON.
- Escalação (RN19): o `PUT` substitui a escalação inteira numa transação; as recusas não gravam nada. Jogadores
  são travados antes do clube, a mesma ordem da venda, para evitar deadlock entre as duas operações. `complete` é
  `true` só com a formação salva e os 5 titulares; titular vendido ou que passa a `DOENTE` sai da escalação e não
  volta sozinho.
- Partida (RN20): o motor é uma função pura do domínio (`domain/match_engine.py`), sem sorteio. Os titulares seguem a
  ordem do elenco (o único GOL primeiro e os jogadores de linha do mais recuado ao mais avançado); o efeito de
  `MAL_CONDICIONADO` é `(atributo × 85 + 50) // 100`, em inteiros, para arredondar o meio para cima sem erro de
  ponto flutuante. A partida e os 6 duelos, com nomes, posições, condições, atributos e valores do momento, são
  gravados numa transação; as consultas leem o que foi gravado e não recalculam nada.
- Ordem das recusas da partida: corpo ou ids inválidos e mandante igual ao visitante (400), clube inexistente
  (404) e escalação incompleta em qualquer um dos lados (409). O nome do clube na resposta é o atual, porque o
  enunciado não prevê edição de clube.
- Classificação (RN21): calculada a cada consulta a partir dos placares gravados, com todos os clubes (os que não
  jogaram aparecem zerados) e a ordem pontos, saldo, gols marcados, nome (ordem das Premissas) e id.

### Backend: banco de dados

- Banco: as 7 tabelas e colunas com os nomes do enunciado; o ORM liga os atributos em inglês às colunas em
  português. Ids inteiros com autoincremento (`SERIAL`), moeda em `NUMERIC` com a precisão do enunciado e datas em
  `TIMESTAMP WITH TIME ZONE`, para guardar o instante exato.
- RN10 no banco: índice único em `lower(nome)`. O nome é gravado já normalizado pela V4, então o índice ignora
  maiúsculas e minúsculas, mas não acentos ("águias fc" repete "Águias FC"; "Aguias FC" não repete).
- Restrições além das exigidas, como defesa extra: `CHECK` nas listas de valores (posição, condição, situação do
  contrato, tipo de transação e formação) e índice único parcial que permite um só contrato `ATIVO` por jogador.
  Os limites numéricos ficam só na API, como a banca indicou (issue #3).

### Frontend: geral

- Frontend servido por nginx a partir do build do Vite (arquivos estáticos), com todas as rotas apontando para o
  `index.html` (rotas da SPA). A URL da API entra no build (`VITE_API_URL`). A raiz `/` abre a lista de jogadores.
- Lint do frontend com o oxlint, que é o padrão do template oficial do Vite (`create-vite`), e formatação com o
  Prettier.
- Diálogos com o elemento nativo `<dialog>` do navegador: o foco fica preso no diálogo, Esc fecha (menos durante
  o envio) e o foco volta para o botão que o abriu.
- Menus que abrem sobre a página (filtros, ordenação e o "⋯" de cada linha) acompanham o botão quando a página
  rola e não são cortados pela tabela; no celular, aparecem como painel no pé da tela.
- Formulários: a tela confere, antes de enviar, os campos obrigatórios e os limites de cada campo (nome de 3 a
  100 caracteres, idade de 16 a 45, agilidade de 1 a 100, atributos e potencial de 1 a 99), com a mensagem junto
  ao campo. As regras que cruzam campos (soma dos atributos, potencial e idade, agilidade com 35 anos ou mais)
  ficam só na API, e o `message` da recusa aparece no próprio formulário.
- Clique duplo: o botão de envio fica desabilitado do clique até a resposta da API, então sai um só pedido.
- Datas aparecem como `07/11/2026 10:30` (sem vírgula), sempre no fuso `America/Sao_Paulo`; números inteiros
  grandes com separador de milhar (`1.089` dias).
- Menu lateral (extras opcionais do mockup): contadores de jogadores, clubes e partidas, a lista de clubes com o
  botão "+" para criar um clube e o cartão da liga com a última partida. Os números vêm da API
  (`meta.total_items`, `GET /clubs` e `GET /matches`) e são atualizados depois de cada ação; se a API estiver
  fora do ar, o menu continua funcionando sem eles. A lista de clubes e o cartão aparecem só em telas largas.

### Frontend: jogadores

- Lista de jogadores: busca, filtros, aba, ordem e página ficam no endereço (`/jogadores?condition=APTO&page=2`),
  com os mesmos nomes da API; assim o botão Voltar e o recarregar mantêm a tela. Cada pedido envia `sort`, `page`
  e `limit=10` explícitos. Valores do endereço que a API recusaria são ignorados.
- Busca por nome: o pedido sai 350 ms depois da última tecla e só a partir de 2 letras (a API recusa 1 letra com
  400); com 1 letra, a tela avisa que faltam letras.
- "Só livres" e o filtro por clube não se combinam (a API recusa com 400): com a aba Livres aberta, o filtro por
  clube fica desabilitado, e com um clube escolhido, a aba Livres fica desabilitada, com o motivo na tela.
- Faixas de idade e de valor de mercado: aceitam um lado só ("a partir de 18"); o valor pode ser digitado com
  vírgula (`10,50`) e é enviado com ponto (`10.50`). A tela confere os limites (16 a 45 e 0 a 550) e se o "De"
  não passa do "Até" antes de enviar.
- Contadores das abas Todos, Livres e Em clubes: a aba aberta usa o total da lista; as outras pedem o mesmo
  filtro com `limit=1` e leem `meta.total_items`, sem contar nada na tela.
- Depois do cadastro, a tela mostra o valor base, o valor de mercado e o overall da resposta do `POST /players`
  (nada é calculado na tela), e a lista de jogadores é buscada de novo antes do aviso de sucesso.
- Edição e condição: das recusas que o enunciado deixa a tela prever, a tela impede três com o motivo à vista:
  mudar a posição de jogador com clube (as outras posições ficam desabilitadas), diminuir a idade (erro junto ao
  campo) e passar de `DOENTE` direto para `APTO` (opção desabilitada). As demais recusas vão para a API, e o
  `message` aparece no diálogo.
- Depois de editar ou de mudar a condição, a lista de jogadores e a de clubes (valor do elenco e patrimônio) são
  buscadas de novo, também quando a API recusa, porque a recusa pode vir de dados que mudaram depois de a tela
  abrir. O aviso de sucesso mostra o valor de mercado devolvido pela API.
- Exclusão (F03): o item Excluir do menu da linha fica ativo só para jogador livre, como pede o enunciado; para
  jogador com clube ele aparece desabilitado, com o motivo. A confirmação mostra o jogador, e o botão fica
  desabilitado desde o clique, então um clique duplo envia um só `DELETE`. Se a API recusar (jogador que entrou
  num clube ou foi excluído depois de a tela abrir), o `message` aparece no diálogo e a lista é buscada de novo.
- Detalhes do jogador (extra do mockup): "Ver detalhes" no menu da linha (e no aviso de jogador cadastrado) abre
  um painel lateral com os valores devolvidos pela API (valor de mercado, valor base, overall e potencial), os
  seis atributos desenhados na escala de 1 a 99 com o potencial ao fundo, e as ações Editar, Alterar condição e
  Comprar (só para jogador livre). No cadastro, a "Prévia dos atributos" desenha os números enquanto são
  digitados; overall e valor base continuam vindo só da API.

### Frontend: clubes, mercado e histórico

- Clubes (F05): a lista pede sempre `GET /clubs?sort=...` com a ordem escolhida (nome por padrão; patrimônio do
  maior para o menor ou do menor para o maior) e mostra os clubes na ordem devolvida, sem reordenar na tela. A
  ordem fica no endereço (`/clubes?sort=net_worth_desc`).
- Criação de clube: a tela confere o nome (3 a 60 caracteres) e a sigla (3 letras), e envia a sigla em
  maiúsculas. As regras de palavras, de caracteres e de correspondência entre sigla e nome, o nome repetido
  (RN10), a sigla repetida e o limite de 20 clubes ficam na API, e o `message` aparece no formulário.
- Depois de criar um clube, a tela abre a página dele, como no mockup. O nome do clube na tabela de jogadores
  leva à página do clube.
- Página do clube (F07, `/clubes/:id`): caixa, valor do elenco e patrimônio vêm de `GET /clubs/{id}`, e o elenco
  aparece na ordem devolvida (RN11), com valor de mercado, valor de compra, fim da fidelidade (data e hora de
  Brasília), dias restantes e % de multa da resposta; nada é calculado na tela. O contador "N de 12" só conta os
  jogadores devolvidos. Id inexistente no endereço mostra "Clube não encontrado" (a API responde 404).
- Página do clube em abas (Elenco, Escalação e Histórico), com a aba no endereço (`/clubes/1?aba=historico`).
- Compra (F06): o botão Comprar aparece na linha de cada jogador livre (e no menu "⋯"). O fim da fidelidade é
  digitado em dois campos de texto, data (`dd/mm/aaaa`) e hora (`hh:mm`), com as barras e os dois-pontos postos
  enquanto se digita, e é enviado como `AAAA-MM-DDTHH:MM-03:00`. Campos de texto, e não os de data do navegador,
  porque estes seguem o idioma do sistema (em inglês, `12/11/2027` viraria 11 de dezembro). A tela confere se a
  data existe no calendário e se a hora vai de 00:00 a 23:59; a janela "depois de agora e até 1.095 dias" depende
  do momento e fica na API, assim como o limite de 50% do caixa, o elenco cheio e a recompra.
- O resultado da compra mostra o valor, a taxa, o fim da fidelidade, o contrato e o novo caixa da resposta da
  API; o custo total é a soma de valor e taxa, a única conta feita na tela, como o enunciado permite.
- Venda (F08): botão Vender em cada jogador do elenco, na página do clube, com confirmação que mostra o contrato
  como a página o recebeu (valor de compra, fim da fidelidade, dias restantes e % de multa se vender agora). O
  `POST /players/{id}/sell` vai sem corpo, e o resultado mostra valor de compra, valor de venda, dias restantes,
  multa, lucro (com sinal), comissão, crédito no caixa (com sinal), situação do contrato e novo caixa, todos da
  resposta; as explicações ao lado de cada valor só o descrevem.
- Titular: a confirmação da venda e a mudança para `DOENTE` consultam a escalação salva do clube
  (`GET /clubs/{id}/lineup`) e avisam quando o jogador é titular, porque ele sai da escalação (RN19). Depois de
  vender, comprar ou mudar a condição, a escalação também é buscada de novo.
- Histórico (F09 e F10): tabela na ordem da API, com data e hora de Brasília, tipo, jogador, valor, taxa ou
  comissão, multa, lucro (`–` na compra) e variação do caixa com `+` e `-`; abaixo, os 5 totais do `summary`,
  sempre do mesmo pedido da tabela, então respeitam o filtro. Filtro de tipo com duas caixas (Compra e Venda):
  as duas marcadas pedem o histórico sem `type`; desmarcar uma pede só a outra (`type=VENDA`), e a última
  marcada não pode ser desmarcada. O filtro de jogador lista os jogadores que aparecem no histórico do clube
  (com o nome mais recente) e envia `player_id`. Se a API recusar o filtro (jogador excluído → 404), a tela
  mostra "O filtro foi recusado" com o `message` e esconde tabela e totais. Os filtros ficam no endereço.
- Exportar CSV (F11): o botão pede `GET /clubs/{id}/transactions/export` com os mesmos `type` e `player_id` da
  tela e salva a resposta da API como está (`transacoes-clube-<id>.csv`), sem montar nem converter o arquivo no
  navegador; conferido byte a byte contra a API, sem BOM. Se a API recusar o filtro, o `message` aparece abaixo
  do botão.

### Frontend: liga

- Escalação (F12): a aba parte da escalação salva (`GET /clubs/{id}/lineup`); sem escalação, a formação 2-1-1
  aparece marcada, mas nada é salvo até o clique em Salvar. Cada vaga da formação tem um select só com os
  jogadores do elenco daquele setor (GOL; ZAG ou LAT; MEI; ATA), sem os `DOENTE` e sem quem já está em outra
  vaga, que são as escolhas que o enunciado deixa a tela impedir. Trocar de formação mantém os titulares que
  cabem nas novas vagas. Antes de enviar, a tela pede um titular em cada vaga, com a mensagem junto à vaga; o
  `PUT` vai com a formação e os 5 ids na ordem das vagas, e a resposta da API passa a ser a escalação mostrada.
  Com a escalação incompleta (sem escalação, ou titular vendido ou `DOENTE`), a aba avisa que o clube não pode
  jogar; com titular `MAL_CONDICIONADO`, avisa que ele joga com 15% a menos (RN20). Uma recusa (dados que mudaram
  depois de a tela abrir) mostra o `message` e mantém as escolhas.
- Partidas (F13): "Nova partida" pede o mandante e o visitante (clubes diferentes, conferido antes de enviar) e
  envia `POST /matches`. A resposta abre a página da partida (`/partidas/:id`) direto do cache, sem novo pedido:
  placar, formações, resultado e os 6 duelos, separados pelo clube que ataca, com atacante, defensor, posição,
  condição do momento, atributo, valor (já com o efeito da condição) e gol, todos como a API devolveu. Clube sem
  escalação completa é recusado pela API (409), e o `message` aparece no diálogo.
- Histórico de partidas (parte do F14): tabela com data e hora, mandante, placar, visitante e resultado, na
  ordem da API (da mais recente para a mais antiga), filtro por clube no endereço (`/partidas?club_id=2`, que
  envia `GET /matches?club_id=2`) e "Ver duelos" em cada partida, que abre a partida com `GET /matches/{id}`.
  A última partida aparece em destaque no topo, como no mockup.
- Classificação (F14): tabela de `GET /standings` na ordem devolvida, com posição, clube (sigla e nome, que leva
  à página do clube), jogos, vitórias, empates, derrotas, gols marcados, gols sofridos, saldo (com sinal) e
  pontos; a tela não reordena nem soma nada. Ao lado, as 3 últimas partidas e os critérios de desempate da RN21,
  como no mockup. Jogar uma partida ou criar um clube faz a classificação ser buscada de novo.

## 9. Funcionalidades não implementadas

- **Backend:** nenhuma. Os 19 endpoints do enunciado estão implementados e documentados no Swagger.
- **Frontend:** nenhuma. As telas cobrem os itens F01 a F14 do roteiro da interface, e os testes de ponta a ponta
  (`frontend/e2e`) percorrem cada um deles contra a aplicação no ar.

## 10. Uso de inteligência artificial

Ferramenta: **Claude Code** (modelo Claude Opus 5.5, da Anthropic), no terminal e no VS Code. O registro de cada
ciclo, com arquivos, o que foi gerado e o que eu aceitei ou alterei, está em [`docs/ai-log.md`](docs/ai-log.md).

- **Onde:** em todo o projeto, sempre com a minha revisão. No backend: estrutura, Docker, configuração, tratamento
  de erros e log (`backend/app/core`), validadores e parâmetros (`backend/app/api`), regras de domínio
  (`backend/app/domain`), serviços, repositórios, modelos, migration e testes. No frontend: base do Vite,
  componentes de interface, as telas de jogadores, clubes, mercado, histórico, escalação, partidas e
  classificação, os testes de componente e os de ponta a ponta. Também na integração contínua e neste README.
- **Como:** em ciclos pequenos, um por funcionalidade. A cada ciclo, eu releio a regra no enunciado com a IA, ela
  propõe o plano e gera o código, os testes rodam (pytest, Vitest, Playwright, lint e formatação), eu confiro as
  telas no navegador contra o mockup, reviso o diff e faço o commit. As tabelas de exemplo do enunciado viraram
  testes antes do código das regras.
- **Por quê:** acelerar a parte repetitiva (validações, telas e testes) e conferir cada regra com exemplos,
  mantendo comigo as decisões de interpretação, que estão na seção 8.
- **O que aceitei, alterei e descartei (exemplos):**
  - **Alterei:** a migration gerada automaticamente duplicava as restrições `CHECK` das listas de valores e foi
    reescrita à mão; os campos de data do navegador na compra viraram campos de texto com máscara, porque dependem
    do idioma do sistema; a mensagem de clube repetido passou a citar o clube já cadastrado; cabeçalhos de tabela
    passaram a quebrar linha para o elenco caber em 1366 px; o menu "⋯" passou a acompanhar a página ao rolar.
  - **Descartei:** a tela inicial do mockup (poria um clique a mais antes da lista de jogadores, que a banca
    espera na raiz) e o botão de recolher o menu.
  - **Aceitei** o restante depois de revisar e de ver os testes passando; cada ciclo está no registro.
