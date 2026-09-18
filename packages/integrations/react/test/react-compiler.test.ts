import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { PluginObj } from '@babel/core';
import babel from '@rolldown/plugin-babel';
import { load } from 'cheerio';
import react from '../dist/index.js';
import { loadFixture, type DevServer, type Fixture } from './test-utils.ts';

const babelOptions = {
	plugins: [
		(): PluginObj => ({
			visitor: {
				TSAsExpression(path) {
					const expression = path.node.expression;
					if (expression.type === 'StringLiteral' && expression.value === 'before-babel') {
						expression.value = 'after-babel';
					}
				},
			},
		}),
	],
};

for (const enabled of [true, false]) {
	describe(`React compiler (${enabled ? 'enabled' : 'disabled'})`, () => {
		let fixture: Fixture;
		let server: DevServer;
		before(async () => {
			fixture = await loadFixture({
				root: new URL(`./fixtures/react-compiler${enabled ? '' : '-disabled'}/`, import.meta.url),
				integrations: [react({ compiler: enabled })],
				vite: { plugins: [babel(babelOptions)] },
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
				const response = await fixture.fetch('/src/components/Counter.tsx');
				assert.equal(response.status, 200);
				const code = await response.text();
				assert.equal(/react[-_]compiler[-_]runtime/.test(code), enabled);
				assert.match(code, /after-babel/);
			});
			it('preserves server rendering', async () => {
				const response = await fixture.fetch('/');
				assert.equal(response.status, 200);
				const $ = load(await response.text());
				assert.equal($('button').text(), 'Count: 0');
				assert.equal($('button').attr('data-babel'), 'after-babel');
			});
		});
		describe('build', () => {
			before(async () => {
				await fixture.build();
			});
			it('renders the island and emits a compiled client bundle only when enabled', async () => {
				const $ = load(await fixture.readFile('/index.html'));
				assert.equal($('button').text(), 'Count: 0');
				assert.equal($('button').attr('data-babel'), 'after-babel');
				const component = $('astro-island').attr('component-url');
				assert.ok(component);
				const code = await fixture.readFile(component);
				assert.equal(code.includes('react.memo_cache_sentinel'), enabled);
				assert.match(code, /after-babel/);
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
