import type { Plugin } from 'vite';
import MagicString from 'magic-string';

// This matches any JS-like file (that we know of)
// See https://regex101.com/r/Cgofir/1
const SUPPORTED_FILES = /\.(astro|svelte|vue|[cm]?js|jsx|[cm]?ts|tsx)$/;
const IGNORED_MODULES = [/astro\/dist\/runtime\/server/, /\/node-fetch\//];
const DEFINE_FETCH = `import fetch from 'node-fetch';\n`;

export default function pluginFetch(): Plugin {
  return {
    name: '@astrojs/vite-plugin-fetch',
    enforce: 'post',
    async transform(code, id, opts) {
      // If this isn't an SSR pass, `fetch` will already be available!
      if (opts?.ssr !== true) {
        return null;
      }
      // Only transform JS-like files
      if (!id.match(SUPPORTED_FILES)) {
        return null;
      }
      // Optimization: only run on probable matches
      if (!code.includes('fetch')) {
        return null;
      }
      // Ignore specific modules
      for (const ignored of IGNORED_MODULES) {
        if (id.match(ignored)) {
          return null;
        }
      }
      const s = new MagicString(code);
      s.prepend(DEFINE_FETCH);
      const result = s.toString();
      const map = s.generateMap({
        source: id,
        includeContent: true,
      });
      return { code: result, map };
    },
  };
}
