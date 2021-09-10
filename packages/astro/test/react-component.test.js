import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('React Components', () => {
  let fixture;
  let devServer;

  beforeAll(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/react-component/' });
    devServer = await fixture.dev();
  });

  test('Can load React', async () => {
    const html = await fixture.fetch('/').then((res) => res.text());
    const $ = cheerio.load(html);

    // test 1: basic component renders
    expect($('#react-h2').text()).toBe('Hello world!');

    // test 2: no reactroot
    expect($('#react-h2').attr('data-reactroot')).toBe(undefined);

    // test 3: Can use function components
    expect($('#arrow-fn-component')).toHaveLength(1);

    // test 4: Can use spread for components
    expect($('#component-spread-props')).toHaveLength(1);

    // test 5: spread props renders
    expect($('#component-spread-props').text(), 'Hello world!');

    // test 6: Can use TS components
    expect($('.ts-component')).toHaveLength(1);

    // test 7: Can use Pure components
    expect($('#pure')).toHaveLength(1);
  });

  test('Includes reactroot on hydrating components', async () => {
    const html = await fixture.fetch('/').then((res) => res.text());
    const $ = cheerio.load(html);

    const div = $('#research');

    // test 1: has the hydration attr
    expect(div.attr('data-reactroot')).toBeTruthy();

    // test 2: renders correctly
    expect(div.html()).toBe('foo bar <!-- -->1');
  });

  test('Throws helpful error message on window SSR', async () => {
    const html = await fixture.fetch('/window').then((res) => res.text());
    expect(html).toEqual(
      expect.stringContaining(
        `[/window]
    The window object is not available during server-side rendering (SSR).
    Try using \`import.meta.env.SSR\` to write SSR-friendly code.
    https://docs.astro.build/reference/api-reference/#importmeta`
      )
    );
  });

  test('Can load Vue', async () => {
    const html = await fixture.fetch('/').then((res) => res.text());
    const $ = cheerio.load(html);
    expect($('#vue-h2').text()).toBe('Hasta la vista, baby');
  });

  test('Can use a pragma comment', async () => {
    const html = await fixture.fetch('/pragma-comment').then((res) => res.text());
    const $ = cheerio.load(html);

    // test 1: rendered the PragmaComment component
    expect($('.pragma-comment')).toHaveLength(2);
  });

  test('uses the new JSX transform', async () => {
    const html = await fixture.fetch('/').then((res) => res.text());

    // Grab the imports
    const exp = /import\("(.+?)"\)/g;
    let match, componentUrl;
    while ((match = exp.exec(html))) {
      if (match[1].includes('Research.js')) {
        componentUrl = match[1];
        break;
      }
    }
    const component = await fixture.fetch(componentUrl).then((res) => res.text());
    const jsxRuntime = component.imports.filter((i) => i.specifier.includes('jsx-runtime'));

    // test 1: react/jsx-runtime is used for the component
    expect(jsxRuntime).toBeTruthy();
  });

  // important: close dev server (free up port and connection)
  afterAll(async () => {
    await devServer.stop();
  });
});
