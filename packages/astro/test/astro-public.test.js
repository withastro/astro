import { loadFixture } from './test-utils.js';

let fixture;

beforeAll(async () => {
  fixture = await loadFixture({ projectRoot: './fixtures/astro-public/' });
  await fixture.build();
});

describe('Public', () => {
  test('css and js files do not get bundled', async () => {
    let indexHtml = await fixture.readFile('/index.html');
    expect(indexHtml).toEqual(expect.stringContaining('<script src="/example.js"></script>'));
    expect(indexHtml).toEqual(expect.stringContaining('<link href="/example.css" ref="stylesheet">'));
    expect(indexHtml).toEqual(expect.stringContaining('<img src="/images/twitter.png">'));
  });
});
