import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

const NODE_VERSION = parseFloat(process.versions.node);
const stripExpressionMarkers = (html) => html.replace(/<!--\/?lit-part-->/g, '');

before(async () => {
  // @lit-labs/ssr/ requires Node 13.9 or higher
  if (NODE_VERSION < 13.9) {
    return;
  }
  fixture = await loadFixture({
    projectRoot: './fixtures/lit-element/',
    renderers: ['@astrojs/renderer-lit'],
  });
  await fixture.build();
});

describe('LitElement test', () => {
  it('Renders a custom element by tag name', async () => {
    // @lit-labs/ssr/ requires Node 13.9 or higher
    if (NODE_VERSION < 13.9) {
      return;
    }
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    // test 1: attributes rendered – non reactive properties
    expect($('my-element').attr('foo')).to.equal('bar');

    // test 2: shadow rendered
    expect($('my-element').html()).to.include(`<div>Testing...</div>`);

    // test 3: string reactive property set
    expect(stripExpressionMarkers($('my-element').html())).to.include(`<div id="str">initialized</div>`);

    // test 4: non-reactive don't react
    expect(stripExpressionMarkers($('my-element').html())).to.include(`<div id="non-reactive">not initialized</div>`);

    // test 5: boolean reactive property correctly set
    // <my-element bool="false"> Lit will equate to true because it uses
    // this.hasAttribute to determine its value
    expect(stripExpressionMarkers($('my-element').html())).to.include(`<div id="bool">A</div>`);
    expect(stripExpressionMarkers($('my-element').html())).to.include(`<div id="false-bool">B</div>`);

    // test 6: object reactive property set
    expect(stripExpressionMarkers($('my-element').html())).to.include(`<div id="data">data: 1</div>`);

    // test 7: JSX bindings to Lit attribute conversions done correctly
    expect($('my-element').attr('obj')).to.equal('{"data":1}');
    expect($('my-element').attr('bool')).to.equal('');
    expect($('my-element').attr('falseBool')).to.equal(undefined);
    expect($('my-element').attr('str')).to.equal(undefined);
    expect($('my-element').attr('str-attr')).to.equal('initialized');
  });

  // Skipped because not supported by Lit
  it.skip('Renders a custom element by the constructor', async () => {
    const html = await fixture.fetch('/ctr/index.html');
    const $ = cheerio.load(html);

    // test 1: attributes rendered
    expect($('my-element').attr('foo')).to.equal('bar');

    // test 2: shadow rendered
    expect($('my-element').html()).to.include(`<div>Testing...</div>`);
  });
});

after(async () => {
  // The Lit renderer adds browser globals that interfere with other tests, so remove them now.
  const globals = Object.keys(globalThis.window || {});
  globals.splice(globals.indexOf('global'), 1);
  for (let name of globals) {
    delete globalThis[name];
  }
});
