import * as eslexer from 'es-module-lexer';
import fetch from 'node-fetch';
import fs from 'fs';
import slash from 'slash';
import glob from 'tiny-glob';
import { fileURLToPath } from 'url';

type FileSizes = { [file: string]: number };

// Feel free to modify output to whatever’s needed in display. If it’s not needed, kill it and improve stat speeds!

/** JS: prioritize entry HTML, but also show total */
interface JSOutput {
  /** breakdown of JS per-file */
  js: FileSizes;
  /** weight of index.html */
  entryHTML?: number;
  /** total bytes of [js], added for convenience */
  total: number;
}

/** HTML: total isn’t important, because those are broken up requests. However, surface any anomalies / bloated HTML */
interface HTMLOutput {
  /** breakdown of HTML per-file */
  html: FileSizes;
  /** biggest HTML file */
  maxSize: number;
}

/** Scan any directory */
async function scan(cwd: URL, pattern: string): Promise<URL[]> {
  const results = await glob(pattern, { cwd: fileURLToPath(cwd) });
  return results.map((filepath) => new URL(slash(filepath), cwd));
}

/** get total HTML size */
export async function profileHTML({ cwd }: { cwd: URL }): Promise<HTMLOutput> {
  const sizes: FileSizes = {};
  const html = await scan(cwd, '**/*.html');
  let maxSize = 0;
  await Promise.all(
    html.map(async (file) => {
      const relPath = file.pathname.replace(cwd.pathname, '');
      const size = (await fs.promises.stat(file)).size;
      sizes[relPath] = size;
      if (size > maxSize) maxSize = size;
    })
  );
  return {
    html: sizes,
    maxSize,
  };
}

/** get total JS size (note: .wasm counts as JS!) */
export async function profileJS({ cwd, entryHTML }: { cwd: URL; entryHTML?: URL }): Promise<JSOutput> {
  const sizes: FileSizes = {};
  let htmlSize = 0;

  // profile HTML entry (do this first, before all JS in a project is scanned)
  if (entryHTML) {
    let entryScripts: URL[] = [];
    let visitedEntry = false; // note: a quirk of Vite is that the entry file is async-loaded. Count that, but don’t count subsequent async loads

    // Note: this function used cheerio to scan HTML, read deps, and build
    // an accurate, “production-ready” benchmark for how much HTML, JS, and CSS
    // you shipped. Disabled for now, because we have a post-merge cleanup item
    // to revisit these build stats.
    //
    // let $ = cheerio.load(await fs.promises.readFile(entryHTML));
    // scan <script> files, keep adding to total until done
    // $('script').each((n, el) => {
    //   const src = $(el).attr('src');
    //   const innerHTML = $(el).html();
    //   // if inline script, add to overall JS weight
    //   if (innerHTML) {
    //     htmlSize += Buffer.byteLength(innerHTML);
    //   }
    //   // otherwise if external script, load & scan it
    //   if (src) {
    //     entryScripts.push(new URL(src, entryHTML));
    //   }
    // });

    let scanPromises: Promise<void>[] = [];

    await Promise.all(entryScripts.map(parseJS));

    /** parse JS for imports, and add to total size */
    async function parseJS(url: URL): Promise<void> {
      const relPath = url.pathname.replace(cwd.pathname, '');
      if (sizes[relPath]) return;
      try {
        let code = url.protocol === 'file:' ? await fs.promises.readFile(url, 'utf8') : await fetch(url.href).then((body) => body.text());
        sizes[relPath] = Buffer.byteLength(code);
        const staticImports = eslexer.parse(code)[0].filter(({ d }) => {
          if (!visitedEntry) return true; // if we’re on the entry file, count async imports, too
          return d === -1; // subsequent runs: don’t count deferred code toward total
        });
        for (const { n } of staticImports) {
          if (!n) continue;
          let nextURL: URL | undefined;
          // external import
          if (n.startsWith('http://') || n.startsWith('https://') || n.startsWith('//')) nextURL = new URL(n);
          // relative import
          else if (n[0] === '.') nextURL = new URL(n, url);
          // absolute import (note: make sure "//" is already handled!)
          else if (n[0] === '/') nextURL = new URL(`.${n}`, cwd);
          if (!nextURL) continue; // unknown format: skip
          if (sizes[nextURL.pathname.replace(cwd.pathname, '')]) continue; // already scanned: skip
          scanPromises.push(parseJS(nextURL));
        }
      } catch (err) {
        console.warn(`Could not access ${url.href} to include in bundle size`); // eslint-disable-line no-console
      }
      visitedEntry = true; // after first run, stop counting async imports toward total
    }

    await Promise.all(scanPromises);

    htmlSize = Object.values(sizes).reduce((sum, next) => sum + next, 0);
  }

  // collect size of all JS in project (note: some may have already been scanned; skip when possible)
  const js = await scan(cwd, '**/*.(js|mjs|wasm)');
  await Promise.all(
    js.map(async (file) => {
      const relPath = file.pathname.replace(cwd.pathname, '');
      if (!sizes[relPath]) sizes[relPath] = (await fs.promises.stat(file)).size; // only scan if new
    })
  );

  return {
    js: sizes,
    entryHTML: htmlSize || undefined,
    total: Object.values(sizes).reduce((sum, acc) => sum + acc, 0),
  };
}

/** b -> kB */
export function kb(bytes: number): string {
  if (bytes === 0) return `0 kB`;
  return (Math.round(bytes / 1000) || 1) + ' kB'; // if this is between 0.1–0.4, round up to 1
}
