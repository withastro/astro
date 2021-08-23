import type { InputOptions, OutputOptions, OutputChunk } from 'rollup';
import type { BuildOutput } from '../../@types/astro';
import type { AstroRuntime } from '../../runtime';

import { fileURLToPath } from 'url';
import { rollup } from 'rollup';
import { terser } from 'rollup-plugin-terser';
import { createBundleStats, addBundleStats, BundleStatsMap } from '../stats.js';

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

/** Bundle JS action */
export async function bundleJS(imports: Set<string>, { astroRuntime, dist }: BundleOptions): Promise<BundleStatsMap> {
  const ROOT = 'astro:root';
  const root = `
  ${[...imports].map((url) => `import '${url}';`).join('\n')}
`;

  const inputOptions: InputOptions = {
    input: [...imports],
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
