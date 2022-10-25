import { Plugin } from 'vite';
import type { AstroSettings } from '../@types/astro';

interface VirtualRendererOptions {
	settings: AstroSettings;
}

export default function virtualUserConfig({ settings }: VirtualRendererOptions) {
  const virtualModuleId = 'virtual:astro/user-config'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  const plugin: Plugin = {
    name: 'astro:virtual-user-config',
		enforce: 'pre',
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    load(id: string) {
      if (id === resolvedVirtualModuleId) {
				let mod = '';
				let i = 0;
				for (const renderer of settings.renderers) {
					mod += `import * as __ssr_renderer_${i} from "${renderer.serverEntrypoint}";\n`
					i++;
				}
				mod += `const renderers = [];\n`
				i = 0;
				for (const { name, clientEntrypoint } of settings.renderers) {
					mod += `renderers.push({ name: ${JSON.stringify(name)}, clientEntrypoint: ${JSON.stringify(clientEntrypoint)}, ssr: __ssr_renderer_${i} });\n`
					i++;
				}
				mod += `export default { renderers };`;

				return mod;
      }
    }
  }

	return plugin;
}
