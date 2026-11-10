import { defineConfig } from 'astro/config';
import { emitServerAsset } from 'astro/assets/utils';

/**
 * Emits a server-only file next to the server code, the way an integration
 * that precomputes data for server code to read at runtime would, and points
 * server code at it with a path relative to the chunk that reads it.
 * @returns {import('vite').Plugin}
 */
function serverOnlyAsset() {
	return {
		name: 'server-only-asset',
		apply: 'build',
		applyToEnvironment: (environment) => environment.name === 'ssr',
		buildStart() {
			emitServerAsset(this, {
				type: 'asset',
				fileName: 'server-only/data.txt',
				source: 'server-only data',
			});
			// The same name under the client assets directory: it must stay too.
			emitServerAsset(this, {
				type: 'asset',
				fileName: '_astro/server-only.txt',
				source: 'server-only data under _astro',
			});
		},
		renderChunk(code, chunk) {
			if (!code.includes('__SERVER_ONLY_ROOT__')) return null;
			const depth = chunk.fileName.split('/').length - 1;
			return { code: code.replaceAll('__SERVER_ONLY_ROOT__', '../'.repeat(depth) || './'), map: null };
		},
	};
}

export default defineConfig({
	integrations: [
		{
			name: 'server-only-asset',
			hooks: {
				'astro:config:setup': ({ updateConfig }) => {
					updateConfig({ vite: { plugins: [serverOnlyAsset()] } });
				},
			},
		},
	],
});
