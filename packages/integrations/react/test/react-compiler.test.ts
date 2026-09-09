import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { load } from 'cheerio';
import react from '../dist/index.js';
import { loadFixture, type DevServer, type Fixture } from './test-utils.ts';

for (const enabled of [true, false]) {
	describe(`React compiler (${enabled ? 'enabled' : 'disabled'})`, () => {
		let fixture: Fixture;
		let server: DevServer;
		before(async () => {
			fixture = await loadFixture({
				root: new URL(`./fixtures/react-compiler${enabled ? '' : '-disabled'}/`, import.meta.url),
				integrations: [react({ compiler: enabled })],
			});
		});
		describe('dev', () => {
			before(async () => {
				server = await fixture.startDevServer();
			});
			after(async () => {
				await server.stop();
			});
			it('compiles client components only when enabled', async () => {
				const response = await fixture.fetch('/src/components/Counter.jsx');
				assert.equal(response.status, 200);
				const code = await response.text();
				assert.equal(/react[-_]compiler[-_]runtime/.test(code), enabled);
			});
			it('preserves server rendering', async () => {
				const response = await fixture.fetch('/');
				assert.equal(response.status, 200);
				assert.equal(load(await response.text())('button').text(), 'Count: 0');
			});
		});
		describe('build', () => {
			before(async () => {
				await fixture.build();
			});
			it('renders the island and emits a compiled client bundle only when enabled', async () => {
				const $ = load(await fixture.readFile('/index.html'));
				assert.equal($('button').text(), 'Count: 0');
				const component = $('astro-island').attr('component-url');
				assert.ok(component);
				const code = await fixture.readFile(component);
				assert.equal(code.includes('react.memo_cache_sentinel'), enabled);
			});
		});
	});
}

describe('React integration migration', () => {
	it('reports how to migrate the removed babel option', () => {
		assert.throws(
			() => Reflect.apply(react, undefined, [{ babel: {} }]),
			/@rolldown\/plugin-babel in vite\.plugins/,
		);
	});
});
