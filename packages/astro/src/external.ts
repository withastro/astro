import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('../package.json');

/**
 * This file allows us to automatically exclude
 * particular packages from Snowpack's `esinstall`
 * step.
 */

// These packages SHOULD be built by `esinstall`
const allowList = new Set(['astring', 'astro-prism', 'estree-util-value-to-estree', 'prismjs', 'shorthash']);

const isAstroRenderer = (name: string) => {
  return name.startsWith(`@astrojs/renderer-`);
};

// These packages should NOT be built by `esinstall`
// But might not be explicit dependencies of `astro`
const denyList = ['prismjs/components/index.js', '@vue/server-renderer', 'astro/dist/frontend/markdown.js'];

export default Object.keys(pkg.dependencies)
  // Filter out packages that should be loaded threw Snowpack
  .filter((name) => {
    // Explicitly allowed packages should NOT be external
    if (allowList.has(name)) return false;
    // Astro renderers should NOT be external
    if (isAstroRenderer(name)) return false;
    // Everything else SHOULD be external
    return true;
  })
  // Add extras
  .concat(denyList)
  .sort();
