/**
 * React Query Provider
 *
 * Configuração otimizada para performance do dashboard:
 * - staleTime: 60s por padrão (dados frescos por 1 minuto)
 * - gcTime: 5 minutos (mantém dados em cache mesmo inativos)
 * - refetchOnWindowFocus: true (atualiza quando volta para aba)
 * - retry: 2 (tenta novamente em caso de erro)
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Dados são considerados frescos por 60 segundos
        staleTime: 60 * 1000,
        // Dados ficam em cache por 5 minutos mesmo inativos
        gcTime: 5 * 60 * 1000,
        // Refetch quando a janela ganha foco
        refetchOnWindowFocus: true,
        // Não refetch se os dados ainda são considerados frescos
        refetchOnMount: true,
        // Retry em caso de erro
        retry: 2,
        retryDelay: (attemptIndex: number) =>
          Math.min(1000 * 2 ** attemptIndex, 10000),
      },
    },
  });
}

// Variável para guardar o QueryClient no browser
let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: sempre criar novo QueryClient
    return makeQueryClient();
  } else {
    // Browser: reusar QueryClient existente ou criar novo
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Usar useState para garantir que o QueryClient é criado apenas uma vez
  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export default QueryProvider;
