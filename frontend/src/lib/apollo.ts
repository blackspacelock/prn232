import { ApolloClient, Observable } from '@apollo/client';
import { InMemoryCache } from '@apollo/client/cache';
import { HttpLink } from '@apollo/client/link/http';
import { from } from '@apollo/client/link';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { useAuthStore, getRefreshToken } from '@/store/authStore';
import { apiClient } from './axios';
import { mapAuthResponse } from './authMapper';
import type { AuthResponseDto } from '@/types/api';

const httpLink = new HttpLink({
  uri: `${import.meta.env.VITE_API_URL ?? ''}/graphql`,
});

const authLink = setContext((_, prevContext) => {
  const token = useAuthStore.getState().accessToken;
  return {
    headers: {
      ...prevContext['headers'],
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

const errorLink = onError(({ error, operation, forward }) => {
  // Apollo v4: error is CombinedGraphQLErrors (has .errors array) or NetworkError
  // Check for UNAUTHENTICATED without importing CombinedGraphQLErrors to avoid path issues
  const gqlErrors: Array<{ extensions?: { code?: string } }> =
    (error as any)?.errors ?? [];
  if (!gqlErrors.some(e => e.extensions?.code === 'UNAUTHENTICATED')) return;

  return new Observable(observer => {
    apiClient
      .post<AuthResponseDto>('/api/auth/refresh', { refreshToken: getRefreshToken() })
      .then(({ data }) => {
        const { user, accessToken, refreshToken } = mapAuthResponse(data);
        useAuthStore.getState().setAuth(accessToken, user, refreshToken);
        const subscriber = {
          next: observer.next.bind(observer),
          error: observer.error.bind(observer),
          complete: observer.complete.bind(observer),
        };
        forward(operation).subscribe(subscriber);
      })
      .catch(() => {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        observer.error(new Error('Session expired'));
      });
  });
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});
