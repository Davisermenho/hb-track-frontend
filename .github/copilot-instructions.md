# GitHub Copilot Instructions — HB TRACK

Leia e siga o arquivo `agent.md` (root) como fonte canônica de:
- Repo Map / Location Rules
- Anti-duplication Protocol (discover-before-create)
- Next App Router boundaries (server/client)
- TypeScript Contracts (no-any by default)

Regras críticas:
1) Nunca crie componente/hook/service sem buscar existente (git grep/rg/findstr).
2) Features novas em `teams-v2` e `competitions-v2` (legacy freeze em `teams/` e `competitions/`).
3) Não introduza `any` para “resolver erro”: use `unknown` + narrowing ou tipos canônicos em `src/types`.
4) Hooks React Query ficam em `src/hooks`; services em `src/lib/api`; fetch somente no `src/lib/api/client.ts`.