# HB Track - Arquitetura do Frontend

> **Documentação gerada**: Janeiro 2026  
> **Framework**: Next.js 14+ (App Router)  
> **Linguagem**: TypeScript

---

## 📁 Árvore de Módulos

```
src/
├── app/                          # Next.js App Router (páginas e rotas)
│   ├── (admin)/                  # Route Group: Área autenticada com sidebar
│   │   ├── layout.tsx            # Layout com ProfessionalSidebar + TopBar
│   │   ├── admin/                # Painel Super Admin
│   │   │   ├── athletes/         # Gestão de atletas (CRUD)
│   │   │   ├── cadastro/         # Cadastro geral
│   │   │   ├── matches/          # Partidas
│   │   │   ├── organizations/    # Organizações
│   │   │   ├── persons/          # Pessoas
│   │   │   ├── reports/          # Relatórios
│   │   │   ├── seasons/          # Temporadas
│   │   │   ├── staff/            # Comissão técnica
│   │   │   └── users/            # Gestão de usuários
│   │   ├── atletas-grid/         # Grid de atletas
│   │   ├── competitions/         # Competições
│   │   ├── dashboard/            # Dashboard principal
│   │   ├── games/                # Jogos/Partidas
│   │   ├── inicio/               # Página inicial (home)
│   │   ├── scout/                # Scout ao vivo
│   │   │   └── live/             # Scout em tempo real
│   │   ├── statistics/           # Estatísticas
│   │   │   ├── comparativos/     # Comparação entre atletas
│   │   │   ├── me/               # Estatísticas do próprio usuário
│   │   │   └── components/       # Componentes de estatísticas
│   │   ├── teams/                # Equipes (V2)
│   │   │   └── [teamId]/         # Detalhe da equipe
│   │   │       ├── members/      # Membros da equipe
│   │   │       ├── overview/     # Visão geral
│   │   │       ├── settings/     # Configurações
│   │   │       ├── stats/        # Estatísticas
│   │   │       ├── trainings/    # Treinos da equipe
│   │   │       └── [...tab]/     # Catch-all para tabs
│   │   ├── training/             # Módulo de treinos
│   │   │   ├── agenda/           # Agenda semanal
│   │   │   ├── avaliacoes/       # Avaliações
│   │   │   ├── banco/            # Banco de exercícios
│   │   │   ├── calendario/       # Calendário mensal
│   │   │   └── planejamento/     # Planejamento estrutural
│   │   └── wellness/             # Bem-estar dos atletas
│   │
│   ├── (full-width-pages)/       # Route Group: Páginas sem sidebar
│   │   ├── (auth)/               # Autenticação
│   │   │   ├── signin/           # Login
│   │   │   ├── signup/           # Cadastro
│   │   │   ├── reset-password/   # Reset de senha
│   │   │   ├── new-password/     # Nova senha
│   │   │   └── confirm-reset/    # Confirmação de reset
│   │   └── (error-pages)/        # Páginas de erro
│   │
│   ├── (protected)/              # Route Group: Rotas protegidas especiais
│   │   ├── calendar/             # Calendário geral
│   │   ├── eventos/              # Eventos
│   │   ├── games/                # Jogos (área protegida)
│   │   ├── history/              # Histórico
│   │   └── training/
│   │       └── presencas/        # Controle de presenças
│   │
│   ├── initial-setup/            # Configuração inicial (onboarding)
│   ├── set-password/             # Definição de senha
│   ├── layout.tsx                # Root Layout (providers globais)
│   ├── globals.css               # Estilos globais
│   └── not-found.tsx             # Página 404
│
├── components/                   # Componentes reutilizáveis
│   ├── app/                      # Componentes de app
│   ├── athlete/                  # Componentes de atleta
│   ├── Athletes/                 # Gestão de atletas (tree, list, sidebar)
│   ├── auth/                     # Componentes de autenticação
│   │   ├── PermissionGate.tsx    # Controle de UI por permissão
│   │   ├── PermissionGateV2.tsx  # Versão 2 do gate
│   │   ├── RouteGuard.tsx        # Guard de rotas
│   │   ├── SignInForm.tsx        # Formulário de login
│   │   └── ...                   # Demais forms de auth
│   ├── calendar/                 # Calendário
│   ├── competitions/             # Competições
│   ├── competitions-v2/          # Competições V2
│   ├── Dashboard/                # Componentes de dashboard
│   ├── form/                     # Componentes de formulário
│   ├── game/                     # Componentes de jogo
│   ├── games/                    # Módulo de jogos
│   ├── Layout/                   # Layout components
│   │   ├── ProfessionalSidebar.tsx # Sidebar principal
│   │   ├── TopBar.tsx            # Barra superior
│   │   ├── AppLayout.tsx         # Layout base
│   │   └── ContextBar.tsx        # Barra de contexto
│   ├── Sidebar/                  # Componentes de sidebar
│   ├── Statistics/               # Estatísticas
│   ├── teams/                    # Equipes V1
│   ├── teams-v2/                 # Equipes V2 (atual)
│   │   ├── DashboardV2.tsx       # Dashboard de equipes
│   │   ├── TeamCard.tsx          # Card de equipe
│   │   ├── TeamDetail.tsx        # Detalhe da equipe
│   │   ├── MembersTab.tsx        # Aba de membros
│   │   ├── OverviewTab.tsx       # Aba de visão geral
│   │   ├── SettingsTab.tsx       # Aba de configurações
│   │   ├── StatsTab.tsx          # Aba de estatísticas
│   │   ├── TrainingsTab.tsx      # Aba de treinos
│   │   └── modals/               # Modais (create, edit, invite)
│   ├── training/                 # Treinos
│   ├── ui/                       # Componentes UI base
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── AppModal.tsx
│   │   ├── AppTable.tsx
│   │   ├── AppTabs.tsx
│   │   └── ...                   # Demais componentes UI
│   ├── UnifiedRegistration/      # Cadastro unificado
│   └── wellness/                 # Bem-estar
│
├── context/                      # React Contexts (estado global)
│   ├── AuthContext.tsx           # Autenticação e usuário
│   ├── CompetitionsContext.tsx   # Estado de competições
│   ├── GamesContext.tsx          # Estado de jogos
│   ├── QueryProvider.tsx         # React Query provider
│   ├── SidebarContext.tsx        # Estado da sidebar
│   ├── TeamSeasonContext.tsx     # Equipe e temporada ativa
│   ├── ThemeContext.tsx          # Tema (dark/light)
│   ├── ToastContext.tsx          # Notificações toast
│   └── TrainingContext.tsx       # Estado de treinos
│
├── hooks/                        # Custom hooks
│   ├── useCompetitions.ts        # Hook de competições
│   ├── useDynamicSidebarItems.ts # Items dinâmicos da sidebar
│   ├── useJourneyShortcuts.ts    # Atalhos de jornada
│   ├── usePinnedItems.ts         # Items fixados
│   ├── useRecentItems.ts         # Items recentes
│   ├── useRouteVisibility.ts     # Visibilidade de rotas (RBAC)
│   ├── useSidebarBadges.ts       # Badges da sidebar
│   ├── useSyncStatus.ts          # Status de sincronização
│   └── useTeams.ts               # Hook de equipes (React Query)
│
├── lib/                          # Bibliotecas e utilitários
│   ├── adapters/                 # Adaptadores de dados
│   ├── api/                      # Camada de API (fetch)
│   ├── auth/                     # Server Actions de autenticação
│   │   ├── actions.ts            # login, logout, refresh, getSession
│   │   └── jwt.ts                # Decode/encode JWT
│   ├── constants/                # Constantes da aplicação
│   ├── hooks/                    # Hooks específicos de lib
│   │   └── usePermissions.ts     # Hook de permissões (RBAC)
│   ├── pdf/                      # Geração de PDF
│   ├── utils/                    # Utilitários
│   │   ├── fetch.ts              # Fetch com timeout/retry
│   │   └── ...
│   └── validations/              # Schemas de validação
│
├── types/                        # TypeScript types
│   ├── index.ts                  # Types globais (UserRole, ApiError)
│   ├── auth.ts                   # Types de autenticação
│   ├── athletes.ts               # Types de atletas
│   ├── persons.ts                # Types de pessoas
│   ├── teams-v2.ts               # Types de equipes V2
│   ├── reports.ts                # Types de relatórios
│   ├── scout.ts                  # Types de scout
│   └── wellness.ts               # Types de bem-estar
│
└── styles/                       # Estilos adicionais
```

---

## 🔐 Fluxo de Autenticação

### Arquitetura SSR-Safe

O sistema usa **cookies HttpOnly** para máxima segurança:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │────▶│  Next.js     │────▶│   Backend    │
│              │     │  Middleware  │     │   FastAPI    │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │  1. Request        │                    │
       │  ─────────────────▶│                    │
       │                    │  2. Check cookie   │
       │                    │  hb_access_token   │
       │                    │                    │
       │  3a. No token:     │                    │
       │  Redirect /signin  │                    │
       │  ◀─────────────────│                    │
       │                    │                    │
       │  3b. Has token:    │                    │
       │  Continue          │                    │
       │  ─────────────────▶│                    │
```

### Cookies Utilizados

| Cookie | HttpOnly | Descrição |
|--------|----------|-----------|
| `hb_access_token` | ❌ | JWT de acesso (enviado ao backend) |
| `hb_session` | ✅ | Dados do usuário (JSON) |
| `hb_refresh_token` | ✅ | Token de refresh (7 dias) |

### Componentes de Auth

1. **middleware.ts** (raiz do projeto)
   - Proteção de rotas no edge
   - Redirect de não autenticados para `/signin`
   - Redirect de URLs legadas `/teams?teamId=X`
   - Validação de UUID em rotas dinâmicas

2. **AuthContext.tsx**
   - Estado de UI (user, isAuthenticated, isLoading)
   - Funções: `login()`, `logout()`, `refreshSession()`
   - Helpers: `hasRole()`, `canManageAthletes()`, `isAtLeast()`

3. **Server Actions** (`src/lib/auth/actions.ts`)
   - `loginAction()` - OAuth2 form-urlencoded
   - `logoutAction()` - Limpa cookies
   - `getSession()` - Lê sessão do cookie
   - `refreshTokenAction()` - Renova JWT

### Fluxo de Login

```
1. User submits credentials
        │
        ▼
2. loginAction() → POST /auth/login (form-urlencoded)
        │
        ▼
3. Backend valida → Retorna JWT + user data
        │
        ▼
4. Server Action seta cookies:
   - hb_access_token (não HttpOnly, para fetch client-side)
   - hb_session (HttpOnly, dados do user)
        │
        ▼
5. AuthContext.loadSession() carrega user
        │
        ▼
6. Redirect para /inicio ou callbackUrl
```

---

## 🛣️ Rotas (App Router)

### Route Groups

| Group | Path | Layout | Descrição |
|-------|------|--------|-----------|
| `(admin)` | `/inicio`, `/teams`, `/training`, etc. | Sidebar + TopBar | Área principal autenticada |
| `(full-width-pages)` | `/signin`, `/signup`, etc. | Página cheia | Auth e erros |
| `(protected)` | `/calendar`, `/training/presencas` | Sidebar | Rotas protegidas especiais |

### Rotas Públicas (não requerem auth)

```
/signin
/signup
/reset-password
/new-password
/confirm-reset
/set-password
/forgot-password
/error-404
```

### Rotas Protegidas Principais

```
/inicio                    # Página inicial
/dashboard                 # Dashboard
/teams                     # Lista de equipes
/teams/[teamId]/overview   # Detalhe da equipe
/teams/[teamId]/members    # Membros
/teams/[teamId]/trainings  # Treinos
/teams/[teamId]/stats      # Estatísticas
/teams/[teamId]/settings   # Configurações
/training/agenda           # Agenda de treinos
/training/planejamento     # Planejamento
/training/banco            # Banco de exercícios
/training/avaliacoes       # Avaliações
/games                     # Jogos
/competitions              # Competições
/statistics                # Estatísticas gerais
/admin/athletes            # Gestão de atletas
/admin/users               # Gestão de usuários
/wellness                  # Bem-estar
```

### Tabs Válidas para `/teams/[teamId]/:tab`

```typescript
const VALID_TEAM_TABS = ['overview', 'members', 'trainings', 'stats', 'settings'];
```

---

## 🧩 Server vs Client Components

### Server Components (default)

Usados para:
- Páginas com data fetching inicial
- SEO (metadata)
- Validação de sessão pré-render

```tsx
// src/app/(admin)/teams/page.tsx (Server Component)
export default async function TeamsPage() {
  const session = await getSession();
  if (!session) redirect('/signin');
  return <TeamsV2PageClient />;
}
```

### Client Components (`'use client'`)

Usados para:
- Interatividade (onClick, onChange)
- Hooks (useState, useEffect, useContext)
- Contextos de React

```tsx
// src/app/(admin)/layout.tsx
'use client';
// Usa useAuth, useState, etc.
```

### Padrão Identificado

| Camada | Tipo | Exemplo |
|--------|------|---------|
| `page.tsx` | Server | Valida sessão, metadata |
| `*Client.tsx` | Client | Lógica interativa |
| `layout.tsx` (admin) | Client | Sidebar, auth state |
| `components/*` | Client | Maioria dos componentes |

---

## 📡 Camada de API

### Estrutura (`lib/api/`)

```
lib/api/
├── client.ts              # ApiClient base (cache, timeout)
├── index.ts               # Exports centralizados
├── athletes.ts            # CRUD de atletas
├── categories.ts          # Categorias
├── organizations.ts       # Organizações
├── org-memberships.ts     # Memberships
├── persons.ts             # Pessoas
├── positions.ts           # Posições (defesa/ataque)
├── seasons.ts             # Temporadas
├── teams.ts               # Equipes
├── team-registrations.ts  # Vínculos atleta-equipe
├── unified-registration.ts # Cadastro unificado
└── users.ts               # Usuários
```

### ApiClient

```typescript
// lib/api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const API_TIMEOUT = 15000; // 15s (cold start Neon)

class ApiClient {
  // GET, POST, PUT, PATCH, DELETE
  // Cache em memória para endpoints estáticos
  // Credentials: 'include' para cookies HttpOnly
}
```

### Endpoints Cacheados

```typescript
const CACHEABLE_ENDPOINTS = [
  '/teams',
  '/categories',
  '/positions',
  '/seasons',
];
```

### React Query Integration

```typescript
// hooks/useTeams.ts
export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsService.list(),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
```

---

## 🔄 Fluxo de Dados

### 1. Server-Side Rendering (SSR)

```
Request → Middleware (auth check) → Server Component → getSession() → Render
```

### 2. Client-Side Data Fetching

```
Component Mount → useQuery() → apiClient.get() → Backend → Cache → Render
```

### 3. Estado Global (Context)

```
AuthProvider (user, permissions)
    │
    ├── TeamSeasonProvider (equipe/temporada ativa)
    │       │
    │       └── TrainingProvider (treinos)
    │       └── CompetitionsProvider (competições)
    │
    └── QueryProvider (React Query cache)
```

### 4. Fluxo de Permissões

```
1. Login → Backend retorna permissions[]
2. AuthContext armazena user.permissions
3. usePermissions() hook verifica permissões
4. PermissionGate renderiza condicionalmente
5. Backend SEMPRE valida (403 se inválido)
```

---

## 🔒 Sistema de Permissões

### Roles (Hierarquia R41)

```typescript
const ROLE_HIERARCHY: Record<UserRole, number> = {
  atleta: 1,
  treinador: 2,
  coordenador: 3,
  dirigente: 4,
  admin: 4, // superadmin
};
```

### Permissões Granulares

```typescript
type Permission =
  // Atletas
  | 'read_athlete' | 'edit_athlete' | 'delete_athlete'
  | 'view_athletes' | 'manage_athletes'
  // Treinos
  | 'read_training' | 'edit_training' | 'delete_training'
  // Jogos
  | 'read_match' | 'edit_match' | 'delete_match'
  // Bem-estar
  | 'read_wellness' | 'edit_wellness'
  // Admin
  | 'admin_memberships' | 'admin_organization'
  | 'admin_teams' | 'admin_seasons'
  | 'manage_users' | 'manage_teams'
  // Relatórios
  | 'view_reports' | 'generate_reports' | 'view_dashboard';
```

### PermissionGate Component

```tsx
// Controle de UI (não é segurança real)
<PermissionGate permission="manage_users">
  <button>Criar Usuário</button>
</PermissionGate>

<PermissionGate anyOf={["view_reports", "generate_reports"]}>
  <Link href="/reports">Relatórios</Link>
</PermissionGate>
```

---

## 📦 Dependências Críticas

### Core

| Pacote | Uso |
|--------|-----|
| `next` | Framework (App Router) |
| `react` | UI Library |
| `typescript` | Type safety |
| `tailwindcss` | Styling |

### Data Fetching

| Pacote | Uso |
|--------|-----|
| `@tanstack/react-query` | Cache, state sync |

### UI

| Pacote | Uso |
|--------|-----|
| `framer-motion` | Animações |
| `lucide-react` | Ícones |
| `clsx` / `tailwind-merge` | Classes condicionais |

### Formulários e Validação

| Pacote | Uso |
|--------|-----|
| `react-hook-form` | Forms |
| `zod` | Validação de schema |

---

## 🗂️ Tipos de Dados Principais

### User

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole; // 'admin' | 'dirigente' | 'coordenador' | 'treinador' | 'atleta'
  organization_id: string;
  is_superadmin?: boolean;
  permissions: string[];
}
```

### Session

```typescript
interface Session {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
```

### Team

```typescript
interface Team {
  id: string;
  organization_id: string;
  season_id: string;
  category_id: number;
  name: string;
  gender: 'F' | 'M';
  description?: string;
  is_active: boolean;
}
```

### Athlete

```typescript
interface Athlete {
  id: string;
  organization_id: string;
  person_id: string;
  athlete_name: string;
  birth_date: string;
  gender?: 'masculino' | 'feminino';
  state: 'ativa' | 'dispensada' | 'arquivada';
  main_defensive_position_id: number;
  main_offensive_position_id?: number;
  // ... demais campos
}
```

---

## 🏗️ Arquitetura de Layouts

### Root Layout (`app/layout.tsx`)

```tsx
<html>
  <body>
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  </body>
</html>
```

### Admin Layout (`app/(admin)/layout.tsx`)

```tsx
<TeamSeasonProvider>
  <MobileSidebarProvider>
    <div className="flex h-screen">
      <ProfessionalSidebar />
      <MobileDrawer />
      <div className="flex-1">
        <TopBar />
        <main>{children}</main>
      </div>
      <FloatingActionButton />
    </div>
  </MobileSidebarProvider>
</TeamSeasonProvider>
```

---

## 📋 Server Actions

### Autenticação (`src/lib/auth/actions.ts`)

| Action | Descrição |
|--------|-----------|
| `loginAction(credentials)` | Login OAuth2 |
| `logoutAction()` | Logout (limpa cookies) |
| `getSession()` | Retorna sessão do cookie |
| `getSessionAction()` | Alias para getSession |
| `refreshTokenAction(token)` | Renova JWT |

### Relatórios (`lib/reports/actions.ts`)

| Action | Descrição |
|--------|-----------|
| `getTrainingPerformance(filters)` | R1: Performance de treino |
| `getAthleteIndividual(athleteId)` | R2: Relatório individual |
| `getWellnessSummary(filters)` | R3: Resumo de bem-estar |
| `getMedicalSummary(filters)` | R4: Resumo médico |

---

## 🔧 Configurações

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Middleware Config

```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
```

### React Query Defaults

```typescript
{
  staleTime: 60 * 1000,        // 1 minuto
  gcTime: 5 * 60 * 1000,       // 5 minutos
  refetchOnWindowFocus: true,
  retry: 2,
}
```

---

## 📝 Convenções de Código

1. **Nomenclatura de Arquivos**
   - `page.tsx` - Páginas (Server Components por padrão)
   - `*Client.tsx` - Client Components explícitos
   - `layout.tsx` - Layouts compartilhados

2. **Estrutura de Componentes**
   - Props interface no topo
   - Hooks no início da função
   - Handlers antes do return
   - JSX no final

3. **Imports**
   - `@/` = alias para `src/`
   - Ordem: React → Next → Externos → Internos → Types

4. **Comentários**
   - Documentação JSDoc para funções públicas
   - Referências RAG para regras de negócio
   - `// TODO:` para melhorias pendentes

---

## 🔗 Referências

- [REGRAS.md](../RAG/REGRAS.md) - Regras de negócio
- [SISTEMA_PERMISSOES.md](../RAG/SISTEMA_PERMISSOES.md) - Sistema de permissões
- [Backend API](http://localhost:8000/docs) - Documentação OpenAPI
