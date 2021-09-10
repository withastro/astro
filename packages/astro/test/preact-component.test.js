import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Preact component', () => {
  let fixture;
  let devServer;

  beforeAll(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/preact-component/' });
    devServer = await fixture.dev();
  });

  test('Can load class component', async () => {
    const html = await fixture.fetch('/class').then((res) => res.text());
    const $ = cheerio.load(html);

    // test 1: Can use class components
    expect($('#class-component')).toHaveLength(1);
  });

  test('Can load function component', async () => {
    const html = await fixture.fetch('/fn').then((res) => res.text());
    const $ = cheerio.load(html);

    // test 1: Can use function components
    expect($('#fn-component')).toHaveLength(1);
    // test 2: Can use function components
    expect($('#arrow-fn-component')).toHaveLength(1);
  });

  test('Can load TS component', async () => {
    const html = await fixture.fetch('/ts-components').then((res) => res.text());
    const $ = cheerio.load(html);

    // test 1: Can use TS components
    expect($('.ts-component')).toHaveLength(1);
  });

  test('Can use hooks', async () => {
    const html = await fixture.fetch('/hooks').then((res) => res.text());
    const $ = cheerio.load(html);
    expect($('#world')).toHaveLength(1);
  });

  test('Can export a Fragment', async () => {
    const html = await fixture.fetch('/frag').then((res) => res.text());
    const $ = cheerio.load(html);

    // test 1: nothing rendered but it didn’t throw
    expect($('body').children()).toHaveLength(0);
  });

  test('Can use a pragma comment', async () => {
    const html = await fixture.fetch('/pragma-comment').then((res) => res.text());
    const $ = cheerio.load(html);

    // test 1: rendered the PragmaComment component
    expect($('.pragma-comment')).toHaveLength(2);
  });

  test('Uses the new JSX transform', async () => {
    const html = await fixture.fetch('/pragma-comment').then((res) => res.text());

    // Grab the imports
    const exp = /import\("(.+?)"\)/g;
    let match, componentUrl;
    while ((match = exp.exec(html))) {
      if (match[1].includes('PragmaComment.js')) {
        componentUrl = match[1];
        break;
      }
    }
    const component = await fixture.fetch(componentUrl).then((res) => res.text());
    const jsxRuntime = component.imports.filter((i) => i.specifier.includes('jsx-runtime'));

    // test 1: preact/jsx-runtime is used for the component
    expect(jsxRuntime).toBeTruthy();
  });

  // important: close dev server (free up port and connection)
  afterAll(async () => {
    await devServer.stop();
  });
});
