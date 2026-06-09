import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------
//  Úložiště hlasů.
//  V produkci: Upstash Redis (env proměnné nastaví Vercel automaticky).
//  Lokálně bez Redisu: dočasná paměť (data se po restartu serveru ztratí).
// ---------------------------------------------------------------

type RankingStore = {
  hset: (key: string, field: string, value: string) => Promise<void>;
  hgetall: (key: string) => Promise<Record<string, string>>;
  hget: (key: string, field: string) => Promise<string | null>;
};

function makeMemoryStore(): RankingStore {
  // Pozn.: v serverless prostředí toto NEpřežije mezi requesty.
  // Slouží jen pro lokální vývoj bez nastaveného Redisu.
  const g = globalThis as unknown as { __memStore?: Map<string, Map<string, string>> };
  if (!g.__memStore) g.__memStore = new Map();
  const mem = g.__memStore;
  return {
    async hset(key, field, value) {
      if (!mem.has(key)) mem.set(key, new Map());
      mem.get(key)!.set(field, value);
    },
    async hgetall(key) {
      const m = mem.get(key);
      if (!m) return {};
      return Object.fromEntries(m.entries());
    },
    async hget(key, field) {
      return mem.get(key)?.get(field) ?? null;
    },
  };
}

function makeRedisStore(): RankingStore {
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  const redis = new Redis({ url: url!, token: token! });
  return {
    async hset(key, field, value) {
      await redis.hset(key, { [field]: value });
    },
    async hgetall(key) {
      const data = await redis.hgetall<Record<string, string>>(key);
      return data ?? {};
    },
    async hget(key, field) {
      return await redis.hget<string>(key, field);
    },
  };
}

export const hasRedis = Boolean(
  (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) &&
    (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN)
);

export const store: RankingStore = hasRedis
  ? makeRedisStore()
  : makeMemoryStore();

export function votesKey(pollId: string): string {
  return `poll:${pollId}:votes`;
}
