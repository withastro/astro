import { loadFixture } from './test-utils.js';
import { expect } from 'chai';

describe('maxDuration', () => {
    /** @type {import('./test-utils.js').Fixture} */
    let fixture;

    before(async () => {
        fixture = await loadFixture({
            root: './fixtures/max-duration/',
        });
        await fixture.build();
    });

    it('makes it to vercel function configuration', async () => {
        const vcConfig = JSON.parse(await fixture.readFile('../.vercel/output/functions/render.func/.vc-config.json'));
        expect(vcConfig).to.deep.include({ maxDuration: 60 });
    });
});
