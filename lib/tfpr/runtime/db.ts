/**
 * TFPR Runtime — Postgres connection (v0 of WorkfileStore backing).
 *
 * FAIL LOUD: if DATABASE_URL is not set, every query throws. There is no
 * in-memory fallback and no fake success (TFPR_DECISION_RECORD §6.2).
 */
import { Pool, type QueryResultRow } from "pg";

let _pool: Pool | null = null;

export function getPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "[TFPR] DATABASE_URL is not configured — WorkfileStore cannot persist. " +
        "Fail-loud by contract (no in-memory fallback, no fake reload success).",
    );
  }
  if (!_pool) {
    _pool = new Pool({ connectionString: url, max: 5 });
  }
  return _pool;
}

export async function q<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await getPool().query<T>(text, params as unknown[]);
  return res.rows;
}

export function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return new Date(value as string).toISOString();
}
