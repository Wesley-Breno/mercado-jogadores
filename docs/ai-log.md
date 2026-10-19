# Registro do uso de inteligência artificial

Ferramenta: Claude Code (modelo Claude Opus 5.5). Uma linha por ciclo de desenvolvimento.

| Data | Ciclo | Arquivos | O que a IA gerou | O que eu aceitei, alterei ou descartei |
| --- | --- | --- | --- | --- |
| 18/10/2026 | Esqueleto do monorepo | `backend/` (app, testes, Dockerfile, requirements), `docker-compose.yml`, `.env.example`, `.github/workflows/ci.yml`, `README.md` | Estrutura de pastas, imagens fixadas, configuração do Ruff e do pytest, CI e esqueleto do README; documentos do desafio movidos para `docs/` | Aceito após revisão |
| 18/10/2026 | Bootstrap da API | `backend/app/core/`, `backend/app/api/`, `backend/app/main.py`, `backend/tests/`, `backend/Dockerfile`, `docker-compose.yml`, `.env.example`, `backend/.env.example`, `README.md` | Configuração por ambiente, CORS restrito, tratamento central de erros (400/404/405/409/500 com `message`), log de uma linha por requisição, prefixo `/api/v1`, health check e testes | Aceito após revisão |
