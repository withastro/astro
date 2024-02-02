
import type { Plugin } from 'vite';
import { createViteLoader } from '../core/module-loader/vite.js';


export default function astroDevLoader({ mode }: { mode: string }): Plugin {
	return {
		name: 'astro:dev-loader',
		resolveId(id) {
      if(id === 'astro:dev-module-loader') {
        return '\0' + id;
      }
    },
    async configureServer(server) {
      if (mode === "dev") {
				// This makes the module loader available inside of runtime modules
        const module = await server.moduleGraph.ensureEntryFromUrl('\0' + 'astro:dev-module-loader', true);
        const loader = createViteLoader(server);
        module.ssrModule = { default: loader };
      }
    },
	};
}
