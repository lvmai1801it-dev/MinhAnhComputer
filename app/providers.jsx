'use client';
import { SWRConfig } from 'swr';
import { AuthProvider } from '@/lib/auth-context';
import { fetcher } from '@/lib/fetcher';

export function Providers({ children }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        shouldRetryOnError: false,
        dedupingInterval: 2000,
      }}
    >
      <AuthProvider>{children}</AuthProvider>
    </SWRConfig>
  );
}