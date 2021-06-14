import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { setupBuild } from './helpers.js';

const StylePath = suite('Style paths');

setupBuild(StylePath, './fixtures/build-style-path');

StylePath.before(async (context) => {
  context.buildError = null;
  const { build } = context;
  try {
    await build();
  } catch (err) {
    context.buildError = err;
  }
});

StylePath('No build error', ({ buildError }) => {
  assert.equal(buildError, null);
});

StylePath('Page created', async ({ readFile }) => {
  try {
    const page = await readFile('/index.html');
    assert.ok(page, 'Page was built');
  } catch(err) {
    console.log(err)
    assert.ok(false, 'File not created');
  }
});

StylePath.run();
