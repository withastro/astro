import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('custom assets name function', () => {
    /** @type {import('./test-utils').Fixture} */
    let fixture;

    before(async () => {
        fixture = await loadFixture({
            root: './fixtures/custom-assets-name/',
            output: 'server',
        });
        await fixture.build();
    });

    it('should load CSS file from custom client assets path', async () => {
        const files = await fixture.readdir('/client/assets/css');
        const cssFile = files.find(file => file === 'a.css');
        assert.ok(cssFile, 'Expected CSS file to exist at client/assets/css/a.css');
    });

    it('should load image file from custom client assets path', async () => {
        const files = await fixture.readdir('/client/imgAssets');
        const imgFile = files.find(file => file === 'penguin1.jpg');
        assert.ok(imgFile, 'Expected image file to exist at client/imgAssets/penguin1.jpg');
    });
});
