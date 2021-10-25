import type vite from '../../../vendor/vite';

import path from 'path';
import htmlparser2 from 'htmlparser2';

// https://vitejs.dev/guide/features.html#css-pre-processors
export const STYLE_EXTENSIONS = new Set(['.css', '.pcss', '.scss', '.sass', '.styl', '.stylus', '.less']);
export const PREPROCESSOR_EXTENSIONS = new Set(['.pcss', '.scss', '.sass', '.styl', '.stylus', '.less']);

/** find unloaded styles */
export function getStylesForID(id: string, viteServer: vite.ViteDevServer): Set<string> {
  const css = new Set<string>();
  const { idToModuleMap } = viteServer.moduleGraph;
  const moduleGraph = idToModuleMap.get(id);
  if (!moduleGraph) return css;

  // recursively crawl module graph to get all style files imported by parent id
  function crawlCSS(entryModule: string, scanned = new Set<string>()) {
    const moduleName = idToModuleMap.get(entryModule);
    if (!moduleName) return;
    for (const importedModule of moduleName.importedModules) {
      if (!importedModule.id || scanned.has(importedModule.id)) return;
      const ext = path.extname(importedModule.id.toLowerCase());

      if (STYLE_EXTENSIONS.has(ext)) {
        css.add(importedModule.id); // if style file, add to list
      } else {
        crawlCSS(importedModule.id, scanned); // otherwise, crawl file to see if it imports any CSS
      }
      scanned.add(importedModule.id);
    }
  }
  crawlCSS(id);

  return css;
}

/** add CSS <link> tags to HTML */
export function addLinkTagsToHTML(html: string, styles: Set<string>): string {
  let output = html;

  try {
    // get position of </head>
    let headEndPos = -1;
    const parser = new htmlparser2.Parser({
      onclosetag(tagname) {
        if (tagname === 'head') {
          headEndPos = parser.startIndex;
        }
      },
    });
    parser.write(html);
    parser.end();

    // update html
    if (headEndPos !== -1) {
      output = html.substring(0, headEndPos) + [...styles].map((href) => `<link rel="stylesheet" type="text/css" href="${href}">`).join('') + html.substring(headEndPos);
    }
  } catch (err) {
    // on invalid HTML, do nothing
  }

  return output;
}
