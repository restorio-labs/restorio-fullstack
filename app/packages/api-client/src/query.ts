import { QueryClient } from "@tanstack/react-query";
import type { DefaultOptions, QueryClientConfig } from "@tanstack/react-query";

export const frontendQueryDefaultOptions: DefaultOptions = {
  queries: {
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  },
  mutations: {
    retry: 0,
  },
};

export const createFrontendQueryClient = (config: QueryClientConfig = {}): QueryClient =>
  new QueryClient({
    ...config,
    defaultOptions: {
      ...frontendQueryDefaultOptions,
      ...config.defaultOptions,
      queries: {
        ...frontendQueryDefaultOptions.queries,
        ...config.defaultOptions?.queries,
      },
      mutations: {
        ...frontendQueryDefaultOptions.mutations,
        ...config.defaultOptions?.mutations,
      },
    },
  });
