import { SQL } from 'drizzle-orm'
import type { MySqlTable, TableConfig } from 'drizzle-orm/mysql-core'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { env } from '@/env.mjs'

// More specific type definitions
type DbTable = MySqlTable<TableConfig>
type SqlValue = string | number | boolean | null | Date
type WhereCondition = SQL<unknown>
type SetValues = Record<string, unknown>
type DrizzleInstance = ReturnType<typeof drizzle>

let _connection: mysql.Connection | null = null;
let _db: DrizzleInstance | null = null;

export async function getConnection() {
  if (!_connection) {
    _connection = await mysql.createConnection({
      host: env.DATABASE_HOST,
      user: env.DATABASE_USER,
      password: env.DATABASE_PASSWORD,
      database: env.DATABASE_NAME,
      port: env.DATABASE_PORT
    });
  }
  return _connection;
}

export async function getDb() {
  if (!_db) {
    const connection = await getConnection();
    _db = drizzle(connection);
  }
  return _db;
}

// For backwards compatibility
export const db = {
  getDb,
  select: async <T>(table: DbTable): Promise<T> => {
    const dbInstance = await getDb();
    const result = await dbInstance.select().from(table).execute();
    return result as unknown as T;
  },
  insert: async <T>(table: DbTable, values: Record<string, unknown>): Promise<T> => {
    const dbInstance = await getDb();
    const result = await dbInstance.insert(table).values(values).execute();
    return result as unknown as T;
  },
  update: async <T>(table: DbTable, set: SetValues, where: WhereCondition): Promise<T> => {
    const dbInstance = await getDb();
    const result = await dbInstance.update(table).set(set).where(where).execute();
    return result as unknown as T;
  },
  delete: async <T>(table: DbTable, where: WhereCondition): Promise<T> => {
    const dbInstance = await getDb();
    const result = await dbInstance.delete(table).where(where).execute();
    return result as unknown as T;
  },
  transaction: async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> => {
    const dbInstance = await getDb();
    return dbInstance.transaction(async (tx) => {
      // Pass the transaction directly to the function
      return await fn(tx);
    });
  },
  execute: async <T>(query: string, values?: SqlValue[]): Promise<T> => {
    const connection = await getConnection();
    const [rows] = await connection.execute(query, values || []);
    return rows as T;
  },
}; 