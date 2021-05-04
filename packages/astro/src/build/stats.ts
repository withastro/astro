import type { LogOptions } from '../logger';

import { info, table } from '../logger.js';
import { underline } from 'kleur/colors';
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
    gzipSize: gzsize
  });
}

export function mapBundleStatsToURLStats(urlStats: URLStatsMap, importsToUrl: Map<string, Set<string>>, bundleStats: BundleStatsMap) {
  for(let [imp, stats] of bundleStats) {
    for(let url of importsToUrl.get('/' + imp) || []) {
      urlStats.get(url)?.stats.push(stats);
    }
  }
}

export function logURLStats(logging: LogOptions, urlStats: URLStatsMap, builtURLs: string[]) {
  builtURLs.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  info(logging, null, '');
  const log = table(logging, [60, 20]);
  log(info, '   ' + underline('Pages'), underline('GZip Size'));

  const lastIndex = builtURLs.length - 1;
  builtURLs.forEach((url, index) => {
    const sep = index === 0 ? '┌' : index === lastIndex ? '└' : '├';
    const urlPart = (' ' + sep + ' ') + (url === '/' ? url : url + '/');

    const bytes = urlStats.get(url)?.stats.map(s => s.gzipSize).reduce((a, b) => a + b, 0) || 0;
    const kb = (bytes * 0.001).toFixed(2);
    const sizePart = kb + ' kB';
    log(info, urlPart, sizePart);
  });
}