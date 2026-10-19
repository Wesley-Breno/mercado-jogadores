# Passe — Mercado de Jogadores

Aplicação web fullstack do estudo de caso **SENAI/PE – CÓD. 237 Desenvolvedor I (Fullstack)**: o mercado de
jogadores de uma liga de futebol fictícia, com jogadores, clubes, compra e venda com contrato de fidelidade,
histórico de transações, escalação, partidas e classificação.

- `backend/`: API REST em Python com FastAPI, SQLAlchemy e PostgreSQL.
- `docs/`: enunciado, barema, glossário, mockup e registro do uso de IA.

## 1. Pré-requisitos

| Ferramenta | Versão | Uso |
| --- | --- | --- |
| Docker Engine | 27 ou superior | Sobe banco e API em contêineres |
| Docker Compose | v2 | Orquestra os serviços com um comando |
| PostgreSQL | 16 | Imagem pública `postgres:16.15-alpine3.24`, iniciada pelo Compose (não precisa instalar) |
| Python | 3.12 | Imagem pública `python:3.12.15-slim-bookworm`; no host, só para desenvolvimento e testes |

## 2. Banco de dados

O banco é criado pelo Compose, vazio, no volume `db-data`. Para criar (na raiz do repositório):

```bash
docker compose up -d db
```

Para recriar do zero, apagando todos os dados (na raiz do repositório):

```bash
docker compose down -v
docker compose up -d --build
```

## 3. Instalar e executar

Na raiz do repositório:

```bash
cp .env.example .env
docker compose up -d --build
```

| Serviço | Endereço |
| --- | --- |
| Origem da API (o prefixo `/api/v1` é acrescentado pelas rotas) | http://localhost:8000 |
| Documentação interativa (Swagger) | http://localhost:8000/docs |
| Verificação de saúde da API | http://localhost:8000/api/v1/health |

Para parar: `docker compose down`.

## 4. Variáveis de ambiente

Modelo em [`.env.example`](.env.example), na raiz, lido pelo Compose; o Compose usa os mesmos valores como padrão
se o `.env` não existir. Para executar a API fora do Docker, o modelo é [`backend/.env.example`](backend/.env.example).

| Variável | Usada por | Função |
| --- | --- | --- |
| `POSTGRES_USER` | `db` | Usuário do PostgreSQL |
| `POSTGRES_PASSWORD` | `db` | Senha do PostgreSQL (só para o ambiente local) |
| `POSTGRES_DB` | `db` | Nome do banco da aplicação |
| `CORS_ORIGIN` | `backend` | Única origem liberada no CORS: a URL do frontend |

## 5. Estrutura de pastas e bibliotecas

```text
backend/
  app/
    main.py       cria a aplicação (factory), registra CORS, erros, logs e rotas
    core/         configuração, fuso de Brasília, exceções de domínio, tratamento central de erros e log
    api/          roteador com o prefixo /api/v1 e as rotas de cada recurso
  tests/          testes automatizados (pytest)
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

## 6. Testes, lint e formatação

Backend, em contêiner (só precisa do Docker), na raiz do repositório:

```bash
docker compose --profile test run --rm --build backend-test pytest
docker compose --profile test run --rm --build backend-test ruff check .
docker compose --profile test run --rm --build backend-test ruff format --check .
```

Os comandos terminam sozinhos; o de formatação só verifica, sem alterar arquivos. A integração contínua
(`.github/workflows/ci.yml`) executa as mesmas verificações em Ubuntu 24.04 a cada envio.

Alternativa no host, para desenvolvimento (Python 3.12 com `venv`), na pasta `backend`:

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/pytest
cp .env.example .env
.venv/bin/uvicorn app.main:create_app --factory --reload --no-access-log
```

## 7. Decisões e premissas

- A API responde só nos caminhos sem barra final: um caminho com barra final não redireciona (o roteiro da
  banca não segue redirecionamentos) e responde 404.
- Toda recusa tem o corpo `{"message": "..."}` em português e `Content-Type: application/json`. Erros de validação do
  FastAPI, que por padrão seriam 422, respondem 400; um erro inesperado responde 500 com mensagem genérica, sem
  detalhes internos, e o detalhe vai só para o log da aplicação.
- Método não previsto num caminho existente responde 405 (o enunciado aceita 404 ou 405).
- Corpo enviado sem `Content-Type: application/json` não é lido como JSON (padrão do FastAPI contra CSRF) e a
  requisição é recusada com 400 por falta do corpo.
- Log: uma linha por requisição, com data e hora de Brasília, método, caminho e status, pelo módulo `logging` da
  biblioteca padrão. O log de acesso do Uvicorn fica desligado (`--no-access-log`) para não duplicar a linha.
- Endpoint adicional `GET /api/v1/health`, usado para saber quando a API está no ar.

## 8. Funcionalidades não implementadas

Este é o esqueleto do projeto: as funcionalidades do enunciado ainda não foram implementadas.

## 9. Uso de inteligência artificial

Ferramenta: **Claude Code** (modelo Claude Opus 5.5, da Anthropic), no terminal e no VS Code. O registro de cada
ciclo, com arquivos, o que foi gerado e o que eu aceitei ou alterei, está em [`docs/ai-log.md`](docs/ai-log.md).

- **Onde:** estrutura do repositório, configuração do Docker, do Ruff, do pytest e da integração contínua;
  configuração, CORS, tratamento central de erros e log de requisições da API (`backend/app/core`).
- **Como:** desenvolvimento em ciclos pequenos; a cada ciclo, a IA propõe o plano, gera o código e roda testes,
  lint e formatação; eu reviso o diff, executo, ajusto e faço o commit.
- **Por quê:** acelerar a parte repetitiva e conferir cada regra do enunciado com testes, mantendo as decisões
  comigo.
