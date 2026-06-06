import { QueryClient } from "@tanstack/react-query";

/** 5 min — lists feel instant when switching tabs */
export const STALE_LIST = 5 * 60 * 1000;
/** 10 min — business profile rarely changes */
export const STALE_BUSINESS = 10 * 60 * 1000;
/** 2 min — invoice detail */
export const STALE_DETAIL = 2 * 60 * 1000;
export const GC_TIME = 30 * 60 * 1000;

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_LIST,
        gcTime: GC_TIME,
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

export const listQueryOpts = {
  staleTime: STALE_LIST,
  gcTime: GC_TIME,
  refetchOnMount: false as const,
};

export const businessQueryOpts = {
  staleTime: STALE_BUSINESS,
  gcTime: GC_TIME,
  refetchOnMount: false as const,
};

export const detailQueryOpts = {
  staleTime: STALE_DETAIL,
  gcTime: GC_TIME,
};
