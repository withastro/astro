import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';
import { createFs, createRequestAndResponse, runInContainer } from '../test-utils.js';

const root = new URL('../../fixtures/alias/', import.meta.url);

describe('core/render components', () => {
	it('should sanitize dynamic tags', async () => {
		const fs = createFs(
			{
				'/src/pages/index.astro': `
				---
				const TagA = 'p style=color:red;'
				const TagB = 'p><script id="pwnd">console.log("pwnd")</script>'
				---
				<html>
					<head><title>testing</title></head>
					<body>
						<TagA id="target" />
						<TagB />
					</body>
				</html>
			`,
			},
			root
		);

		await runInContainer(
			{
				fs,
				inlineConfig: {
					root: fileURLToPath(root),
					logLevel: 'silent',
					integrations: [],
				},
			},
			async (container) => {
				const { req, res, done, text } = createRequestAndResponse({
					method: 'GET',
					url: '/',
				});
				container.handle(req, res);

				await done;
				const html = await text();
				const $ = cheerio.load(html);
				const target = $('#target');

				expect(target).not.to.be.undefined;
				expect(target.attr('id')).to.equal('target');
				expect(target.attr('style')).to.be.undefined;

				expect($('#pwnd').length).to.equal(0);
			}
		);
	});

	it('should merge `class` and `class:list`', async () => {
		const fs = createFs(
			{
				'/src/pages/index.astro': `
				---
				import Class from '../components/Class.astro';
				import ClassList from '../components/ClassList.astro';
				import BothLiteral from '../components/BothLiteral.astro';
				import BothFlipped from '../components/BothFlipped.astro';
				import BothSpread from '../components/BothSpread.astro';
				---
				<Class class="red blue" />
				<ClassList class:list={{ red: true, blue: true }} />
				<BothLiteral class="red" class:list={{ blue: true }} />
				<BothFlipped class:list={{ blue: true }} class="red" />
				<BothSpread class:list={{ blue: true }} { ...{ class: "red" }} />
			`,
				'/src/components/Class.astro': `<pre id="class" set:html={JSON.stringify(Astro.props)} />`,
				'/src/components/ClassList.astro': `<pre id="class-list" set:html={JSON.stringify(Astro.props)} />`,
				'/src/components/BothLiteral.astro': `<pre id="both-literal" set:html={JSON.stringify(Astro.props)} />`,
				'/src/components/BothFlipped.astro': `<pre id="both-flipped" set:html={JSON.stringify(Astro.props)} />`,
				'/src/components/BothSpread.astro': `<pre id="both-spread" set:html={JSON.stringify(Astro.props)} />`,
			},
			root
		);

		await runInContainer(
			{
				fs,
				inlineConfig: {
					root: fileURLToPath(root),
					logLevel: 'silent',
					integrations: [],
				},
			},
			async (container) => {
				const { req, res, done, text } = createRequestAndResponse({
					method: 'GET',
					url: '/',
				});
				container.handle(req, res);

				await done;
				const html = await text();
				const $ = cheerio.load(html);

				const check = (name) => JSON.parse($(name).text() || '{}')

				const Class = check('#class');
				const ClassList = check('#class-list');
				const BothLiteral = check('#both-literal');
				const BothFlipped = check('#both-flipped');
				const BothSpread = check('#both-spread');
				
				expect(Class).to.deep.equal({ class: 'red blue' }, '#class');
				expect(ClassList).to.deep.equal({ class: 'red blue' }, '#class-list');
				expect(BothLiteral).to.deep.equal({ class: 'red blue' }, '#both-literal');
				expect(BothFlipped).to.deep.equal({ class: 'red blue' }, '#both-flipped');
				expect(BothSpread).to.deep.equal({ class: 'red blue' }, '#both-spread');
			}
		);
	});
});
