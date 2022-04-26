import type { AstroConfig, AstroIntegration } from 'astro';
import sirv from './sirv.js';
import { partytownSnippet } from '@builder.io/partytown/integration';
import { copyLibFiles } from '@builder.io/partytown/utils';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import path from 'path';
const resolve = createRequire(import.meta.url).resolve;

export default function createPlugin(): AstroIntegration {
	let config: AstroConfig;
	let partytownSnippetHtml: string;
	const partytownEntrypoint = resolve('@builder.io/partytown/package.json');
	const partytownLibDirectory = path.resolve(partytownEntrypoint, '../lib');
	return {
		name: '@astrojs/partytown',
		hooks: {
			'astro:config:setup': ({ config: _config, command, injectScript }) => {
				partytownSnippetHtml = partytownSnippet({ debug: command === 'dev' });
				injectScript('head-inline', partytownSnippetHtml);
			},
			'astro:config:done': ({ config: _config }) => {
				config = _config;
			},
			'astro:server:setup': ({ server }) => {
				server.middlewares.use(
					sirv(partytownLibDirectory, {
						mount: '/~partytown',
						dev: true,
						etag: true,
						extensions: [],
					})
				);
			},
			'astro:build:done': async ({ dir }) => {
				await copyLibFiles(fileURLToPath(new URL('~partytown', dir)), {
					debugDir: false,
				});
			},
		},
	};
}
