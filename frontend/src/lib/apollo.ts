import { ApolloClient } from '@apollo/client/core';
import { InMemoryCache } from '@apollo/client/cache';
import { HttpLink } from '@apollo/client/link/http';
import { from } from '@apollo/client/link';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { Observable } from 'rxjs';
import { useAuthStore, getRefreshToken } from '@/store/authStore';
import { apiClient } from './axios';

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
  if (!CombinedGraphQLErrors.is(error)) return;

  const isUnauthenticated = error.errors.some(
    (e) => e.extensions?.['code'] === 'UNAUTHENTICATED',
  );
  if (!isUnauthenticated) return;

  return new Observable((observer) => {
    apiClient
      .post('/api/auth/refresh', { refreshToken: getRefreshToken() })
      .then(({ data }) => {
        useAuthStore.getState().setAuth(data.accessToken, data.user, data.refreshToken);
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
