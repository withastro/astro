import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const DynamicComponents = suite('Dynamic components tests');

setup(DynamicComponents, './fixtures/astro-dynamic');

DynamicComponents('Loads client-only packages', async ({ runtime }) => {
  let result = await runtime.load('/');

  assert.equal(result.statusCode, 200);

  // Grab the react-dom import
  const exp = /import\("(.+?)"\)/g;
  let match, reactDomURL;
  while(match = exp.exec(result.contents)) {
    if(match[1].includes('react-dom')) {
      reactDomURL = match[1];
    }
  }

  assert.ok(reactDomURL, 'React dom is on the page');
  
  result = await runtime.load(reactDomURL);
  assert.equal(result.statusCode, 200, 'Can load react-dom');
});

DynamicComponents.run();
