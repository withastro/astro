import fs from 'fs';

const DB_NAME = './test/test-state.sqlite';
const DB_PATH = new URL(DB_NAME, import.meta.url);

export default async function teardown() {
  if (fs.existsSync(DB_PATH)) fs.rmSync(DB_PATH);
}
