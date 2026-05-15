import type { Options as VueOptions } from '@vitejs/plugin-vue';
import type { Options as VueJsxOptions } from '@vitejs/plugin-vue-jsx';
import type { AstroIntegration, AstroRenderer } from 'astro';
import type { VitePluginVueDevToolsOptions } from 'vite-plugin-vue-devtools';
interface Options extends VueOptions {
	jsx?: boolean | VueJsxOptions;
	appEntrypoint?: string;
	devtools?: boolean | Omit<VitePluginVueDevToolsOptions, 'appendTo'>;
}
declare function getRenderer(): AstroRenderer;
export { getRenderer as getContainerRenderer };
export default function (options?: Options): AstroIntegration;
