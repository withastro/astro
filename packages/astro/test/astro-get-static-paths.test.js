import { suite } from 'uvu';
import { setupBuild } from './helpers.js';

const GetStaticPaths = suite('getStaticPaths()');

setupBuild(GetStaticPaths, './fixtures/astro-get-static-paths');

GetStaticPaths('is only called once during build', async (context) => {
  // It would throw if this was not true
  await context.build();
});

GetStaticPaths.run();
