import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

// Same contract as the `compile-image-service.test.ts` Sharp-free matrix cells,
// but the custom image service is registered by an INTEGRATION (via
// `updateConfig` in `astro:config:setup`) instead of the top-level
// `image.service` user config. Astro core unshifts the adapter to the front of
// the integrations list, so the adapter's `astro:config:setup` runs before the
// integration; the adapter must resolve the service against the final config
// (`astro:config:done`) or the integration-defined service is invisible to the
// build-time generation pass.
const INTEGRATION_CONFIG = `import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

const imageServiceIntegration = () => ({
	name: 'image-service-integration',
	hooks: {
		'astro:config:setup': ({ updateConfig }) => {
			updateConfig({
				image: {
					service: {
						entrypoint: './src/image-service.ts',
					},
				},
			});
		},
	},
});

export default defineConfig({
	adapter: cloudflare({
		imageService: 'MODE',
	}),
	output: 'static',
	integrations: [imageServiceIntegration()],
});
`;

async function buildFixture(mode: 'compile' | 'custom') {
	const fixture = await loadFixture({
		root: './fixtures/compile-custom-image-service/',
		outDir: `./dist/integration-defined-image-service-${mode}/`,
	});
	const resetConfig = await fixture.editFile(
		'astro.config.mjs',
		() => INTEGRATION_CONFIG.replace("imageService: 'MODE'", `imageService: '${mode}'`),
		false,
	);

	try {
		await fixture.build();
		return {
			fixture,
			html: await fixture.readFile('client/index.html'),
		};
	} finally {
		resetConfig();
	}
}

async function readGeneratedImage(fixture: Fixture, html: string) {
	const src = cheerio.load(html)('img').attr('src');
	assert.match(src ?? '', /^\/_astro\/.+/, 'expected a hashed asset in the markup');
	return (await fixture.readFile(`client${src}`, null)) as unknown as Buffer;
}

describe('Image service defined by an integration', () => {
	for (const mode of ['compile', 'custom'] as const) {
		it(`imageService: '${mode}' - integration-defined service transform() runs at build time and markup is respected`, async () => {
			const { fixture, html } = await buildFixture(mode);
			const img = cheerio.load(html)('img');

			// The integration-defined service should decorate the prerendered markup...
			assert.equal(
				img.attr('data-image-service'),
				'custom',
				'expected integration-defined getHTMLAttributes() to decorate prerendered markup',
			);

			// ...and its transform() should run during build-time asset generation,
			// exactly as it does when the same service is set via `image.service`
			// user config (covered by compile-image-service.test.ts).
			const data = await readGeneratedImage(fixture, html);
			assert.equal(
				Buffer.from(data.subarray(0, 20)).toString('utf8'),
				'CUSTOM_TRANSFORM_RAN',
				'expected integration-defined transform() to have generated the asset',
			);
		});
	}
});
