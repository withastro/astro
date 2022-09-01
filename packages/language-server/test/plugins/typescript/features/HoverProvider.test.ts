import { expect } from 'chai';
import { Hover, Position, Range } from 'vscode-languageserver-types';
import { HoverProviderImpl } from '../../../../src/plugins/typescript/features/HoverProvider';
import { LanguageServiceManager } from '../../../../src/plugins/typescript/LanguageServiceManager';
import { createEnvironment } from '../../../utils';

describe('TypeScript Plugin#HoverProvider', () => {
	function setup(filePath: string) {
		const env = createEnvironment(filePath, 'typescript', 'hoverInfo');
		const languageServiceManager = new LanguageServiceManager(env.docManager, [env.fixturesDir], env.configManager);
		const provider = new HoverProviderImpl(languageServiceManager);

		return {
			...env,
			provider,
		};
	}

	it('provides basic hover info when no docstring exists', async () => {
		const { provider, document } = setup('basic.astro');

		const hoverInfo = await provider.doHover(document, Position.create(1, 10));

		expect(hoverInfo).to.deep.equal(<Hover>{
			contents: '```typescript\nconst MyVariable: "Astro"\n```',
			range: Range.create(1, 7, 1, 17),
		});
	});

	it('provides formatted hover info when a docstring exists', async () => {
		const { provider, document } = setup('basic.astro');

		const hoverInfo = await provider.doHover(document, Position.create(4, 9));

		expect(hoverInfo).to.deep.equal(<Hover>{
			contents: '```typescript\nconst MyDocumentedVariable: "Astro"\n```\n---\nDocumentation',
			range: Range.create(4, 7, 4, 27),
		});
	});

	it('provides formatted hover info for jsDoc tags', async () => {
		const { provider, document } = setup('basic.astro');

		const hoverInfo = await provider.doHover(document, Position.create(7, 10));

		expect(hoverInfo).to.deep.equal(<Hover>{
			contents: '```typescript\nconst MyJSDocVariable: "Astro"\n```\n---\n\n\n*@author* — Astro ',
			range: Range.create(7, 7, 7, 22),
		});
	});

	it('provides hover inside script tags', async () => {
		const { provider, document } = setup('scriptTag.astro');

		const hoverInfo = await provider.doHover(document, Position.create(1, 10));

		expect(hoverInfo).to.deep.equal(<Hover>{
			contents: '```typescript\nconst MyVariable: "Astro"\n```',
			range: Range.create(1, 7, 1, 17),
		});
	});

	it('provides hover info with documentation for Svelte components', async () => {
		const { provider, document } = setup('svelteComment.astro');

		const hoverInfo = await provider.doHover(document, Position.create(4, 3));

		expect(hoverInfo).to.deep.equal(<Hover>{
			contents:
				'```typescript\n(alias) function Sveltecomment(_props: typeof Component.props): any\nimport Sveltecomment\n```\n---\nMy super Svelte component!',
			range: Range.create(4, 1, 4, 14),
		});
	});
});
