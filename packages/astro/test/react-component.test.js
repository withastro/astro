import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { isWindows, loadFixture, silentLogging } from './test-utils.js';

let fixture;

describe('React Components', () => {
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/react-component/',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('Can load React', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerioLoad(html);

			// test 1: basic component renders
			expect($('#react-static').text()).to.equal('Hello static!');

			// test 2: no reactroot
			expect($('#react-static').attr('data-reactroot')).to.equal(undefined);

			// test 3: Can use function components
			expect($('#arrow-fn-component')).to.have.lengthOf(1);

			// test 4: Can use spread for components
			expect($('#component-spread-props')).to.have.lengthOf(1);

			// test 5: spread props renders
			expect($('#component-spread-props').text(), 'Hello world!');

			// test 6: Can use TS components
			expect($('.ts-component')).to.have.lengthOf(1);

			// test 7: Can use Pure components
			expect($('#pure')).to.have.lengthOf(1);

			// test 8: Check number of islands
			expect($('astro-island[uid]')).to.have.lengthOf(9);

			// test 9: Check island deduplication
			const uniqueRootUIDs = new Set($('astro-island').map((i, el) => $(el).attr('uid')));
			expect(uniqueRootUIDs.size).to.equal(8);

			// test 10: Should properly render children passed as props
			const islandsWithChildren = $('.with-children');
			expect(islandsWithChildren).to.have.lengthOf(2);
			expect($(islandsWithChildren[0]).html()).to.equal($(islandsWithChildren[1]).html());

			// test 11: Should generate unique React.useId per island
			const islandsWithId = $('.react-use-id');
			expect(islandsWithId).to.have.lengthOf(2);
			expect($(islandsWithId[0]).attr('id')).to.not.equal($(islandsWithId[1]).attr('id'))
		});

		it('Can load Vue', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerioLoad(html);
			expect($('#vue-h2').text()).to.equal('Hasta la vista, baby');
		});

		it('Can use a pragma comment', async () => {
			const html = await fixture.readFile('/pragma-comment/index.html');
			const $ = cheerioLoad(html);

			// test 1: rendered the PragmaComment component
			expect($('.pragma-comment')).to.have.lengthOf(2);
		});

		// TODO: is this still a relevant test?
		it.skip('Includes reactroot on hydrating components', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerioLoad(html);

			const div = $('#research');

			// test 1: has the hydration attr
			expect(div.attr('data-reactroot')).to.be.ok;

			// test 2: renders correctly
			expect(div.html()).to.equal('foo bar <!-- -->1');
		});

		it('Can load Suspense-using components', async () => {
			const html = await fixture.readFile('/suspense/index.html');
			const $ = cheerioLoad(html);
			expect($('#client #lazy')).to.have.lengthOf(1);
			expect($('#server #lazy')).to.have.lengthOf(1);
		});

		it('Can pass through props with cloneElement', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerioLoad(html);
			expect($('#cloned').text()).to.equal('Cloned With Props');
		});
	});

	if (isWindows) return;

	describe('dev', () => {
		/** @type {import('./test-utils').Fixture} */
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer({
				logging: silentLogging,
			});
		});

		after(async () => {
			await devServer.stop();
		});

		it('scripts proxy correctly', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerioLoad(html);

			for (const script of $('script').toArray()) {
				const { src } = script.attribs;
				if (!src) continue;
				expect((await fixture.fetch(src)).status, `404: ${src}`).to.equal(200);
			}
		});

		// TODO: move this to separate dev test?
		it.skip('Throws helpful error message on window SSR', async () => {
			const html = await fixture.fetch('/window/index.html');
			expect(html).to.include(
				`[/window]
    The window object is not available during server-side rendering (SSR).
    Try using \`import.meta.env.SSR\` to write SSR-friendly code.
    https://docs.astro.build/reference/api-reference/#importmeta`
			);
		});

		// In moving over to Vite, the jsx-runtime import is now obscured. TODO: update the method of finding this.
		it.skip('uses the new JSX transform', async () => {
			const html = await fixture.fetch('/index.html');

			// Grab the imports
			const exp = /import\("(.+?)"\)/g;
			let match, componentUrl;
			while ((match = exp.exec(html))) {
				if (match[1].includes('Research.js')) {
					componentUrl = match[1];
					break;
				}
			}
			const component = await fixture.readFile(componentUrl);
			const jsxRuntime = component.imports.filter((i) => i.specifier.includes('jsx-runtime'));

			// test 1: react/jsx-runtime is used for the component
			expect(jsxRuntime).to.be.ok;
		});

		it('When a nested component throws it does not crash the server', async () => {
			const res = await fixture.fetch('/error-rendering');
			await res.arrayBuffer();
		});
	});
});
