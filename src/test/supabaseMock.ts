import { vi } from 'vitest';

function createQueryBuilder(resolvedData: unknown = [], resolvedError: unknown = null) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};

  const methods = ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'order', 'single', 'maybeSingle'];

  for (const method of methods) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }

  // single() が最後に呼ばれた場合は配列でなくオブジェクトを返す
  builder['single'] = vi.fn().mockResolvedValue({
    data: Array.isArray(resolvedData) ? resolvedData[0] : resolvedData,
    error: resolvedError,
  });

  // then-able にするために最終的な Promise 解決も
  builder['then'] = vi.fn().mockImplementation((resolve: (value: unknown) => void) => {
    return resolve({ data: resolvedData, error: resolvedError });
  });

  // 各メソッドが返すオブジェクトも Promise-like にする
  const promiseBuilder = new Proxy(builder, {
    get(target, prop) {
      if (prop === 'then') {
        return (resolve: (value: unknown) => void) =>
          Promise.resolve({ data: resolvedData, error: resolvedError }).then(resolve);
      }
      return target[prop as string];
    },
  });

  return promiseBuilder;
}

export function createMockSupabase() {
  const queryBuilders = new Map<string, ReturnType<typeof createQueryBuilder>>();

  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (!queryBuilders.has(table)) {
        queryBuilders.set(table, createQueryBuilder());
      }
      return queryBuilders.get(table);
    }),
    mockTable: (table: string, data: unknown, error: unknown = null) => {
      queryBuilders.set(table, createQueryBuilder(data, error));
    },
  };
}
