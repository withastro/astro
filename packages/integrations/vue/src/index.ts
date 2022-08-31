import type { Options } from '@vitejs/plugin-vue';
import vue from '@vitejs/plugin-vue';
import type { AstroIntegration, AstroRenderer } from 'astro';

function getRenderer(appEntrypoint?: string): AstroRenderer {
	return {
		name: '@astrojs/vue',
		clientEntrypoint: '@astrojs/vue/client.js',
		serverEntrypoint: '@astrojs/vue/server.js',
		appEntrypoint,
	};
}

function getViteConfiguration(options?: Options) {
	return {
		optimizeDeps: {
			include: ['@astrojs/vue/client.js', 'vue'],
			exclude: ['@astrojs/vue/server.js'],
		},
		plugins: [vue(options)],
		ssr: {
			external: ['@vue/server-renderer'],
		},
	};
}

export default function (options?: Options & { appEntrypoint?: string }): AstroIntegration {
	return {
		name: '@astrojs/vue',
		hooks: {
			'astro:config:setup': ({ addRenderer, updateConfig, injectScript }) => {
				injectScript('before-hydration', `import { h, Fragment, createApp } from 'vue';
import setup from "virtual:@astrojs/vue/app";

const el = document.createElement('astro-app');
el.setAttribute('renderer', '@astrojs/vue');
document.body.appendChild(el);

const app = createApp({
	setup: () => {
		console.log('setup');
		const children = ref([]);
		return () => h(Fragment, {}, [])
	} 
});
setup(app);
app.mount(el, false)

globalThis['@astrojs/preact'] = {
	addChild
}`)
				addRenderer(getRenderer(options?.appEntrypoint));
				updateConfig({ vite: getViteConfiguration(options) });
			},
		},
	};
}
