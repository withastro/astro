import fs from 'fs';
import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';

export class HTMLCache {
  db: Database | undefined;
  idMap = new Map<string, number>();
  filename: string;
  table = 'html_cache';

  constructor({ projectRoot, dist }: { projectRoot: URL; dist: URL }) {
    const cacheDir = new URL('./node_modules/.astro/', projectRoot);
    fs.mkdirSync(cacheDir, { recursive: true });

    // note: the ext is needed so multiple builds can run in parallel for the same source
    // the only chance of conflict would be if multiple builds are building to the same dist
    // dir, which would have problems anyway
    const ext = dist.href.replace(projectRoot.href, '').replace(/\/$/, '').replace(/\//g, '-');
    const filePath = new URL(`html-cache-${ext}.sqlite`, cacheDir);
    this.filename = fileURLToPath(filePath);
  }

  async set(pathname: string, html: string): Promise<void> {
    if (!this.db) await this.init();
    const db = this.db as Database;

    try {
      // update
      if (this.idMap.has(pathname)) {
        const id = this.idMap.get(pathname) as number;
        await db.run(`UPDATE ${this.table} SET html = $html WHERE id = $id LIMIT 1`, { $id: id, $html: html });
      }
      // create
      else {
        const result = await db.run(`INSERT INTO ${this.table} (html) VALUES ($html)`, { $html: html });
        this.idMap.set(pathname, result.lastID as number);
      }
    } catch {
      throw new Error(`[@astrojs/vite-plugin-build-html] trouble caching HTML for ${pathname}`);
    }
  }

  async get(pathname: string): Promise<string | undefined> {
    if (!this.db) await this.init();
    const db = this.db as Database;
    const id = this.idMap.get(pathname);
    if (!id) return undefined;

    const result = await db.get(`SELECT html FROM ${this.table} WHERE id = ${id} LIMIT 1`);
    return result ? result.html : undefined; // note: unescaping double quotes not necessary on retrieval
  }

  async teardown() {
    if (this.db) await this.db.close();
  }

  private async init() {
    if (!this.db) {
      this.db = await open({ filename: this.filename, driver: sqlite3.Database });
      await this.db.exec(`CREATE TABLE IF NOT EXISTS ${this.table} (id INTEGER PRIMARY KEY AUTOINCREMENT, html TEXT)`);
      await this.db.exec(`DELETE FROM ${this.table}`); // if db exists from previous run, we can re-use it but must clear it out first
    }
  }
}
