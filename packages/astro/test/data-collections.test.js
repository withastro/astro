import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

const authorIds = ['Ben Holmes', 'Fred K Schott', 'Nate Moore'];
const translationIds = ['en', 'es', 'fr'];

describe('Data Collections', () => {
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
			const ids = json.map((item) => item.id);
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
});
