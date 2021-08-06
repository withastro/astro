import type { Plugin } from 'vite';
import type { AstroConfig, Renderer } from '../../@types/astro.js';

import { camelCase } from 'camel-case';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { markdownToH } from '../markdown.js';

/** Transform .astro files for Vite */
export default function astro(config: AstroConfig): Plugin {
  return {
    name: '@astrojs/vite-plugin-astro',
    enforce: 'pre', // run transforms before other plugins can
    // note: don’t claim .astro files with resolveId() — it prevents Vite from transpiling the final JS (import.meta.globEager, etc.)
    async load(id) {
      if (id.endsWith('.astro') || id.endsWith('.md')) {
        // TODO: replace with compiler
        let code = await fs.promises.readFile(id, 'utf8');
        return {
          code: code,
          map: null,
        };
      }
      // inject renderers (TODO: improve this?)
      if (id.endsWith('runtime/__astro_component.js')) {
        let code = await fs.promises.readFile(id, 'utf8');
        let rendererCode = '';

        // add imports
        config.renderers.forEach((name) => {
          rendererCode += `import ${jsRef(name)} from '${name}';
import ${jsRef(name, '_ssr')} from '${name}/server';
`;
        });

        // initialize renderers
        rendererCode += `
function initRenderer(name, entry, ssr) {
  const join = (...parts) => parts.map((part) => part.replace(/^\\./, '')).join('');
  const renderer = {};
  renderer.name = name;
  renderer.ssr = ssr;
  if (entry.client) renderer.source = join(name, entry.client);
  if (Array.isArray(entry.hydrationPolyfills)) renderer.hydrationPolyfills = entry.hydrationPolyfills.map((src) => join(name, src));
  if (Array.isArray(entry.polyfills)) renderer.polyfills = entry.polyfills.map((src) => join(name, src));
  return renderer;
}
let rendererInstances = [
  ${config.renderers.map((name) => `initRenderer('${name}', ${jsRef(name)}, ${jsRef(name, '_ssr')})`).join(',\n')}
];
`;

        return {
          code: rendererCode + code,
          map: null,
        };
      }

      // UNCOMMENT WHEN MARKDOWN SUPPORT LANDS
      // } else if (id.endsWith('.md')) {
      //   let contents = await fs.promises.readFile(id, 'utf8');
      //   const filename = slash(id.replace(fileURLToPath(config.projectRoot), ''));
      //   return markdownToH(filename, contents);
      // }
      return null;
    },
    async handleHotUpdate({ file, modules, timestamp, server, read }) {
      // invalidate module
      const module = server.moduleGraph.getModuleById(file);
      if (module) server.moduleGraph.invalidateModule(module);

      try {
        const {
          default: { __render: render },
        } = await server.ssrLoadModule(file);
        const html = await render();
        server.ws.send({
          type: 'custom',
          event: 'astro:reload',
          data: {
            html,
          },
        });
      } catch (e) {
        server.ws.send({
          type: 'full-reload',
        });
      }
      return [];
    },
  };
}

/** Given any string (e.g. npm package name), generate a JS-friendly ref */
function jsRef(name: string, suffix = ''): string {
  return `__${camelCase(name)}${suffix}`;
}
