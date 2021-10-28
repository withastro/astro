import type { AstroConfig } from '../@types/astro-core';
import type { PluginContext } from 'rollup';
import type { ResolvedConfig } from 'vite';
import fs, { promises as fsp } from 'fs';
import mime from 'mime/lite';
import path from 'path';
import { createHash } from 'crypto'

const assetCache = new WeakMap<ResolvedConfig, Map<string, string>>();
const assetHashToFilenameMap = new WeakMap<
  ResolvedConfig,
  Map<string, string>
>();

export function getAssetHash(content: Buffer): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 8)
}

export async function fileToBuiltUrl(
  id: string,
  config: ResolvedConfig,
  pluginContext: PluginContext,
  skipPublicCheck = false
): Promise<string> {
  const cache = assetCache.get(config)!
  const cached = cache.get(id)
  if (cached) {
    return cached
  }

  const file = id;//cleanUrl(id)
  const content = await fsp.readFile(file);

  let url: string
  if (
    config.build.lib ||
    (!file.endsWith('.svg') &&
      content.length < Number(config.build.assetsInlineLimit))
  ) {
    // base64 inlined as a string
    url = `data:${mime.getType(file)};base64,${content.toString('base64')}`
  } else {
    // emit as asset
    // rollup supports `import.meta.ROLLUP_FILE_URL_*`, but it generates code
    // that uses runtime url sniffing and it can be verbose when targeting
    // non-module format. It also fails to cascade the asset content change
    // into the chunk's hash, so we have to do our own content hashing here.
    // https://bundlers.tooling.report/hashing/asset-cascade/
    // https://github.com/rollup/rollup/issues/3415
    const map = assetHashToFilenameMap.get(config)!
    const contentHash = getAssetHash(content)
    const { search, hash } = parseUrl(id)
    const postfix = (search || '') + (hash || '')
    const output = config.build?.rollupOptions?.output
    const assetFileNames =
      (output && !Array.isArray(output) ? output.assetFileNames : undefined) ??
      // defaults to '<assetsDir>/[name].[hash][extname]'
      // slightly different from rollup's one ('assets/[name]-[hash][extname]')
      path.posix.join(config.build.assetsDir, '[name].[hash][extname]')
    const fileName = assetFileNamesToFileName(
      assetFileNames,
      file,
      contentHash,
      content
    )
    if (!map.has(contentHash)) {
      map.set(contentHash, fileName)
    }
    const emittedSet = emittedHashMap.get(config)!
    if (!emittedSet.has(contentHash)) {
      const name = normalizePath(path.relative(config.root, file))
      pluginContext.emitFile({
        name,
        fileName,
        type: 'asset',
        source: content
      })
      emittedSet.add(contentHash)
    }

    url = `__VITE_ASSET__${contentHash}__${postfix ? `$_${postfix}__` : ``}`
  }

  cache.set(id, url)
  return url
}