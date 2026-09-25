import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ImagesBinding } from '@cloudflare/workers-types';
import { transformStream } from '../dist/utils/image-binding-transform-stream.js';

describe('Cloudflare Images binding transforms', () => {
	it('uses Cloudflare’s default quality when the transformation omits quality', async () => {
		let outputOptions: Record<string, unknown> | undefined;
		const images = {
			input() {
				return {
					transform() {
						return {
							output(options: Record<string, unknown>) {
								outputOptions = options;
								return { response: async () => new Response('image') };
							},
						};
					},
				};
			},
		} as unknown as ImagesBinding;

		await transformStream(new ReadableStream(), new URLSearchParams('f=webp'), images);

		assert.equal(outputOptions?.quality, 85);
	});

	it('passes undefined when quality is explicitly empty', async () => {
		let outputOptions: Record<string, unknown> | undefined;
		const images = {
			input() {
				return {
					transform() {
						return {
							output(options: Record<string, unknown>) {
								outputOptions = options;
								return { response: async () => new Response('image') };
							},
						};
					},
				};
			},
		} as unknown as ImagesBinding;

		await transformStream(new ReadableStream(), new URLSearchParams('f=webp&q='), images);

		assert.equal(outputOptions?.quality, undefined);
	});
});
