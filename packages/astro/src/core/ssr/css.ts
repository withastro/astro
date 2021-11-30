import type vite from '../vite';

import path from 'path';
import { viteifyURL } from '../util.js';

// https://vitejs.dev/guide/features.html#css-pre-processors
export const STYLE_EXTENSIONS = new Set(['.css', '.pcss', '.postcss', '.scss', '.sass', '.styl', '.stylus', '.less']);

/** find unloaded styles */
export function getStylesForURL(filePath: URL, viteServer: vite.ViteDevServer): Set<string> {
  const css = new Set<string>();
  const rootID = viteifyURL(filePath);

  // recursively crawl module graph to get all style files imported by parent id
  function crawlCSS(entryModule: string, scanned = new Set<string>()) {
    const moduleName = viteServer.moduleGraph.urlToModuleMap.get(entryModule);
    if (!moduleName || !moduleName.id) return;
    // mark the entrypoint as scanned to avoid an infinite loop
    scanned.add(moduleName.url);
    for (const importedModule of moduleName.importedModules) {
      if (!importedModule.url || scanned.has(importedModule.url)) continue;
      const ext = path.extname(importedModule.url.toLowerCase());
      if (STYLE_EXTENSIONS.has(ext)) {
        css.add(importedModule.url); // if style file, add to list
      } else {
        crawlCSS(importedModule.url, scanned); // otherwise, crawl file to see if it imports any CSS
      }
      scanned.add(importedModule.url);
    }
  }
  crawlCSS(rootID);

  return css;
}
