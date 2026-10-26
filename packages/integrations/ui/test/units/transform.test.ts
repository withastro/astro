import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { transformAstro } from '../../dist/transform.js';

describe('transformAstro', () => {
	it('leaves components without signals or scoped scripts alone', async () => {
		const source = `<p>Hello</p>`;
		assert.equal(await transformAstro(source, 'src/components/A.astro'), source);
	});

	it('wraps bare expressions and HTML attributes with binding helpers', async () => {
		const out = await transformAstro(
			`---\nconst count = 1;\n---\n<input value={count} /><p>{count} {a.b} {fn()}</p>`,
			'src/components/A.astro',
		);
		assert.match(out, /import \* as __ui from '@astrojs\/ui\/server';/);
		assert.match(out, /value=\{__ui\.val\(count\)\} data-ui-a-value=\{__ui\.bind\(count\)\}/);
		assert.match(out, /\{__ui\.text\(count\)\} \{__ui\.text\(a\.b\)\} \{fn\(\)\}/);
	});

	it('passes attributes on components and directives through untouched', async () => {
		const out = await transformAstro(
			`<Counter count={count} /><div class:list={x} set:html={y} onclick={z}></div>`,
			'src/components/A.astro',
		);
		assert.match(out, /<Counter count=\{count\} \/>/);
		assert.match(out, /class:list=\{x\} set:html=\{y\} onclick=\{z\}/);
	});

	it('binds expressions inside markup returned from expressions', async () => {
		const out = await transformAstro(
			`<ul>{items.map((item) => <li title={item.title}>{item.name}</li>)}</ul>`,
			'src/components/A.astro',
		);
		assert.match(out, /title=\{__ui\.val\(item\.title\)\}/);
		assert.match(out, /\{__ui\.text\(item\.name\)\}/);
	});

	it('turns <script scoped> into a registered script with hoisted imports', async () => {
		const out = await transformAstro(
			`<button>+</button>\n<script scoped>\nimport { signal } from '@astrojs/ui';\nscope('button');\n</script>`,
			'src/components/Counter.astro',
		);
		assert.doesNotMatch(out, /scoped/);
		assert.match(
			out,
			/import \{ __register \} from '@astrojs\/ui\/client';\nimport \{ signal \} from '@astrojs\/ui';/,
		);
		assert.match(
			out,
			/__register\("[0-9a-f]{8}", "Counter", \(scope\) => \{\n\nscope\('button'\);\n\}\);/,
		);
	});

	it('marks the instance and its slots for components with a scoped script', async () => {
		const out = await transformAstro(
			`---\nconst a = 1;\n---\n<div><slot /></div>\n<script scoped>scope('div');</script>`,
			'src/components/Card.astro',
		);
		const cid = /ui:i ([0-9a-f]{8})/.exec(out)![1];
		assert.ok(out.indexOf(`<!--ui:i ${cid}-->`) > out.lastIndexOf('---'));
		assert.match(
			out,
			/<div><Fragment set:html="<!--ui:s-->" \/><slot \/><Fragment set:html="<!--\/ui:s-->" \/><\/div>/,
		);
		assert.ok(out.trimEnd().endsWith(`<Fragment set:html="<!--/ui:i-->" />`));
	});

	it('does not add instance markers to pages', async () => {
		const out = await transformAstro(
			`<html><body><button>x</button><script scoped>scope('button');</script></body></html>`,
			'src/pages/index.astro',
		);
		assert.doesNotMatch(out, /ui:i/);
		assert.match(out, /__register\(null, "index"/);
	});
});
