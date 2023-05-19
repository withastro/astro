import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

const authorIds = ['Ben Holmes', 'Fred K Schott', 'Nate Moore'];
const translationIds = ['en', 'es', 'fr'];

describe('Content Collections - data collections', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({ root: './fixtures/data-collections/' });
		await fixture.build();
	});

	describe('Authors Collection', () => {
		let json;
		before(async () => {
			const rawJson = await fixture.readFile('/authors/all.json');
			json = JSON.parse(rawJson);
		});

		it('Returns', async () => {
			expect(Array.isArray(json)).to.be.true;
			expect(json.length).to.equal(3);
		});

		it('Generates correct ids', async () => {
			const ids = json.map((item) => item.id).sort();
			expect(ids).to.deep.equal(['Ben Holmes', 'Fred K Schott', 'Nate Moore']);
		});

		it('Generates correct data', async () => {
			const names = json.map((item) => item.data.name);
			expect(names).to.deep.equal(['Ben J Holmes', 'Fred K Schott', 'Nate Something Moore']);

			const twitterUrls = json.map((item) => item.data.twitter);
			expect(twitterUrls).to.deep.equal([
				'https://twitter.com/bholmesdev',
				'https://twitter.com/FredKSchott',
				'https://twitter.com/n_moore',
			]);
		});
	});

	describe('Authors Entry', () => {
		for (const authorId of authorIds) {
			let json;
			before(async () => {
				const rawJson = await fixture.readFile(`/authors/${authorId}.json`);
				json = JSON.parse(rawJson);
			});

			it(`Returns ${authorId}`, async () => {
				expect(json).to.haveOwnProperty('id');
				expect(json.id).to.equal(authorId);
			});

			it(`Generates correct data for ${authorId}`, async () => {
				expect(json).to.haveOwnProperty('data');
				expect(json.data).to.haveOwnProperty('name');
				expect(json.data).to.haveOwnProperty('twitter');

				switch (authorId) {
					case 'Ben Holmes':
						expect(json.data.name).to.equal('Ben J Holmes');
						expect(json.data.twitter).to.equal('https://twitter.com/bholmesdev');
						break;
					case 'Fred K Schott':
						expect(json.data.name).to.equal('Fred K Schott');
						expect(json.data.twitter).to.equal('https://twitter.com/FredKSchott');
						break;
					case 'Nate Moore':
						expect(json.data.name).to.equal('Nate Something Moore');
						expect(json.data.twitter).to.equal('https://twitter.com/n_moore');
						break;
				}
			});
		}
	});

	describe('Translations Collection', () => {
		let json;
		before(async () => {
			const rawJson = await fixture.readFile('/translations/all.json');
			json = JSON.parse(rawJson);
		});

		it('Returns', async () => {
			expect(Array.isArray(json)).to.be.true;
			expect(json.length).to.equal(3);
		});

		it('Generates correct ids', async () => {
			const ids = json.map((item) => item.id).sort();
			expect(ids).to.deep.equal(translationIds);
		});

		it('Generates correct data', async () => {
			const sorted = json.sort((a, b) => a.id.localeCompare(b.id));
			const homepageGreetings = sorted.map((item) => item.data.homepage?.greeting);
			expect(homepageGreetings).to.deep.equal([
				'Hello World!',
				'¡Hola Mundo!',
				'Bonjour le monde!',
			]);

			const homepagePreambles = sorted.map((item) => item.data.homepage?.preamble);
			expect(homepagePreambles).to.deep.equal([
				'Welcome to the future of content.',
				'Bienvenido al futuro del contenido.',
				'Bienvenue dans le futur du contenu.',
			]);
		});
	});

	describe('Translations Entry', () => {
		for (const translationId of translationIds) {
			let json;
			before(async () => {
				const rawJson = await fixture.readFile(`/translations/${translationId}.json`);
				json = JSON.parse(rawJson);
			});

			it(`Returns ${translationId}`, async () => {
				expect(json).to.haveOwnProperty('id');
				expect(json.id).to.equal(translationId);
			});

			it(`Generates correct data for ${translationId}`, async () => {
				expect(json).to.haveOwnProperty('data');
				expect(json.data).to.haveOwnProperty('homepage');
				expect(json.data.homepage).to.haveOwnProperty('greeting');
				expect(json.data.homepage).to.haveOwnProperty('preamble');

				switch (translationId) {
					case 'en':
						expect(json.data.homepage.greeting).to.equal('Hello World!');
						expect(json.data.homepage.preamble).to.equal('Welcome to the future of content.');
						break;
					case 'es':
						expect(json.data.homepage.greeting).to.equal('¡Hola Mundo!');
						expect(json.data.homepage.preamble).to.equal('Bienvenido al futuro del contenido.');
						break;
					case 'fr':
						expect(json.data.homepage.greeting).to.equal('Bonjour le monde!');
						expect(json.data.homepage.preamble).to.equal('Bienvenue dans le futur du contenu.');
						break;
				}
			});
		}
	});
});
