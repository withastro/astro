import { renderMarkdown } from '../dist/index.js';
import chai from 'chai';

describe('strictness', () => {
	it('should allow self-closing HTML tags (void elements)', async () => {
		const { code } = await renderMarkdown(
			`Use self-closing void elements<br>like word<wbr>break and images: <img src="hi.jpg">`,
			{}
		);

		chai
			.expect(code)
			.to.equal(
				`<p>Use self-closing void elements<br />like word<wbr />break and images: ` +
					`<img src="hi.jpg" /></p>`
			);
	});

	it('should allow attribute names starting with ":" after element names', async () => {
		const { code } = await renderMarkdown(`<div :class="open ? '' : 'hidden'">Test</div>`, {});

		chai.expect(code.trim()).to.equal(`<div :class="open ? '' : 'hidden'">Test</div>`);
	});

	it('should allow attribute names starting with ":" after local element names', async () => {
		const { code } = await renderMarkdown(`<div.abc :class="open ? '' : 'hidden'">x</div.abc>`, {});

		chai.expect(code.trim()).to.equal(`<div.abc :class="open ? '' : 'hidden'">x</div.abc>`);
	});

	it('should allow attribute names starting with ":" after attribute names', async () => {
		const { code } = await renderMarkdown(`<input type="text" disabled :placeholder="hi">`, {});

		chai.expect(code.trim()).to.equal(`<input type="text" disabled :placeholder="hi" />`);
	});

	it('should allow attribute names starting with ":" after local attribute names', async () => {
		const { code } = await renderMarkdown(
			`<input type="text" x-test:disabled :placeholder="hi">`,
			{}
		);

		chai.expect(code.trim()).to.equal(`<input type="text" x-test:disabled :placeholder="hi" />`);
	});

	it('should allow attribute names starting with ":" after attribute values', async () => {
		const { code } = await renderMarkdown(`<input type="text" :placeholder="placeholder">`, {});

		chai.expect(code.trim()).to.equal(`<input type="text" :placeholder="placeholder" />`);
	});

	it('should allow attribute names starting with "@" after element names', async () => {
		const { code } = await renderMarkdown(`<button @click="handleClick">Test</button>`, {});

		chai.expect(code.trim()).to.equal(`<button @click="handleClick">Test</button>`);
	});

	it('should allow attribute names starting with "@" after local element names', async () => {
		const { code } = await renderMarkdown(
			`<button.local @click="handleClick">Test</button.local>`,
			{}
		);

		chai.expect(code.trim()).to.equal(`<button.local @click="handleClick">Test</button.local>`);
	});

	it('should allow attribute names starting with "@" after attribute names', async () => {
		const { code } = await renderMarkdown(
			`<button disabled @click="handleClick">Test</button>`,
			{}
		);

		chai.expect(code.trim()).to.equal(`<button disabled @click="handleClick">Test</button>`);
	});

	it('should allow attribute names starting with "@" after local attribute names', async () => {
		const { code } = await renderMarkdown(
			`<button x-test:disabled @click="handleClick">Test</button>`,
			{}
		);

		chai.expect(code.trim()).to.equal(`<button x-test:disabled @click="handleClick">Test</button>`);
	});

	it('should allow attribute names starting with "@" after attribute values', async () => {
		const { code } = await renderMarkdown(
			`<button type="submit" @click="handleClick">Test</button>`,
			{}
		);

		chai.expect(code.trim()).to.equal(`<button type="submit" @click="handleClick">Test</button>`);
	});

	it('should allow attribute names containing dots', async () => {
		const { code } = await renderMarkdown(`<input x-on:input.debounce.500ms="fetchResults">`, {});

		chai.expect(code.trim()).to.equal(`<input x-on:input.debounce.500ms="fetchResults" />`);
	});
});
