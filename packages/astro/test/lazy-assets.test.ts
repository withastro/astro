import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.ts';
import { type Fixture, loadFixture } from './test-utils.ts';

async function cssFor(fixture: Fixture, html: string) {
	const $ = cheerio.load(html);
	const css = $('style')
		.toArray()
		.map((el) => $(el).text());
	for (const el of $('link[rel="stylesheet"]').toArray()) {
		css.push(await fixture.readFile($(el).attr('href')!));
	}
	return css.join('\n');
}

function assertStyles(css: string, selected: 'one' | 'two') {
	assert.match(css, new RegExp(`\\.${selected}[\\[{]`));
	assert.doesNotMatch(css, new RegExp(`\\.${selected === 'one' ? 'two' : 'one'}[\\[{]`));
	assert.match(css, /\.shared\s*\{/);
	assert.match(css, /body\s*\{/);
	if (selected === 'one') {
		assert.match(css, /\.child[[{]/);
		assert.match(css, /letter-spacing:\s*7\.7px/);
	} else {
		assert.doesNotMatch(css, /\.child[[{]/);
		assert.doesNotMatch(css, /letter-spacing:\s*7\.7px/);
	}
}

describe('experimental.lazyAssets', () => {
	for (const output of ['static', 'server'] as const) {
		it(`includes CSP hashes for inline component styles in ${output} output`, async () => {
			const fixture = await loadFixture({
				root: './fixtures/lazy-assets/',
				outDir: `./dist/csp-${output}/`,
				output,
				adapter: output === 'server' ? testAdapter() : undefined,
				build: { inlineStylesheets: 'always' },
				security: { csp: true },
				experimental: { lazyAssets: true },
			});
			await fixture.build();
			const response =
				output === 'server'
					? await (await fixture.loadTestAdapterApp()).render(new Request('http://example.com/'))
					: new Response(await fixture.readFile('/index.html'));
			const $ = cheerio.load(await response.text());
			const policy =
				response.headers.get('content-security-policy') ??
				$('meta[http-equiv="Content-Security-Policy"]').attr('content');
			assert.ok(policy);
			const styleSources = policy
				.split(';')
				.find((directive) => directive.trim().startsWith('style-src '));
			assert.ok(styleSources);
			assert.ok($('style').length > 0);
			for (const style of $('style').toArray()) {
				const hash = createHash('sha256').update($(style).text()).digest('base64');
				assert.ok(styleSources.includes(`'sha256-${hash}'`), `Missing hash for ${$(style).text()}`);
			}
		});
	}
	for (const [enabled, inlineStylesheets] of [
		[true, 'always'],
		[true, 'never'],
		[false, 'always'],
	] as const) {
		describe(`static, flag ${enabled}, styles ${inlineStylesheets}`, () => {
			let fixture: Fixture;
			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/lazy-assets/',
					outDir: `./dist/static-${enabled}-${inlineStylesheets}/`,
					build: { inlineStylesheets },
					experimental: { lazyAssets: enabled },
				});
				await fixture.build();
			});
			it('includes the expected assets', async () => {
				const html = await fixture.readFile('/index.html');
				const css = await cssFor(fixture, html);
				if (enabled) assertStyles(css, 'one');
				else assert.match(css, /\.two[[{]/);
				const $ = cheerio.load(html);
				assert.equal($('.one').length, 2);
				assert.equal($('script[type="module"]').length, 1);
				const script = $('script[type="module"]').first();
				const code = script.attr('src')
					? await fixture.readFile(script.attr('src')!)
					: script.text();
				assert.match(code, /one-script/);
				assert.doesNotMatch(code, /two-script/);
				if (enabled) {
					assert.equal((css.match(/\.shared\s*\{/g) ?? []).length, 1);
					assert.equal((css.match(/\.one[[{]/g) ?? []).length, 1);
				}
			});
		});
	}
	describe('on-demand', () => {
		let fixture: Fixture;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/lazy-assets/',
				outDir: './dist/server/',
				output: 'server',
				adapter: testAdapter(),
				experimental: { lazyAssets: true },
			});
			await fixture.build();
		});
		it('isolates assets across concurrent and repeated requests', async () => {
			const app = await fixture.loadTestAdapterApp();
			await Promise.all(
				(['one', 'two', 'one', 'two'] as const).map(async (selected) => {
					const response = await app.render(
						new Request(`http://example.com/?component=${selected}`),
					);
					const html = await response.text();
					assertStyles(await cssFor(fixture, html), selected);
				}),
			);
		});
		it('streams before deferred markup resolves and emits its assets', async () => {
			const app = await fixture.loadTestAdapterApp();
			const { promise, resolve } = Promise.withResolvers<void>();
			const response = await app.render(new Request('http://example.com/?stream'), {
				locals: { deferred: promise },
			});
			const reader = response.body!.getReader();
			let html = '';
			try {
				const first = await reader.read();
				html = new TextDecoder().decode(first.value);
				assert.match(html, /Early content/);
				assert.doesNotMatch(html, /class="two/);
				assertStyles(await cssFor(fixture, html), 'one');
			} finally {
				resolve();
			}
			for (;;) {
				const chunk = await reader.read();
				if (chunk.done) break;
				html += new TextDecoder().decode(chunk.value);
			}
			assert.match(await cssFor(fixture, html), /\.two[[{]/);
			assert.match(html, /class="two/);
		});
	});
	describe('dev', () => {
		let fixture: Fixture;
		let server: Awaited<ReturnType<Fixture['startDevServer']>>;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/lazy-assets/',
				output: 'server',
				adapter: testAdapter(),
				experimental: { lazyAssets: true },
			});
			server = await fixture.startDevServer();
		});
		after(() => server?.stop());
		it('collects styles for the selected component', async () => {
			for (const selected of ['one', 'two'] as const) {
				const html = await (await fixture.fetch(`/?component=${selected}`)).text();
				assertStyles(await cssFor(fixture, html), selected);
			}
		});
	});
});
