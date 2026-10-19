# Registro do uso de inteligência artificial

Ferramenta: Claude Code (modelo Claude Opus 5.5). Uma linha por ciclo de desenvolvimento.

| Data | Ciclo | Arquivos | O que a IA gerou | O que eu aceitei, alterei ou descartei |
| --- | --- | --- | --- | --- |
| 18/10/2026 | Esqueleto do monorepo | `backend/` (app, testes, Dockerfile, requirements), `docker-compose.yml`, `.env.example`, `.github/workflows/ci.yml`, `README.md` | Estrutura de pastas, imagens fixadas, configuração do Ruff e do pytest, CI e esqueleto do README; documentos do desafio movidos para `docs/` | Aceito após revisão |
| 18/10/2026 | Bootstrap da API | `backend/app/core/`, `backend/app/api/`, `backend/app/main.py`, `backend/tests/`, `backend/Dockerfile`, `docker-compose.yml`, `.env.example`, `backend/.env.example`, `README.md` | Configuração por ambiente, CORS restrito, tratamento central de erros (400/404/405/409/500 com `message`), log de uma linha por requisição, prefixo `/api/v1`, health check e testes | Aceito após revisão |
| 18/10/2026 | Modelos e migration das 7 tabelas | `backend/app/models/`, `backend/app/domain/enums.py`, `backend/app/core/config.py`, `backend/migrations/`, `backend/alembic.ini`, `backend/tests/conftest.py`, `backend/tests/db/`, `backend/Dockerfile`, `docker-compose.yml`, `.github/workflows/ci.yml`, `README.md` | Modelos SQLAlchemy, migration inicial (reescrita à mão para remover CHECKs duplicados do autogenerate), índice único em `lower(nome)`, migrations ao subir a API, recriação do banco sem derrubar a API e testes de schema e restrições | Aceito após revisão |
| 18/10/2026 | Texto e dinheiro no domínio | `backend/app/domain/text.py`, `backend/app/domain/money.py`, `backend/tests/domain/`, `README.md` | Funções puras de V4, acentos, ordem alfabética, busca e contagem de palavras; arredondamento e percentual em `Decimal`; testes com os exemplos do enunciado | Aceito após revisão |
