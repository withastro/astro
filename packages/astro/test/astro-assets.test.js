import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import build from '../dist/build/index.js';

const Assets = suite('Assets');

await build({ projectRoot: 'test/fixtures/astro-assets/' });

Assets('build the base image', () => {});

// let oneX = await readFile('/_astro/src/images/twitter.png');
// assert.ok(oneX, 'built the base image');

// let twoX = await readFile('/_astro/src/images/twitter@2x.png');
// assert.ok(twoX, 'built the 2x image');

// let threeX = await readFile('/_astro/src/images/twitter@3x.png');
// assert.ok(threeX, 'build the 3x image');

Assets.run();
