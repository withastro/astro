import type { Plugin } from '../core/vite';
import type { AstroConfig } from '../@types/astro';

import { createRouteManifest } from '../core/ssr/routing.js';

export default function pluginSitemap({ config }: { config: AstroConfig }): Plugin {
  const VIRTUAL_FILE_ID = `virtual:@astrojs/sitemap`;
  
  return {
    name: '@astrojs/vite-plugin-sitemap',
    resolveId(id) {
      if (id === VIRTUAL_FILE_ID) {
        return VIRTUAL_FILE_ID
      }
      return null
    },
    load(id) {
      if (id === VIRTUAL_FILE_ID) {
        const routeManifest = createRouteManifest({ config });
        const sitemap: Record<string, any> = {};
        for (const route of routeManifest.routes) {
          if (route.pathname) {
            sitemap[route.pathname] = {
              component: '/' + route.component,
              dynamic: false
            }
          } else {
            const pathname = route.component.replace(/^src\/pages/, '').replace(/\.(md|astro)$/, '');
            sitemap[pathname] = {
              component: '/' + route.component,
              dynamic: true
            }
          }
        }
        return `export default ${JSON.stringify(sitemap)}`
      }
    }
  }
}
