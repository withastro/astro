import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { load } from 'cheerio';
import react from '../dist/index.js';
import { withCompilerCheck } from '../dist/compiler.js';
import { loadFixture, type DevServer, type Fixture } from './test-utils.ts';

const babelOptions = {
	plugins: [
		() => ({
			visitor: {
				StringLiteral(path: { node: { value: string } }) {
					if (path.node.value === 'before-babel') path.node.value = 'after-babel';
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
				integrations: [
					react({ compiler: enabled, babel: enabled ? () => babelOptions : babelOptions }),
				],
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
			});
		});
	});
}

describe('React Compiler conflicts', () => {
	it('rejects the Babel compiler in plugin lists and overrides', () => {
		assert.throws(
			() => withCompilerCheck({ plugins: ['babel-plugin-react-compiler'] }),
			/Enable only one React Compiler/,
		);
		assert.throws(
			() => withCompilerCheck({ overrides: [{ plugins: [['babel-plugin-react-compiler', {}]] }] }),
			/Enable only one React Compiler/,
		);
	});
	it('checks Babel callbacks and preserves their arguments', () => {
		const checked = withCompilerCheck((id, options) => {
			assert.equal(id, '/src/Counter.jsx');
			assert.equal(options.ssr, false);
			return { plugins: ['babel-plugin-react-compiler'] };
		});
		assert.ok(typeof checked === 'function');
		assert.throws(
			() => checked('/src/Counter.jsx', { ssr: false }),
			/Enable only one React Compiler/,
		);
	});
	it('allows a Babel compiler callback confined to SSR', () => {
		const checked = withCompilerCheck(() => ({ plugins: ['babel-plugin-react-compiler'] }));
		assert.ok(typeof checked === 'function');
		assert.doesNotThrow(() => checked('/src/Counter.jsx', { ssr: true }));
	});
	it('allows disabled Babel compiler entries', () => {
		assert.doesNotThrow(() =>
			withCompilerCheck({ plugins: [['babel-plugin-react-compiler', false]] }),
		);
	});
});
