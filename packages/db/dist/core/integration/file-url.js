import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
async function copyFile(toDir, fromUrl, toUrl) {
	await fs.promises.mkdir(toDir, { recursive: true });
	await fs.promises.rename(fromUrl, toUrl);
}
function fileURLIntegration() {
	const fileNames = [];
	function createVitePlugin(command) {
		let referenceIds = [];
		return {
			name: '@astrojs/db/file-url',
			enforce: 'pre',
			load: {
				filter: {
					id: /\?fileurl$/,
				},
				async handler(id) {
					const filePath = id.slice(0, id.indexOf('?'));
					if (command === 'build') {
						const data = await fs.promises.readFile(filePath);
						const name = path.basename(filePath);
						const referenceId = this.emitFile({
							name,
							source: data,
							type: 'asset',
						});
						referenceIds.push(referenceId);
						return `export default import.meta.ROLLUP_FILE_URL_${referenceId};`;
					} else {
						return `export default new URL(${JSON.stringify(pathToFileURL(filePath).toString())})`;
					}
				},
			},
			generateBundle() {
				for (const referenceId of referenceIds) {
					fileNames.push(this.getFileName(referenceId));
				}
				referenceIds = [];
			},
		};
	}
	let config;
	return {
		name: '@astrojs/db/file-url',
		hooks: {
			'astro:config:setup'({ updateConfig, command }) {
				updateConfig({
					vite: {
						plugins: [createVitePlugin(command)],
					},
				});
			},
			'astro:config:done': ({ config: _config }) => {
				config = _config;
			},
			async 'astro:build:done'() {
				if (config.output === 'static') {
					const unlinks = [];
					for (const fileName of fileNames) {
						const url = new URL(fileName, config.outDir);
						unlinks.push(fs.promises.unlink(url));
					}
					await Promise.all(unlinks);
					const assetDir = new URL(config.build.assets, config.outDir);
					await fs.promises.rmdir(assetDir).catch(() => []);
				} else {
					const moves = [];
					for (const fileName of fileNames) {
						const fromUrl = new URL(fileName, config.build.client);
						const toUrl = new URL(fileName, config.build.server);
						const toDir = new URL('./', toUrl);
						moves.push(copyFile(toDir, fromUrl, toUrl));
					}
					await Promise.all(moves);
				}
			},
		},
	};
}
export { fileURLIntegration };
