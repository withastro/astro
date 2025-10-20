import { Position } from '@volar/language-server';
import { expect } from 'chai';
import { describe } from 'mocha';
import type { LanguageServer } from '../server.js';
import { getLanguageServer } from '../server.js';

describe('CSS - Completions', () => {
	let languageServer: LanguageServer;

	before(async () => (languageServer = await getLanguageServer()));

	it('Can provide completions for CSS properties', async () => {
		const document = await languageServer.openFakeDocument(`<style>.foo { colo }</style>`, 'astro');
		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(0, 18),
		);

		expect(completions!.items).to.not.be.empty;
	});

	it('Can provide completions for CSS values', async () => {
		const document = await languageServer.openFakeDocument(
			`<style>.foo { color: re }</style>`,
			'astro',
		);
		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(0, 21),
		);

		expect(completions!.items).to.not.be.empty;
	});

	it('Can provide completions inside inline styles', async () => {
		const document = await languageServer.openFakeDocument(`<div style="color: ;"></div>`, 'astro');
		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(0, 18),
		);

		expect(completions!.items).to.not.be.empty;
		expect(completions?.items.map((i) => i.label)).to.include('aliceblue');
	});

	it('Can provide completions inside inline styles with multi-bytes characters in the file', async () => {
		const document = await languageServer.openFakeDocument(
			`<div>あ</div><div style="color: ;"></div>`,
			'astro',
		);
		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(0, 30),
		);

		expect(completions!.items).to.not.be.empty;
		expect(completions?.items.map((i) => i.label)).to.include('aliceblue');
	});

	it('Can provide completions inside SCSS blocks', async () => {
		const document = await languageServer.openFakeDocument(
			`<style lang="scss">
  $c: red;
	.foo {
		color: $
	}
</style>
`,
			'astro',
		);
		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(3, 10),
		);

		const allLabels = completions?.items.map((i) => i.label);

		expect(completions!.items).to.not.be.empty;
		expect(allLabels).to.include('$c');
	});

	it('Can provide completions inside LESS blocks', async () => {
		const document = await languageServer.openFakeDocument(
			`<style lang="less">
	@link-color: #428bca;
	h1 {
		color: @
	}
</style>
`,
			'astro',
		);
		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(3, 10),
		);

		const allLabels = completions?.items.map((i) => i.label);
		expect(completions!.items).to.not.be.empty;
		expect(allLabels).to.include('@link-color');
	});
});
