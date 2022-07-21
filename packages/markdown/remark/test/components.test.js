import { renderMarkdown } from '../dist/index.js';
import chai from 'chai';

describe('components', () => {
	const renderAstroMd = (text) => renderMarkdown(text, { isAstroFlavoredMd: true });

	it('should be able to serialize string', async () => {
		const { code } = await renderAstroMd(`<Component str="cool!" />`);

		chai.expect(code).to.equal(`<Component str="cool!" />`);
	});

	it('should be able to serialize boolean attribute', async () => {
		const { code } = await renderAstroMd(`<Component bool={true} />`);

		chai.expect(code).to.equal(`<Component bool={true} />`);
	});

	it('should be able to serialize array', async () => {
		const { code } = await renderAstroMd(`<Component prop={["a", "b", "c"]} />`);

		chai.expect(code).to.equal(`<Component prop={["a", "b", "c"]} />`);
	});

	it('should be able to serialize object', async () => {
		const { code } = await renderAstroMd(`<Component prop={{ a: 0, b: 1, c: 2 }} />`);

		chai.expect(code).to.equal(`<Component prop={{ a: 0, b: 1, c: 2 }} />`);
	});

	it('should be able to serialize empty attribute', async () => {
		const { code } = await renderAstroMd(`<Component empty />`);

		chai.expect(code).to.equal(`<Component empty />`);
	});

	// Notable omission: shorthand attribute

	it('should be able to serialize spread attribute', async () => {
		const { code } = await renderAstroMd(`<Component {...spread} />`);

		chai.expect(code).to.equal(`<Component {...spread} />`);
	});

	it('should allow client:* directives', async () => {
		const { code } = await renderAstroMd(`<Component client:load />`);

		chai.expect(code).to.equal(`<Component client:load />`);
	});

	it('should normalize children', async () => {
		const { code } = await renderAstroMd(`<Component bool={true}>Hello world!</Component>`);

		chai.expect(code).to.equal(`<Component bool={true}>Hello world!</Component>`);
	});

	it('should be able to nest components', async () => {
		const { code } = await renderAstroMd(
			`<Component bool={true}><Component>Hello world!</Component></Component>`,
			{}
		);

		chai
			.expect(code)
			.to.equal(`<Component bool={true}><Component>Hello world!</Component></Component>`);
	});

	it('should allow markdown without many spaces', async () => {
		const { code } = await renderAstroMd(
			`<Component>
# Hello world!
</Component>`,
			{}
		);

		chai.expect(code).to.equal(`<Component><h1 id="hello-world">Hello world!</h1></Component>`);
	});
});
