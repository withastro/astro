import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inferSourceFormat } from '../../../dist/assets/utils/inferSourceFormat.js';

describe('inferSourceFormat', () => {
	it('detects svg from file extension', () => {
		assert.equal(inferSourceFormat('/images/logo.svg'), 'svg');
	});

	it('detects svg from remote URL', () => {
		assert.equal(inferSourceFormat('https://example.com/icon.svg'), 'svg');
	});

	it('detects svg from remote URL with query string', () => {
		assert.equal(inferSourceFormat('https://example.com/icon.svg?v=2'), 'svg');
	});

	it('detects svg from remote URL with hash', () => {
		assert.equal(inferSourceFormat('https://example.com/icon.svg#fragment'), 'svg');
	});

	it('detects svg from data: URI with image/svg+xml', () => {
		assert.equal(inferSourceFormat('data:image/svg+xml;base64,PHN2Zz4='), 'svg');
	});

	it('detects png from file extension', () => {
		assert.equal(inferSourceFormat('/images/photo.png'), 'png');
	});

	it('detects jpg from file extension', () => {
		assert.equal(inferSourceFormat('/images/photo.jpg'), 'jpg');
	});

	it('detects webp from remote URL', () => {
		assert.equal(inferSourceFormat('https://cdn.example.com/img.webp'), 'webp');
	});

	it('detects png from data: URI', () => {
		assert.equal(inferSourceFormat('data:image/png;base64,iVBOR'), 'png');
	});

	it('returns undefined for extensionless path', () => {
		assert.equal(inferSourceFormat('/images/photo'), undefined);
	});

	it('is case-insensitive for extensions', () => {
		assert.equal(inferSourceFormat('/images/logo.SVG'), 'svg');
		assert.equal(inferSourceFormat('/images/photo.PNG'), 'png');
	});

	it('handles paths with multiple dots', () => {
		assert.equal(inferSourceFormat('/images/my.photo.jpg'), 'jpg');
	});

	it('detects format from Astro internal query string paths', () => {
		assert.equal(
			inferSourceFormat('/src/assets/penguin.jpg?origWidth=207&origHeight=243&origFormat=jpg'),
			'jpg',
		);
	});
});
