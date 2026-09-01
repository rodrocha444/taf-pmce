import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dados nunca ficam stale automaticamente — só invalidação manual via mutations
      staleTime: Infinity,
      // Mantém em cache por 1h sem uso
      gcTime: 1000 * 60 * 60,
      // Sem refetch automático
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});
