import { fileURLToPath } from 'url';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

const DB_PATH = new URL('./test/test-state.sqlite', import.meta.url);

export default async function setup() {
  const db = await open({ filename: fileURLToPath(DB_PATH), driver: sqlite3.Database });
  await db.exec(`CREATE TABLE IF NOT EXISTS test_ports (id INTEGER PRIMARY KEY AUTOINCREMENT, port INTEGER)`);
}
