import type vite from '../core/vite';
import type { AstroConfig } from '../@types/astro';

interface AstroPluginOptions {
  config: AstroConfig;
}

/** Transform .astro files for Vite */
export default function astro({ config }: AstroPluginOptions): vite.Plugin {
  return {
    name: '@astrojs/vite-plugin-external',
    enforce: 'pre',
    resolveId(source, importer, options) {
      if (source.includes('.config.')) {
        console.log({ source, importer, options });
      }
      return null;
    }
  };
}
