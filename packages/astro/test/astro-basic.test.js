import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Astro basics', () => {
  describe('dev', () => {
    let fixture; // fixture #1. Note that .dev() and .preview() share a port, so these fixtures must be kept separate.
    let devServer;

    beforeAll(async () => {
      fixture = await loadFixture({ projectRoot: './fixtures/astro-basic/' });
      devServer = await fixture.dev();
    });

    test('Can load page', async () => {
      const html = await fixture.fetch(`/`).then((res) => res.text());
      const $ = cheerio.load(html);

      expect($('h1').text()).toBe('Hello world!');
    });

    test('Correctly serializes boolean attributes', async () => {
      const html = await fixture.fetch('/').then((res) => res.text());
      const $ = cheerio.load(html);

      expect($('h1').attr('data-something')).toBe('');
      expect($('h2').attr('not-data-ok')).toBe('');
    });

    test('Selector with an empty body', async () => {
      const html = await fixture.fetch('/empty-class').then((res) => res.text());
      const $ = cheerio.load(html);

      expect($('.author')).toHaveLength(1);
    });

    test('Allows forward-slashes in mustache tags (#407)', async () => {
      const html = await fixture.fetch('/forward-slash').then((res) => res.text());
      const $ = cheerio.load(html);

      expect($('a[href="/post/one"]')).toHaveLength(1);
      expect($('a[href="/post/two"]')).toHaveLength(1);
      expect($('a[href="/post/three"]')).toHaveLength(1);
    });

    test('Allows spread attributes (#521)', async () => {
      const html = await fixture.fetch('/spread').then((res) => res.text());
      const $ = cheerio.load(html);

      expect($('#spread-leading')).toHaveLength(1);
      expect($('#spread-leading').attr('a')).toBe('0');
      expect($('#spread-leading').attr('b')).toBe('1');
      expect($('#spread-leading').attr('c')).toBe('2');

      expect($('#spread-trailing')).toHaveLength(1);
      expect($('#spread-trailing').attr('a')).toBe('0');
      expect($('#spread-trailing').attr('b')).toBe('1');
      expect($('#spread-trailing').attr('c')).toBe('2');
    });

    test('Allows spread attributes with TypeScript (#521)', async () => {
      const html = await fixture.fetch('/spread').then((res) => res.text());
      const $ = cheerio.load(html);

      expect($('#spread-ts')).toHaveLength(1);
      expect($('#spread-ts').attr('a')).toBe('0');
      expect($('#spread-ts').attr('b')).toBe('1');
      expect($('#spread-ts').attr('c')).toBe('2');
    });

    test('Allows using the Fragment element to be used', async () => {
      const html = await fixture.fetch('/fragment').then((res) => res.text());
      const $ = cheerio.load(html);

      // will be 1 if element rendered correctly
      expect($('#one')).toHaveLength(1);
    });

    // important: close dev server (free up port and connection)
    afterAll(async () => {
      await devServer.stop();
    });
  });

  describe('preview', () => {
    let fixture; // fixture #2. Note that .dev() and .preview() share a port, so these fixtures must be kept separate.
    let previewServer;

    beforeAll(async () => {
      fixture = await loadFixture({ projectRoot: './fixtures/astro-basic' });
      await fixture.build();
      previewServer = await fixture.preview();
    });

    test('returns 200 for valid URLs', async () => {
      const result = fixture.fetch('/');
      expect(result.statusCode).toBe(200);
    });

    test('returns 404 for invalid URLs', async () => {
      const result = fixture.fetch('/bad-url');
      expect(result.statusCode).toBe(404);
    });

    // important: close preview server (free up port and connection)
    afterAll(() => {
      previewServer.close();
    });
  });
});
