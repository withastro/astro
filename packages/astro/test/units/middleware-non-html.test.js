import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from '../test-utils.js';

describe('Middleware returning non-html, SSR', () => {
	/** @type {import('../test-utils').Fixture} */
	let fixture;
	/** @type {import('../test-utils').DevServer} */
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware-non-html-ssr/',
		});
		// do an ssr build
		await fixture.build();
		// start the dev server
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('should return placeholder.png with a custom content type', async () => {
		const response = await fixture.fetch('/placeholder.png');
		assert.equal(response.headers.get('Content-Type'), 'image/png');
		assert.equal(response.headers.get('Content-Disposition'), 'inline; filename="placeholder.png"');

		const imageBase64 = await response
			.arrayBuffer()
			.then((arrayBuffer) => Buffer.from(arrayBuffer).toString('base64'));

		// Make sure the whole buffer (in base64) matches this snapshot
		assert.equal(
			imageBase64,
			'iVBORw0KGgoAAAANSUhEUgAAAGQAAACWCAMAAAAfZt10AAAABlBMVEXd3d3+/v7B/CFgAAAA3UlEQVR42u3ZMQ7DIBQFQeb+l06bNgUbG/5eYApLFjzWNE3TNE3TNE035av9AhAQEBBQGAQEFAaFQWFQGBQGhUGCKAwKgwQpDJ6JECgCRYIEikH8YAyCRyEGyRCDvBWRIPNNBpm/8G6kUM45EhXKlQfuFSHFpbFH+jt2j/S7xwqUYvBaCRIozZy6X2km7v1K8uwQIIWBwkBAQEBg3Tyj3z4LnzRBKgwKg8KgMEgQhaEwSBCFQWBEiMIgQQqDBCkMEqQw+APixYgcsa0TERs7D/F6xGmIAxCD/Iw4AvEB92Ec3ZAPdlMAAAAASUVORK5CYII=',
		);
	});

	it('should return rename-me.json renamed to data.json', async () => {
		const response = await fixture.fetch('/rename-me.json');
		assert.equal(response.status, 200);
		assert.equal(response.headers.get('Content-Type'), 'application/json');
		assert.equal(response.headers.get('Content-Disposition'), 'inline; filename="data.json"');

		const data = await response.json();
		assert.equal(data.name, 'alan');
	});
});

describe('Middleware returning non-html, SSG', () => {
	/** @type {import('../test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware-non-html-ssg/',
		});
		// do an ssg build
		await fixture.build();
	});

	it('should have built placeholder.png with a custom content type', async () => {
		const imageText = await fixture.readFile('/placeholder.png', 'base64');

		// Make sure the whole buffer (in base64) matches this snapshot
		assert.equal(
			imageText,
			'iVBORw0KGgoAAAANSUhEUgAAAGQAAACWCAMAAAAfZt10AAAABlBMVEXd3d3+/v7B/CFgAAAA3UlEQVR42u3ZMQ7DIBQFQeb+l06bNgUbG/5eYApLFjzWNE3TNE3TNE035av9AhAQEBBQGAQEFAaFQWFQGBQGhUGCKAwKgwQpDJ6JECgCRYIEikH8YAyCRyEGyRCDvBWRIPNNBpm/8G6kUM45EhXKlQfuFSHFpbFH+jt2j/S7xwqUYvBaCRIozZy6X2km7v1K8uwQIIWBwkBAQEBg3Tyj3z4LnzRBKgwKg8KgMEgQhaEwSBCFQWBEiMIgQQqDBCkMEqQw+APixYgcsa0TERs7D/F6xGmIAxCD/Iw4AvEB92Ec3ZAPdlMAAAAASUVORK5CYII=',
		);
	});

	it('should have built data.json with a custom name (rename-me.json)', async () => {
		const file = await fixture.readFile('/data.json');
		const data = JSON.parse(file);
		assert.equal(data.name, 'alan');
	});
});
