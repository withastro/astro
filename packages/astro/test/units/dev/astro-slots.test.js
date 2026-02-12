import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createFixture, fetchFromContainer, startContainerFromFixture } from '../test-utils.js';

// Components
const Slotted = `<div id="a"><slot name="a" /></div>
<div id="b"><slot name="b" /></div>
<div id="c"><slot name="c" /></div>
<div id="default"><slot /></div>`;

const SlottedAPI = `{Astro.slots.has("a") && <div id="a"><slot name="a" /></div>}
{Astro.slots.has("b") && <div id="b"><slot name="b" /></div>}
{Astro.slots.has("c") && <div id="c"><slot name="c" /></div>}
{Astro.slots.has("default") && <div id="default"><slot /></div>}`;

const Fallback = `<slot><div id="default"></div></slot>`;

const Fallback2 = `<div id="fallback-2"><slot name="override-2">Fallback should only show when no slot has been provided.</slot></div>`;

const Render = `---
const { id } = Astro.props;
const content = await Astro.slots.render('default');
---
<div id={id} set:html={content} />`;

const RenderFn = `---
const { id } = Astro.props;
const content = await Astro.slots.render('default');
---
<div id={id} set:html={content} />`;

const RenderArgs = `---
const { id, text } = Astro.props;
---
<div id={id} set:html={Astro.slots.render('default', [text])} />`;

const RenderMultipleTimes = `---
const {count} = Astro.props;
const renders = [];
for (let i = 0; i < count; i++) {
    renders.push(await Astro.slots.render('default'));
}
---
{renders.map((render, i) => <Fragment key={i} set:html={render} />)}`;

const Random = `---
const randomNumber = Math.random();
---
<div>{randomNumber}</div>`;

const FunctionsToAPI = `---
const content = 'Test Content';
const beforeContent = await Astro.slots.render("before", [{content}])
const afterContent = await Astro.slots.render("after", [{content}])
---
<div id="before">{beforeContent}</div>
<div id="after">{afterContent}</div>`;

// Build shared fixture tree
const fixtureTree = {
	'/src/components/Slotted.astro': Slotted,
	'/src/components/SlottedAPI.astro': SlottedAPI,
	'/src/components/Fallback.astro': Fallback,
	'/src/components/Fallback2.astro': Fallback2,
	'/src/components/Render.astro': Render,
	'/src/components/RenderFn.astro': RenderFn,
	'/src/components/RenderArgs.astro': RenderArgs,
	'/src/components/RenderMultipleTimes.astro': RenderMultipleTimes,
	'/src/components/Random.astro': Random,
	'/src/components/FunctionsToAPI.astro': FunctionsToAPI,
	'/src/pages/index.astro': `---
import Slotted from '../components/Slotted.astro';
---
<html><head></head><body>
<Slotted>
  <span slot="a">A</span>
  <span slot="b">B</span>
  <span slot="c">C</span>
  <span>Default</span>
</Slotted>
</body></html>`,
	'/src/pages/dynamic.astro': `---
import Slotted from '../components/Slotted.astro';
const slots = ['a', 'b', 'c']
---
<html><head></head><body>
<Slotted>
  <span slot={slots[0]}>A</span>
  <span slot={slots[1]}>B</span>
  <span slot={slots[2]}>C</span>
  <span>Default</span>
</Slotted>
</body></html>`,
	'/src/pages/conditional.astro': `---
import Slotted from '../components/Slotted.astro';
---
<html><head></head><body>
<Slotted>
  {true && <span slot="a">A</span>}
  {true ? <span slot="b">B</span> : null}
  {() => <span slot="c">C</span>}
  {true && <span>Default</span>}
</Slotted>
</body></html>`,
	'/src/pages/fallback.astro': `---
import Fallback from '../components/Fallback.astro';
---
<html><head></head><body><Fallback /></body></html>`,
	'/src/pages/fallback-own.astro': `<html><head></head><body><slot><div id="default"></div></slot></body></html>`,
	'/src/pages/fallback-override.astro': `---
import Fallback from '../components/Fallback.astro';
import Fallback2 from '../components/Fallback2.astro';
---
<html><head></head><body>
<div id="fallback">
  <Fallback><div id="override" /></Fallback>
  <Fallback2><div slot="override-2">Slotty slot.</div></Fallback2>
</div>
</body></html>`,
	'/src/pages/multiple.astro': `---
import Slotted from '../components/Slotted.astro';
---
<html><head></head><body>
<Slotted>
  <span slot="a">A</span>
  <span slot="a">B</span>
  <span slot="a">C</span>
</Slotted>
</body></html>`,
	'/src/pages/component.astro': `---
import Slotted from '../components/Slotted.astro';
const Component = 'astro-component';
---
<html><head></head><body>
<Slotted>
  <Component slot="a">A</Component>
  <Component>Default</Component>
</Slotted>
</body></html>`,
	'/src/pages/slottedapi-default.astro': `---
import Slotted from '../components/Slotted.astro';
---
<html><head></head><body><Slotted /></body></html>`,
	'/src/pages/slottedapi-empty.astro': `---
import Slotted from '../components/SlottedAPI.astro';
---
<html><head></head><body><Slotted /></body></html>`,
	'/src/pages/slottedapi-filled.astro': `---
import Slotted from '../components/SlottedAPI.astro';
---
<html><head></head><body>
<Slotted>
  <span slot="a">A</span>
  <span slot="b">B</span>
  <span slot="c">C</span>
</Slotted>
</body></html>`,
	'/src/pages/slottedapi-default-filled.astro': `---
import Slotted from '../components/SlottedAPI.astro';
---
<html><head></head><body><Slotted>Default</Slotted></body></html>`,
	'/src/pages/slottedapi-render.astro': `---
import Render from '../components/Render.astro';
import RenderArgs from '../components/RenderArgs.astro';
import RenderFn from '../components/RenderFn.astro';
---
<html><head></head><body>
<Render id="render">render</Render>
<RenderFn id="render-fn">{() => "render-fn"}</RenderFn>
<RenderArgs id="render-args" text="render-args">{(text) => <span>{text}</span>}</RenderArgs>
</body></html>`,
	'/src/pages/rendered-multiple-times.astro': `---
import RandomCard from '../components/Random.astro';
import RenderMulti from '../components/RenderMultipleTimes.astro';
---
<RenderMulti count={10}><RandomCard/></RenderMulti>`,
	'/src/pages/slotted-named-functions.astro': `---
import Field from '../components/FunctionsToAPI.astro'
---
<Field>
  <div slot="before">{({content}) => <div>{content} BEFORE</div>}</div>
  <div slot="after">{({content}) => <div>{content} AFTER</div>}</div>
</Field>`,
};

describe('Slots (unit)', () => {
	/** @type {import('fs-fixture').Fixture} */
	let fixture;
	/** @type {import('../../../src/core/dev/container.js').Container} */
	let container;

	before(async () => {
		fixture = await createFixture(fixtureTree);
		container = await startContainerFromFixture({ inlineConfig: { root: fixture.path } });
	});

	after(async () => {
		await container.close();
		await fixture.rm();
	});

	it('Basic named slots work', async () => {
		const { $ } = await fetchFromContainer(container, '/');
		assert.equal($('#a').text().trim(), 'A');
		assert.equal($('#b').text().trim(), 'B');
		assert.equal($('#c').text().trim(), 'C');
		assert.equal($('#default').text().trim(), 'Default');
	});

	it('Dynamic named slots work', async () => {
		const { $ } = await fetchFromContainer(container, '/dynamic');
		assert.equal($('#a').text().trim(), 'A');
		assert.equal($('#b').text().trim(), 'B');
		assert.equal($('#c').text().trim(), 'C');
		assert.equal($('#default').text().trim(), 'Default');
	});

	it('Conditional named slots work', async () => {
		const { $ } = await fetchFromContainer(container, '/conditional');
		assert.equal($('#a').text().trim(), 'A');
		assert.equal($('#b').text().trim(), 'B');
		assert.equal($('#c').text().trim(), 'C');
		assert.equal($('#default').text().trim(), 'Default');
	});

	it('Slots render fallback content by default', async () => {
		const { $ } = await fetchFromContainer(container, '/fallback');
		assert.equal($('#default').length, 1);
	});

	it('Slots of a page render fallback content', async () => {
		const { $ } = await fetchFromContainer(container, '/fallback-own');
		assert.equal($('#default').length, 1);
	});

	it('Slots override fallback content', async () => {
		const { $ } = await fetchFromContainer(container, '/fallback-override');
		assert.equal($('#override').length, 1);
		assert.equal($('#fallback-2').text(), 'Slotty slot.');
	});

	it('Slots work with multiple elements', async () => {
		const { $ } = await fetchFromContainer(container, '/multiple');
		assert.equal($('#a').text().trim(), 'ABC');
	});

	it('Slots work on Components', async () => {
		const { $ } = await fetchFromContainer(container, '/component');
		assert.equal($('#a').length, 1);
		assert.equal($('#a').children('astro-component').length, 1);
		assert.equal($('#default').children('astro-component').length, 1);
	});

	describe('Slots API', () => {
		it('IDs exist whether slots are filled or not', async () => {
			const { $ } = await fetchFromContainer(container, '/slottedapi-default');
			assert.equal($('#a').length, 1);
			assert.equal($('#b').length, 1);
			assert.equal($('#c').length, 1);
			assert.equal($('#default').length, 1);
		});

		it('IDs do not exist because slots are not filled', async () => {
			const { $ } = await fetchFromContainer(container, '/slottedapi-empty');
			assert.equal($('#a').length, 0);
			assert.equal($('#b').length, 0);
			assert.equal($('#c').length, 0);
			assert.equal($('#default').length, 0);
		});

		it('IDs exist because slots are filled', async () => {
			const { $ } = await fetchFromContainer(container, '/slottedapi-filled');
			assert.equal($('#a').length, 1);
			assert.equal($('#b').length, 1);
			assert.equal($('#c').length, 1);
			assert.equal($('#default').length, 0);
		});

		it('Default ID exists because default slot is filled', async () => {
			const { $ } = await fetchFromContainer(container, '/slottedapi-default-filled');
			assert.equal($('#a').length, 0);
			assert.equal($('#b').length, 0);
			assert.equal($('#c').length, 0);
			assert.equal($('#default').length, 1);
		});
	});

	it('Slots.render() API', async () => {
		const { $ } = await fetchFromContainer(container, '/slottedapi-render');
		assert.equal($('#render').length, 1);
		assert.equal($('#render').text(), 'render');
		assert.equal($('#render-fn').length, 1);
		assert.equal($('#render-fn').text(), 'render-fn');
		assert.equal($('#render-args').length, 1);
		assert.equal($('#render-args span').length, 1);
		assert.equal($('#render-args').text(), 'render-args');
	});

	it('Rendered multiple times produces unique content', async () => {
		const { $ } = await fetchFromContainer(container, '/rendered-multiple-times');
		const elements = $('div');
		assert.equal(elements.length, 10);
		const [first, second, third] = elements;
		assert.notEqual(first.children[0].data, second.children[0].data);
		assert.notEqual(second.children[0].data, third.children[0].data);
	});

	it('Arguments can be passed to named slots with Astro.slots.render()', async () => {
		const { $ } = await fetchFromContainer(container, '/slotted-named-functions');
		const beforeDiv = $('div#before');
		const [beforeChildren] = beforeDiv.children('div');
		assert.deepEqual(beforeChildren.firstChild.data, 'Test Content BEFORE');
		const afterDiv = $('div#after');
		const [afterChildren] = afterDiv.children('div');
		assert.deepEqual(afterChildren.firstChild.data, 'Test Content AFTER');
	});
});
