import type vite from '../vite';

import path from 'path';
import { viteifyURL } from '../util.js';

// https://vitejs.dev/guide/features.html#css-pre-processors
export const STYLE_EXTENSIONS = new Set(['.css', '.pcss', '.scss', '.sass', '.styl', '.stylus', '.less']);

/** find unloaded styles */
export function getStylesForURL(filePath: URL, viteServer: vite.ViteDevServer): Set<string> {
  const css = new Set<string>();
  const { idToModuleMap } = viteServer.moduleGraph;
  const rootID = viteifyURL(filePath);
  const moduleGraph = idToModuleMap.get(rootID);
  if (!moduleGraph) return css;

  // recursively crawl module graph to get all style files imported by parent id
  function crawlCSS(entryModule: string, scanned = new Set<string>()) {
    const moduleName = idToModuleMap.get(entryModule);
    if (!moduleName) return;
    for (const importedModule of moduleName.importedModules) {
      if (!importedModule.id || scanned.has(importedModule.id)) continue;
      const ext = path.extname(importedModule.id.toLowerCase());
      if (STYLE_EXTENSIONS.has(ext)) {
        css.add(importedModule.id); // if style file, add to list
      } else {
        crawlCSS(importedModule.id, scanned); // otherwise, crawl file to see if it imports any CSS
      }
      scanned.add(importedModule.id);
    }
  }
  crawlCSS(rootID);

  return css;
}
