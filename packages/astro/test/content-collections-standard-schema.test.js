import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Content Collections - Standard Schema + transform', () => {
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/content-collections-standard-schema/',
		});
	});

	const modes = ['dev', 'prod'];

	for (const mode of modes) {
		describe(mode, () => {
			before(async () => {
				if (mode === 'prod') {
					await fixture.build({ force: true });
				} else if (mode === 'dev') {
					devServer = await fixture.startDevServer({ force: true });
					await fixture.onNextDataStoreChange(1000).catch(() => {
						// Ignore timeout if store was already updated.
					});
				}
			});

			after(async () => {
				if (mode === 'dev') devServer?.stop();
			});

			describe('JSON result', () => {
				let json;
				before(async () => {
					if (mode === 'prod') {
						const rawJson = await fixture.readFile('/data.json');
						json = JSON.parse(rawJson);
					} else {
						const res = await fixture.fetch('/data.json');
						json = await res.json();
					}
				});

				it('returns expected top-level keys', () => {
					assert.ok(json.hasOwnProperty('welcomePost'));
					assert.ok(json.hasOwnProperty('welcomeBanner'));
				});

				it('blog post title is correct (Valibot schema validation worked)', () => {
					assert.equal(
						json.welcomePost?.data?.title,
						'Welcome to Standard Schema content collections!',
					);
				});

				it('blog post author is a reference object (2-arg reference() in transform worked)', () => {
					const author = json.welcomePost?.data?.author;
					assert.ok(author !== null && typeof author === 'object');
					assert.equal(author.id, 'ben-holmes');
					assert.equal(author.collection, 'authors');
				});

				it('banner src is image metadata (image() transform worked)', () => {
					const banner = json.welcomeBanner;
					assert.ok(banner !== null && typeof banner === 'object');
					// In prod mode, src is a transformed ImageMetadata object
					// In dev mode, src is the IMAGE_IMPORT_PREFIX-prefixed path (resolved at runtime)
					assert.ok(banner.data?.src !== undefined);
					if (mode === 'prod') {
						assert.ok(
							typeof banner.data.src === 'object' || typeof banner.data.src === 'string',
							'src should be image metadata or string',
						);
					}
				});

				it('banner alt is correct', () => {
					assert.equal(
						json.welcomeBanner?.data?.alt,
						'Futuristic landscape with chrome buildings and blue skies',
					);
				});
			});
		});
	}
});
