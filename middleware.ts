/**
 * Next.js Middleware - Proteção de Rotas (UNIFICADO)
 * 
 * Este é o ÚNICO middleware ativo. O arquivo /src/middleware.ts foi descontinuado.
 * 
 * Funcionalidades:
 * 1. Autenticação via cookie hb_access_token
 * 2. Redirect de URLs legadas /teams?teamId=X&tab=Y
 * 3. Validação de UUID para rotas /teams/[teamId]
 * 4. Proteção de rotas por role
 * 
 * @version 2.0.0 - Unificado
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

const COOKIE_NAME = 'hb_access_token';

// Regex para validar UUID v1-5
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Tabs válidas para /teams/:teamId/:tab
const VALID_TEAM_TABS = ['overview', 'members', 'trainings', 'stats', 'settings'];

// Rotas que NÃO requerem autenticação
const PUBLIC_ROUTES = [
  '/signin',
  '/signup',
  '/reset-password',
  '/new-password',
  '/confirm-reset',
  '/set-password',
  '/forgot-password',
  '/error-404',
];

// Rotas completamente públicas (não redirecionar mesmo se autenticado)
const FULLY_PUBLIC_ROUTES = [
  '/error-404',
  '/api',
  '/_next',
  '/images',
  '/fonts',
  '/favicon',
];

// =============================================================================
// MIDDLEWARE
// =============================================================================

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // Flag para identificar se estamos em modo E2E
  const isE2E = process.env.E2E === '1' || process.env.NEXT_PUBLIC_E2E === '1';
  
  // Helper para adicionar headers E2E à response
  const addE2EHeaders = (response: NextResponse) => {
    if (isE2E) {
      response.headers.set('x-e2e-mw', '1');
      response.headers.set('x-e2e-path', pathname);
      response.headers.set('x-e2e-ts', Date.now().toString());
    }
    return response;
  };
  
  // =========================================================================
  // IGNORAR: Rotas completamente públicas (assets, API, etc.)
  // =========================================================================
  if (FULLY_PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return addE2EHeaders(NextResponse.next());
  }

  // =========================================================================
  // AUTENTICAÇÃO (DEVE VIR ANTES DE QUALQUER REGRA DE /teams)
  // Sem auth → qualquer /teams/** → /signin?callbackUrl=...
  // =========================================================================
  const token = request.cookies.get(COOKIE_NAME);
  const isAuthenticated = !!token?.value;
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  // Não autenticado em rota protegida → /signin com callbackUrl
  if (!isAuthenticated && !isPublicRoute) {
    const callbackUrl = pathname + (request.nextUrl.search || '');
    const redirectUrl = new URL('/signin', request.url);
    redirectUrl.searchParams.set('callbackUrl', callbackUrl);
    return addE2EHeaders(NextResponse.redirect(redirectUrl));
  }

  // Autenticado em rota pública (exceto set-password) → /inicio
  if (isAuthenticated && isPublicRoute && pathname !== '/set-password') {
    return addE2EHeaders(NextResponse.redirect(new URL('/inicio', request.url)));
  }

  // =========================================================================
  // TEAMS: Validação de UUID e tab (SÓ PARA USUÁRIOS AUTENTICADOS)
  // =========================================================================
  const teamsMatch = pathname.match(/^\/teams\/([^/]+)(?:\/([^/]+))?/);
  if (teamsMatch) {
    const [, teamId, tab] = teamsMatch;
    
    // teamId não é UUID válido → deixar Next.js resolver (404)
    if (!UUID_RE.test(teamId)) {
      return NextResponse.next();
    }
    
    // Normalizar tab para lowercase (case-insensitive routing)
    const tabLower = tab?.toLowerCase();
    
    // UUID válido + tab inválida → redirecionar para overview
    // NOTA: Em Next.js 14+, o App Router pode resolver 404 antes do middleware.
    // Usamos catch-all /teams/[teamId]/[...tab]/page.tsx como fallback.
    if (tab && !VALID_TEAM_TABS.includes(tabLower!)) {
      const newUrl = new URL(`/teams/${teamId}/overview`, request.url);
      return addE2EHeaders(NextResponse.redirect(newUrl));
    }
    
    // Tab válida mas não está em lowercase → redirecionar para versão normalizada
    // Exemplo: /teams/:id/OVERVIEW → /teams/:id/overview
    // NOTA: No Windows, o filesystem é case-insensitive, então o middleware
    // pode não receber a URL com case original. O layout.tsx faz fallback client-side.
    if (tab && tab !== tabLower) {
      const newUrl = new URL(`/teams/${teamId}/${tabLower}`, request.url);
      return addE2EHeaders(NextResponse.redirect(newUrl));
    }
  }

  // =========================================================================
  // REDIRECT LEGADO: /teams?teamId=X&tab=Y (SÓ PARA USUÁRIOS AUTENTICADOS)
  // =========================================================================
  if (pathname === '/teams') {
    const teamId = searchParams.get('teamId');
    
    console.log('[MIDDLEWARE] Legacy /teams route:', { pathname, teamId, hasTeamId: !!teamId });
    
    if (teamId && UUID_RE.test(teamId)) {
      const tab = searchParams.get('tab')?.toLowerCase();
      const targetTab = tab && VALID_TEAM_TABS.includes(tab) ? tab : 'overview';
      const isNew = searchParams.get('isNew');
      
      let newUrl = `/teams/${teamId}/${targetTab}`;
      if (isNew === 'true') {
        newUrl += '?isNew=true';
      }
      
      console.log('[MIDDLEWARE] Redirecting legacy URL to:', newUrl);
      return addE2EHeaders(NextResponse.redirect(new URL(newUrl, request.url)));
    }
  }

  return addE2EHeaders(NextResponse.next());
}

// =============================================================================
// CONFIGURAÇÃO DO MATCHER
// =============================================================================

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
