import type { BuildOutput, BundleMap } from '../@types/astro';
import type { LogOptions } from '../logger';

import { info, table } from '../logger.js';
import { underline, bold } from 'kleur/colors';
import gzipSize from 'gzip-size';

interface BundleStats {
  size: number;
  gzipSize: number;
}

interface URLStats {
  dynamicImports: Set<string>;
  stats: BundleStats[];
}

export type BundleStatsMap = Map<string, BundleStats>;
export type URLStatsMap = Map<string, URLStats>;

export function createURLStats(): URLStatsMap {
  return new Map<string, URLStats>();
}

export function createBundleStats(): BundleStatsMap {
  return new Map<string, BundleStats>();
}

export async function addBundleStats(bundleStatsMap: BundleStatsMap, code: string, filename: string) {
  const gzsize = await gzipSize(code);

  bundleStatsMap.set(filename, {
    size: Buffer.byteLength(code),
    gzipSize: gzsize,
  });
}

export function mapBundleStatsToURLStats({ urlStats, depTree, bundleStats }: { urlStats: URLStatsMap; depTree: BundleMap; bundleStats: BundleStatsMap }) {
  for (let [srcPath, stats] of bundleStats) {
    for (let url of urlStats.keys()) {
      if (depTree[url] && depTree[url].js.has('/' + srcPath)) {
        urlStats.get(url)?.stats.push(stats);
      }
    }
  }
}

export async function collectBundleStats(buildState: BuildOutput, depTree: BundleMap): Promise<URLStatsMap> {
  const urlStats = createURLStats();

  await Promise.all(
    Object.keys(buildState).map(async (id) => {
      if (!depTree[id]) return;
      const stats = await Promise.all(
        [...depTree[id].js, ...depTree[id].css, ...depTree[id].images].map(async (url) => {
          if (!buildState[url]) return undefined;
          const stat = {
            size: Buffer.byteLength(buildState[url].contents),
            gzipSize: await gzipSize(buildState[url].contents),
          };
          return stat;
        })
      );
      urlStats.set(id, {
        dynamicImports: new Set<string>(),
        stats: stats.filter((s) => !!s) as any,
      });
    })
  );

  return urlStats;
}

export function logURLStats(logging: LogOptions, urlStats: URLStatsMap) {
  const builtURLs = [...urlStats.keys()].map((url) => url.replace(/index\.html$/, ''));
  builtURLs.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  info(logging, null, '');
  const log = table(logging, [60, 20]);
  log(info, '   ' + bold(underline('Pages')), bold(underline('Page Weight (GZip)')));

  const lastIndex = builtURLs.length - 1;
  builtURLs.forEach((url, index) => {
    const sep = index === 0 ? '┌' : index === lastIndex ? '└' : '├';
    const urlPart = ' ' + sep + ' ' + url;

    const bytes = (urlStats.get(url) || urlStats.get(url + 'index.html'))?.stats.map((s) => s.gzipSize).reduce((a, b) => a + b, 0) || 0;
    const kb = (bytes * 0.001).toFixed(2);
    const sizePart = kb + ' kB';
    log(info, urlPart + 'index.html', sizePart);
  });
}
