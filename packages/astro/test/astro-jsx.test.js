import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

let cwd = './fixtures/astro-jsx/';
let orders = [
  ['preact', 'react', 'solid'],
  ['preact', 'solid', 'react'],
  ['react', 'preact', 'solid'],
  ['react', 'solid', 'preact'],
  ['solid', 'react', 'preact'],
  ['solid', 'preact', 'react'],
];
let fixtures = {};

before(async () => {
  await Promise.all(
    orders.map((renderers, n) =>
      loadFixture({
        projectRoot: cwd,
        renderers: renderers.map((name) => `@astrojs/renderer-${name}`),
        dist: new URL(`${cwd}dist-${n}/`, import.meta.url),
      }).then((fixture) => {
        fixtures[renderers.toString()] = fixture;
        return fixture.build();
      })
    )
  );
});

it('Renderer order', () => {
  it('JSX renderers can be defined in any order', async () => {
    if (!Object.values(fixtures).length) {
      throw new Error(`JSX renderers didn’t build properly`);
    }

    for (const [name, fixture] of Object.entries(fixtures)) {
      const html = await fixture.readFile('/index.html');
      expect(html, name).to.be.ok;
    }
  });
});
