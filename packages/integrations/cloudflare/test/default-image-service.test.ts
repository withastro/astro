import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import cloudflare from '../dist/index.js';
import { type Fixture, loadFixture, type PreviewServer } from './test-utils.ts';

function srcs($: cheerio.CheerioAPI, selector: string) {
	return $(selector)
		.map((_, el) => $(el).attr('srcset') ?? $(el).attr('src'))
		.get()
		.flatMap((value) => value.split(',').map((part) => part.trim().split(/\s+/)[0]));
}

function assertWebp(data: Buffer) {
	assert.equal(data.subarray(0, 4).toString('utf8'), 'RIFF');
	assert.equal(data.subarray(8, 12).toString('utf8'), 'WEBP');
}

for (const { name, output, imageService } of [
	{ name: 'default with static output', output: 'static', imageService: undefined },
	{ name: 'default with inferred static output', output: undefined, imageService: undefined },
	{
		name: 'cloudflare-binding shorthand with static output',
		output: 'static',
		imageService: 'cloudflare-binding',
	},
] as const) {
	describe(name, () => {
		let fixture: Fixture;
		let html: string;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/default-image-service-static/',
				outDir: `./dist/${output ?? 'inferred'}-${imageService ?? 'default'}/`,
				output,
				adapter: cloudflare({ imageService }),
			});
			await fixture.build();
			html = await fixture.readFile('client/index.html');
		});

		it('does not emit /_image URLs', () => {
			assert.doesNotMatch(html, /\/_image\?/);
		});

		it('points every image at a hashed build asset', () => {
			const found = srcs(cheerio.load(html), 'img, source');
			assert.ok(
				found.length >= 6,
				`expected Image, Picture and getImage output, got ${found.length}`,
			);
			for (const src of found) {
				assert.match(src, /^\/_astro\/penguin\.[\w-]+\.\w+$/, `unexpected src: ${src}`);
			}
		});

		it('writes every referenced asset into the client directory', async () => {
			for (const src of new Set(srcs(cheerio.load(html), 'img, source'))) {
				const data = (await fixture.readFile(`client${src}`, null)) as unknown as Buffer;
				assert.ok(data.byteLength > 0, `empty asset written for ${src}`);
			}
		});

		it('does not build worker', async () => {
			assert.deepEqual(await fixture.glob('server/**/*.mjs').catch(() => []), []);
		});

		it('honors the format each component asked for', async () => {
			const $ = cheerio.load(html);

			const image = $('#image').attr('src')!;
			assert.match(image, /\.webp$/);
			assertWebp((await fixture.readFile(`client${image}`, null)) as unknown as Buffer);

			const sources = srcs($, '#picture').concat(srcs($, 'source'));
			assert.ok(sources.length >= 4, `expected two widths per format, got ${sources.length}`);
			assert.ok(
				sources.some((src) => src.endsWith('.avif')),
				'Picture formats={["avif"]} produced no avif source',
			);

			assert.match($('#get-image').attr('src')!, /\.avif$/);
		});
	});
}

for (const output of ['server', undefined] as const) {
	describe(`default imageService with ${output ?? 'inferred server'} output`, () => {
		let fixture: Fixture;
		let previewServer: PreviewServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/default-image-service-server/',
				outDir: `./dist/${output ?? 'inferred'}/`,
				output,
			});
			await fixture.build();
			previewServer = await fixture.preview();
		});

		after(async () => {
			await previewServer.stop();
		});

		it('transforms images on prerendered routes into build assets', async () => {
			const html = await fixture.readFile('client/prerendered/index.html');
			const src = cheerio.load(html)('#image').attr('src')!;
			assert.match(src, /^\/_astro\/penguin\.[\w-]+\.webp$/);
			assert.doesNotMatch(html, /\/_image\?/);
			const data = (await fixture.readFile(`client${src}`, null)) as unknown as Buffer;
			assert.ok(data.byteLength > 0);
		});

		it('routes images on on-demand routes through /_image', async () => {
			const html = await fixture.fetch('/on-demand').then((res) => res.text());
			assert.match(cheerio.load(html)('#image').attr('src')!, /^\/_image\?/);
		});

		it('serves /_image requests through the Images binding', async () => {
			const html = await fixture.fetch('/on-demand').then((res) => res.text());
			const src = cheerio.load(html)('#image').attr('src')!;
			const res = await fixture.fetch(src);
			assert.equal(res.status, 200);
			assert.equal(res.headers.get('content-type'), 'image/webp');
		});

		it('provisions the Images binding', async () => {
			const wrangler = JSON.parse(await fixture.readFile('server/wrangler.json'));
			assert.deepEqual(wrangler.images, { binding: 'IMAGES' });
		});

		it('keeps Sharp out of the worker bundle', async () => {
			const files = await fixture.glob('server/**/*.mjs');
			const bundle = (await Promise.all(files.map((file) => fixture.readFile(file)))).join('\n');
			assert.doesNotMatch(bundle, /import\("sharp"\)/);
			assert.doesNotMatch(bundle, /assets\/services\/sharp/);
		});
	});
}
