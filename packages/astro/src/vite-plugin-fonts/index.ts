import type { Plugin } from '../core/vite';
import type { LogOptions } from '../core/logger';
import type { AstroConfig } from '../@types/astro';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
// @ts-expect-error
import fetch from 'node-fetch';
const streamPipeline = promisify(pipeline);

export let fontFamilies: string[] = [];

export default async function createPluginjsx({ config, logging }: { config: AstroConfig; logging: LogOptions }): Promise<Plugin> {
	// Load the fonts
	const fonts = config.fonts;
	const fontQueries = fonts.reduce((collect, fontQuery) => {
		const [fontId, fontWeight] = fontQuery.split('@');
		if (!collect.has(fontId)) {
			collect.set(fontId, []);
		}
		collect.get(fontId)!.push(fontWeight || '400');
		return collect;
	}, new Map<string, string[]>());

	fontFamilies.length = 0; // hack: clear the array without losing a reference
	await Promise.all(
		[...fontQueries.entries()].map(async ([fontId, fontWeights]) => {
			const data = await fetch(`https://google-webfonts-helper.herokuapp.com/api/fonts/${fontId}`).then((r: any) => r.json());
			// console.log(data, fontId, fontWeights);
			for (const fontWeight of fontWeights) {
				const variant = data.variants.find((v: any) => v.fontWeight == fontWeight);
				if (!variant) {
					throw new Error('AHH!');
				}
				const downloadFontId = 'assets/' + fontId + '-' + fontWeight + '.woff2';

				const fontDownloadResponse = await fetch(variant.woff2);
				if (!fontDownloadResponse.ok) throw new Error(`unexpected response ${fontDownloadResponse.statusText}`);
				await streamPipeline(fontDownloadResponse.body, createWriteStream(new URL(downloadFontId, config.public)));

				fontFamilies.push(
					`@font-face {
				font-family: ${variant.fontFamily};
				font-style: ${variant.fontStyle};
				font-weight: ${variant.fontWeight};
				font-display: 'optional';
				src: local(''),
						url('/${downloadFontId}') format('woff2');
			}`.replace(/(^\s*)|\n/gm, '')
				);
			}
		})
	);

	return {
		name: 'astro:fonts',
		async configureServer() {},
	};
}
