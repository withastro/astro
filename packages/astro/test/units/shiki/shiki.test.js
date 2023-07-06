import { expect } from 'chai';
import { createContainer } from '../../../dist/core/dev/index.js';
import { createViteLoader } from '../../../dist/core/module-loader/index.js';

const root = new URL('../../fixtures/alias/', import.meta.url);

describe('<Code />', () => {
	describe('Shiki - getHighlighterOptions', () => {
		let container;
		let mod;
		before(async () => {
			container = await createContainer({ root });
			const loader = createViteLoader(container.viteServer);
			mod = await loader.import('astro/components/Shiki.js');
		});

		after(async () => {
			await container.close();
		});

		it('uses the bundles themes for built-in themes', async () => {
			const { resolveHighlighterOptions } = mod;
			// NOTE: pass empty `langs` to prevent Shiki from loading all langs by default, which slows down the test
			const opts = await resolveHighlighterOptions({ theme: 'css-variables', langs: [] });
			const themes = opts.themes;

			expect(themes).to.have.a.lengthOf(1);
			expect(themes[0]).to.be.an('object');
		});

		it('uses the string theme name for custom themes', async () => {
			const { resolveHighlighterOptions } = mod;
			// NOTE: pass empty `langs` to prevent Shiki from loading all langs by default, which slows down the test
			const opts = await resolveHighlighterOptions({ theme: 'some-custom-theme', langs: [] });
			const themes = opts.themes;

			expect(themes).to.have.a.lengthOf(1);
			expect(themes[0]).to.be.an('string');
			expect(themes[0]).to.equal('some-custom-theme');
		});
	});
});
