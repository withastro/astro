import { AstroIntegration, AstroRenderer, ViteUserConfig } from 'astro';

function getRenderer(): AstroRenderer {
	return {
		name: '@astrojs/preact',
		clientEntrypoint: '@astrojs/preact/client.js',
		serverEntrypoint: '@astrojs/preact/server.js',
		jsxImportSource: 'preact',
		jsxTransformOptions: async () => {
			const {
				default: { default: jsx },
				// @ts-expect-error types not found
			} = await import('@babel/plugin-transform-react-jsx');
			return {
				plugins: [jsx({}, { runtime: 'automatic', importSource: 'preact' })],
			};
		},
	};
}

function getCompatRenderer(): AstroRenderer {
	return {
		name: '@astrojs/preact/compat',
		clientEntrypoint: '@astrojs/preact/client.js',
		serverEntrypoint: '@astrojs/preact/server.js',
		jsxImportSource: 'react',
		jsxTransformOptions: async () => {
			const {
				default: { default: jsx },
				// @ts-expect-error types not found
			} = await import('@babel/plugin-transform-react-jsx');
			return {
				plugins: [jsx({}, { runtime: 'automatic', importSource: 'preact/compat' })],
			};
		},
	};
}

function getViteConfiguration(compat?: boolean): ViteUserConfig {
	const viteConfig: ViteUserConfig = {
		optimizeDeps: {
			include: [
				'@astrojs/preact/client.js',
				'preact',
				'preact/jsx-runtime',
				'preact-render-to-string',
			],
			exclude: ['@astrojs/preact/server.js'],
		},
		ssr: {
			external: ['preact-render-to-string'],
		},
	};
	
	if (compat) {
    viteConfig.optimizeDeps!.include!.push('preact/compat');
    viteConfig.resolve = {
      alias: {
        react: 'preact/compat',
        'react-dom': 'preact/compat',
      },
      dedupe: ['react', 'react-dom'],
    };
  }
	
	return viteConfig
}

export default function ({ compat }: { compat?: boolean } = {}): AstroIntegration {
	return {
		name: '@astrojs/preact',
		hooks: {
			'astro:config:setup': ({ addRenderer, updateConfig }) => {
				addRenderer(getRenderer());
				if (compat) addRenderer(getCompatRenderer());
				updateConfig({
					vite: getViteConfiguration(compat),
				});
			},
		},
	};
}
