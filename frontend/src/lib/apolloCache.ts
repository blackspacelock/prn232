import { apolloClient } from './apollo';
import type { DocumentNode } from 'graphql';

type QueryOptions = {
  query: DocumentNode;
  variables?: Record<string, unknown>;
};

export function appendCachedListItem<TItem>(
  queryOptions: QueryOptions,
  fieldName: string,
  item: TItem,
) {
  apolloClient.cache.updateQuery<Record<string, TItem[]> | null>(
    queryOptions,
    (current) => {
      const list = current?.[fieldName];
      if (!list) return current;
      return { ...current, [fieldName]: [item, ...list] };
    },
  );
}

export function replaceCachedListItem<TItem extends { id: string }>(
  queryOptions: QueryOptions,
  fieldName: string,
  item: TItem,
) {
  apolloClient.cache.updateQuery<Record<string, TItem[]> | null>(
    queryOptions,
    (current) => {
      const list = current?.[fieldName];
      if (!list) return current;
      return {
        ...current,
        [fieldName]: list.map((existing) => (existing.id === item.id ? item : existing)),
      };
    },
  );
}

export function removeCachedListItem<TItem extends { id: string }>(
  queryOptions: QueryOptions,
  fieldName: string,
  id: string,
) {
  apolloClient.cache.updateQuery<Record<string, TItem[]> | null>(
    queryOptions,
    (current) => {
      const list = current?.[fieldName];
      if (!list) return current;
      return { ...current, [fieldName]: list.filter((item) => item.id !== id) };
    },
  );
}
