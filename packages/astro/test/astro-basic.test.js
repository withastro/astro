import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Astro basics', () => {
	let fixture;
	let previewServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-basic/',
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	// important: close preview server (free up port and connection)
	after(async () => {
		await previewServer.stop();
	});

	describe('build', () => {
		it('Can load page', async () => {
			const html = await fixture.readFile(`/index.html`);
			const $ = cheerio.load(html);

			expect($('h1').text()).to.equal('Hello world!');
		});

		it('Correctly serializes boolean attributes', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			expect($('h1').attr('data-something')).to.equal('');
			expect($('h2').attr('not-data-ok')).to.equal('');
		});

		it('Selector with an empty body', async () => {
			const html = await fixture.readFile('/empty-class/index.html');
			const $ = cheerio.load(html);

			expect($('.author')).to.have.lengthOf(1);
		});

		it('Allows forward-slashes in mustache tags (#407)', async () => {
			const html = await fixture.readFile('/forward-slash/index.html');
			const $ = cheerio.load(html);

			expect($('a[href="/post/one"]')).to.have.lengthOf(1);
			expect($('a[href="/post/two"]')).to.have.lengthOf(1);
			expect($('a[href="/post/three"]')).to.have.lengthOf(1);
		});

		it('Allows spread attributes (#521)', async () => {
			const html = await fixture.readFile('/spread/index.html');
			const $ = cheerio.load(html);

			expect($('#spread-leading')).to.have.lengthOf(1);
			expect($('#spread-leading').attr('a')).to.equal('0');
			expect($('#spread-leading').attr('b')).to.equal('1');
			expect($('#spread-leading').attr('c')).to.equal('2');

			expect($('#spread-trailing')).to.have.lengthOf(1);
			expect($('#spread-trailing').attr('a')).to.equal('0');
			expect($('#spread-trailing').attr('b')).to.equal('1');
			expect($('#spread-trailing').attr('c')).to.equal('2');
		});

		it('Allows spread attributes with TypeScript (#521)', async () => {
			const html = await fixture.readFile('/spread/index.html');
			const $ = cheerio.load(html);

			expect($('#spread-ts')).to.have.lengthOf(1);
			expect($('#spread-ts').attr('a')).to.equal('0');
			expect($('#spread-ts').attr('b')).to.equal('1');
			expect($('#spread-ts').attr('c')).to.equal('2');
		});

		it('Allows using the Fragment element to be used', async () => {
			const html = await fixture.readFile('/fragment/index.html');
			const $ = cheerio.load(html);

			// will be 1 if element rendered correctly
			expect($('#one')).to.have.lengthOf(1);
		});

		it('supports special chars in filename', async () => {
			// will have already erred by now, but add test anyway
			expect(await fixture.readFile('/special-“characters” -in-file/index.html')).to.be.ok;
		});
	});

	it('Supports void elements whose name is a string (#2062)', async () => {
		const html = await fixture.readFile('/input/index.html');
		const $ = cheerio.load(html);

		// <Input />
		expect($('body > :nth-child(1)').prop('outerHTML')).to.equal('<input>');

		// <Input type="password" />
		expect($('body > :nth-child(2)').prop('outerHTML')).to.equal('<input type="password">');

		// <Input type="text" />
		expect($('body > :nth-child(3)').prop('outerHTML')).to.equal('<input type="text">');

		// <Input type="select"><option>option</option></Input>
		expect($('body > :nth-child(4)').prop('outerHTML')).to.equal(
			'<select><option>option</option></select>'
		);

		// <Input type="textarea">textarea</Input>
		expect($('body > :nth-child(5)').prop('outerHTML')).to.equal('<textarea>textarea</textarea>');
	});

	describe('preview', () => {
		it('returns 200 for valid URLs', async () => {
			const result = await fixture.fetch('/');
			expect(result.status).to.equal(200);
		});

		it('returns 404 for invalid URLs', async () => {
			const result = await fixture.fetch('/bad-url');
			expect(result.status).to.equal(404);
		});
	});
});
