import type { CreateCollectionResult } from './@types/astro';

export function validateCollectionModule(mod: any, filename: string) {
  if (!mod.exports.createCollection) {
    throw new Error(`No "createCollection()" export found. Add one or remove the "$" from the filename. ("${filename}")`);
  }
}
export function validateCollectionResult(result: CreateCollectionResult, filename: string) {
  const LEGACY_KEYS = new Set(['permalink', 'data', 'routes']);
  for (const key of Object.keys(result)) {
    if (LEGACY_KEYS.has(key)) {
      throw new Error(`[deprecated] it looks like you're using the legacy createCollection() API. (key "${key}". (${filename})`);
    }
  }
  const VALID_KEYS = new Set(['route', 'paths', 'props', 'paginate', 'rss']);
  for (const key of Object.keys(result)) {
    if (!VALID_KEYS.has(key)) {
      throw new Error(`[createCollection] unknown option: "${key}". (${filename})`);
    }
  }
  const REQUIRED_KEYS = new Set(['route', 'props']);
  for (const key of REQUIRED_KEYS) {
    if (!(result as any)[key]) {
      throw new Error(`[createCollection] missing required option: "${key}". (${filename})`);
    }
  }
  if (result.paginate && !result.route.includes(':page?')) {
    throw new Error(`[createCollection] when "paginate: true" route must include a "/:page?" param. (${filename})`);
  }
}
