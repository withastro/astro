import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('Non-HTML Pages', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/non-html-pages/' });
		await fixture.build();
	});

	describe('json', () => {
		it('should match contents', async () => {
			const json = JSON.parse(await fixture.readFile('/about.json'));
			expect(json).to.have.property('name', 'Astro');
			expect(json).to.have.property('url', 'https://astro.build/');
		});

		it('should match contents (deprecated object form)', async () => {
			const json = JSON.parse(await fixture.readFile('/about-object.json'));
			expect(json).to.have.property('name', 'Astro');
			expect(json).to.have.property('url', 'https://astro.build/');
		});
	});

	describe('png', () => {
		it('should not have had its encoding mangled', async () => {
			const buffer = await fixture.readFile('/placeholder.png', 'base64');

			// Sanity check the first byte
			const hex = Buffer.from(buffer, 'base64').toString('hex');
			const firstHexByte = hex.slice(0, 2);
			// If we accidentally utf8 encode the png, the first byte (in hex) will be 'c2'
			expect(firstHexByte).to.not.equal('c2');
			// and if correctly encoded in binary, it should be '89'
			expect(firstHexByte).to.equal('89');

			// Make sure the whole buffer (in base64) matches this snapshot
			expect(buffer).to.equal(
				'iVBORw0KGgoAAAANSUhEUgAAAGQAAACWCAMAAAAfZt10AAAABlBMVEXd3d3+/v7B/CFgAAAA3UlEQVR42u3ZMQ7DIBQFQeb+l06bNgUbG/5eYApLFjzWNE3TNE3TNE035av9AhAQEBBQGAQEFAaFQWFQGBQGhUGCKAwKgwQpDJ6JECgCRYIEikH8YAyCRyEGyRCDvBWRIPNNBpm/8G6kUM45EhXKlQfuFSHFpbFH+jt2j/S7xwqUYvBaCRIozZy6X2km7v1K8uwQIIWBwkBAQEBg3Tyj3z4LnzRBKgwKg8KgMEgQhaEwSBCFQWBEiMIgQQqDBCkMEqQw+APixYgcsa0TERs7D/F6xGmIAxCD/Iw4AvEB92Ec3ZAPdlMAAAAASUVORK5CYII='
			);
		});

		it('should not have had its encoding mangled (deprecated object form)', async () => {
			const buffer = await fixture.readFile('/placeholder-object.png', 'base64');

			// Sanity check the first byte
			const hex = Buffer.from(buffer, 'base64').toString('hex');
			const firstHexByte = hex.slice(0, 2);
			// If we accidentally utf8 encode the png, the first byte (in hex) will be 'c2'
			expect(firstHexByte).to.not.equal('c2');
			// and if correctly encoded in binary, it should be '89'
			expect(firstHexByte).to.equal('89');

			// Make sure the whole buffer (in base64) matches this snapshot
			expect(buffer).to.equal(
				'iVBORw0KGgoAAAANSUhEUgAAAGQAAACWCAMAAAAfZt10AAAABlBMVEXd3d3+/v7B/CFgAAAA3UlEQVR42u3ZMQ7DIBQFQeb+l06bNgUbG/5eYApLFjzWNE3TNE3TNE035av9AhAQEBBQGAQEFAaFQWFQGBQGhUGCKAwKgwQpDJ6JECgCRYIEikH8YAyCRyEGyRCDvBWRIPNNBpm/8G6kUM45EhXKlQfuFSHFpbFH+jt2j/S7xwqUYvBaCRIozZy6X2km7v1K8uwQIIWBwkBAQEBg3Tyj3z4LnzRBKgwKg8KgMEgQhaEwSBCFQWBEiMIgQQqDBCkMEqQw+APixYgcsa0TERs7D/F6xGmIAxCD/Iw4AvEB92Ec3ZAPdlMAAAAASUVORK5CYII='
			);
		});
	});
});
