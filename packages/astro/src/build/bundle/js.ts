import type { InputOptions, OutputOptions, OutputChunk } from 'rollup';
import type { AstroConfig, BundleMap, BuildOutput, ScriptInfo, InlineScriptInfo } from '../../@types/astro';
import type { AstroRuntime } from '../../runtime';
import type { LogOptions } from '../../logger.js';

import { fileURLToPath } from 'url';
import { rollup } from 'rollup';
import { terser } from 'rollup-plugin-terser';
import { createBundleStats, addBundleStats, BundleStatsMap } from '../stats.js';
import { IS_ASTRO_FILE_URL } from '../util.js';
import cheerio from 'cheerio';
import path from 'path';

interface BundleOptions {
  dist: URL;
  astroRuntime: AstroRuntime;
}

/** Collect JS imports from build output */
export function collectJSImports(buildState: BuildOutput): Set<string> {
  const imports = new Set<string>();
  for (const id of Object.keys(buildState)) {
    if (buildState[id].contentType === 'application/javascript') imports.add(id);
  }
  return imports;
}

function pageUrlToVirtualJSEntry(pageUrl: string) {
  return 'astro-virtual:' + pageUrl.replace(/.html$/, '').replace(/^\./, '') + '.js';
}

export async function bundleHoistedJS({
  buildState,
  astroConfig,
  logging,
  depTree,
  dist,
  runtime,
}: {
  astroConfig: AstroConfig;
  buildState: BuildOutput;
  logging: LogOptions;
  depTree: BundleMap;
  dist: URL;
  runtime: AstroRuntime;
}) {
  const sortedPages = Object.keys(depTree); // these were scanned in parallel; sort to create somewhat deterministic order
  sortedPages.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

  /**
   * 1. Go over sorted pages and create a virtual module for all of its dependencies
   */
  const entryImports: string[] = [];
  const virtualScripts = new Map<string, ScriptInfo>();
  const pageToEntryMap = new Map<string, string>();

  for (let pageUrl of sortedPages) {
    const hoistedJS = depTree[pageUrl].hoistedJS;
    if (hoistedJS.size) {
      for (let [url, scriptInfo] of hoistedJS) {
        if (virtualScripts.has(url) || !url.startsWith('astro-virtual:')) continue;
        virtualScripts.set(url, scriptInfo);
      }
      const entryURL = pageUrlToVirtualJSEntry(pageUrl);
      const entryJS = Array.from(hoistedJS.keys())
        .map((url) => `import '${url}';`)
        .join('\n');
      virtualScripts.set(entryURL, {
        content: entryJS,
      });
      entryImports.push(entryURL);
      pageToEntryMap.set(pageUrl, entryURL);
    }
  }

  if (!entryImports.length) {
    // There are no hoisted scripts, bail
    return;
  }

  /**
   * 2. Run the bundle to bundle each pages JS into a single bundle (with shared content)
   */
  const inputOptions: InputOptions = {
    input: entryImports,
    plugins: [
      {
        name: 'astro:build',
        resolveId(source: string, imported?: string) {
          if (virtualScripts.has(source)) {
            return source;
          }
          if (source.startsWith('/')) {
            return source;
          }

          if (imported) {
            const outUrl = new URL(source, 'http://example.com' + imported);
            return outUrl.pathname;
          }

          return null;
        },
        async load(id: string) {
          if (virtualScripts.has(id)) {
            let info = virtualScripts.get(id) as InlineScriptInfo;
            return info.content;
          }

          const result = await runtime.load(id);

          if (result.statusCode !== 200) {
            return null;
          }

          return result.contents.toString('utf-8');
        },
      },
    ],
  };

  const build = await rollup(inputOptions);

  const outputOptions: OutputOptions = {
    dir: fileURLToPath(dist),
    format: 'esm',
    exports: 'named',
    entryFileNames(chunk) {
      const { facadeModuleId } = chunk;
      if (!facadeModuleId) throw new Error(`facadeModuleId missing: ${chunk.name}`);
      return facadeModuleId.substr('astro-virtual:/'.length, facadeModuleId.length - 'astro-virtual:/'.length - 3 /* .js */) + '-[hash].js';
    },
    plugins: [
      // We are using terser for the demo, but might switch to something else long term
      // Look into that rather than adding options here.
      terser(),
    ],
  };

  const { output } = await build.write(outputOptions);

  /**
   * 3. Get a mapping of the virtual filename to the chunk file name
   */
  const entryToChunkFileName = new Map<string, string>();
  output.forEach((chunk) => {
    const { fileName, facadeModuleId, isEntry } = chunk as OutputChunk;
    if (!facadeModuleId || !isEntry) return;
    entryToChunkFileName.set(facadeModuleId, fileName);
  });

  /**
   * 4. Update the original HTML with the new chunk scripts
   */
  Object.keys(buildState).forEach((id) => {
    if (buildState[id].contentType !== 'text/html') return;

    const entryVirtualURL = pageUrlToVirtualJSEntry(id);
    let hasHoisted = false;
    const $ = cheerio.load(buildState[id].contents);
    $('script[data-astro="hoist"]').each((i, el) => {
      hasHoisted = true;
      if (i === 0) {
        let chunkName = entryToChunkFileName.get(entryVirtualURL);
        if (!chunkName) return;
        let chunkPathname = '/' + chunkName;
        let relLink = path.relative(path.dirname(id), chunkPathname);
        $(el).attr('src', relLink.startsWith('.') ? relLink : './' + relLink);
        $(el).removeAttr('data-astro');
        $(el).html('');
      } else {
        $(el).remove();
      }
    });

    if (hasHoisted) {
      (buildState[id] as any).contents = $.html(); // save updated HTML in global buildState
    }
  });
}

/** Bundle JS action */
export async function bundleJS(imports: Set<string>, { astroRuntime, dist }: BundleOptions): Promise<BundleStatsMap> {
  const ROOT = 'astro:root';
  const validImports = [...imports].filter((url) => IS_ASTRO_FILE_URL.test(url));
  const root = `
  ${validImports.map((url) => `import '${url}';`).join('\n')}
`;

  const inputOptions: InputOptions = {
    input: validImports,
    plugins: [
      {
        name: 'astro:build',
        resolveId(source: string, imported?: string) {
          if (source === ROOT) {
            return source;
          }
          if (source.startsWith('/')) {
            return source;
          }

          if (imported) {
            const outUrl = new URL(source, 'http://example.com' + imported);
            return outUrl.pathname;
          }

          return null;
        },
        async load(id: string) {
          if (id === ROOT) {
            return root;
          }

          const result = await astroRuntime.load(id);

          if (result.statusCode !== 200) {
            return null;
          }

          return result.contents.toString('utf-8');
        },
      },
    ],
  };

  const build = await rollup(inputOptions);

  const outputOptions: OutputOptions = {
    dir: fileURLToPath(dist),
    format: 'esm',
    exports: 'named',
    entryFileNames(chunk) {
      const { facadeModuleId } = chunk;
      if (!facadeModuleId) throw new Error(`facadeModuleId missing: ${chunk.name}`);
      return facadeModuleId.substr(1);
    },
    plugins: [
      // We are using terser for the demo, but might switch to something else long term
      // Look into that rather than adding options here.
      terser(),
    ],
  };

  const stats = createBundleStats();
  const { output } = await build.write(outputOptions);
  await Promise.all(
    output.map(async (chunk) => {
      const code = (chunk as OutputChunk).code || '';
      await addBundleStats(stats, code, chunk.fileName);
    })
  );

  return stats;
}
