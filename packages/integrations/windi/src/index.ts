import type { AstroIntegration } from 'astro';
import path from 'path';
import { fileURLToPath } from 'url';
import WindiCSS from 'vite-plugin-windicss'

export default function windiIntegration(): AstroIntegration {
  return {
    name: '@astrojs/windi',
    hooks: {
      'astro:config:setup': ({ 
        config,
        updateConfig,
        addWatchFile,
        injectScript
      }) => {
        updateConfig({
          vite: {
            plugins: [
              WindiCSS({
                root: ".",
                scan: {
                  include: [path.join(fileURLToPath(config.srcDir), `**`, `*.{astro,html,js,jsx,svelte,ts,tsx,vue}`)]
                }
              })
            ]
          }
        })
        
        addWatchFile(new URL('./windi.config.js', config.root));
        injectScript('page-ssr', `import 'virtual:windi.css';`);
      }
    }
  }
}
  