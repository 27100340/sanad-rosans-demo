/**
 * Process-wide singletons for the demo's mutable records. Next's dev server
 * can evaluate a module once per route bundle, which would give the API
 * routes and the pages separate copies of the same array; anchoring the
 * arrays on `globalThis` keeps one copy per process. Production swaps the
 * mock modules for Supabase, and this file goes with them.
 */
const KEY = "__sanadStore";

export function singleton<T>(name: string, init: () => T): T {
  const g = globalThis as unknown as { [KEY]?: Record<string, unknown> };
  const store = (g[KEY] ??= {});
  if (!(name in store)) store[name] = init();
  return store[name] as T;
}
