import type vite from '../vite';

import path from 'path';
import { viteID } from '../util.js';

// https://vitejs.dev/guide/features.html#css-pre-processors
export const STYLE_EXTENSIONS = new Set(['.css', '.pcss', '.postcss', '.scss', '.sass', '.styl', '.stylus', '.less']);

/**
 * getStylesForURL
 * Given a filePath URL, crawl Vite’s module graph to find style files
 */
export function getStylesForURL(filePath: URL, viteServer: vite.ViteDevServer): Set<string> {
  const css = new Set<string>();

  // recursively crawl module graph to get all style files imported by parent id
  function crawlCSS(id: string, scanned = new Set<string>()) {
    // note: use .idToModuleMap() for lookups (.urlToModuleMap() may produce different
    // URLs for modules depending on conditions, making resolution difficult)
    const moduleName = viteServer.moduleGraph.idToModuleMap.get(id);
    if (!moduleName || !moduleName.id) return;

    scanned.add(moduleName.id);

    // scan importedModules
    for (const importedModule of moduleName.importedModules) {
      if (!importedModule.id || scanned.has(importedModule.id)) continue;
      const ext = path.extname(importedModule.url.toLowerCase());
      if (STYLE_EXTENSIONS.has(ext)) {
        css.add(importedModule.url); // note: return `url`s for HTML (not .id, which will break Windows)
      }
      crawlCSS(importedModule.id, scanned);
      scanned.add(importedModule.id);
    }
  }

  crawlCSS(viteID(filePath));

  return css;
}
