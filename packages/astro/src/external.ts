import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('../package.json');

// Snowpack `external` configuraiton

const allowList = new Set([
  'astro-prism',
  'prismjs',
  'preact',
  'preact-render-to-string',
  'react',
  'react-dom',
  'svelte',
  'vue',
]);

const denyList = [
  'prismjs/components/index.js'
];


export default Object.keys(pkg.dependencies)
// Filter out packages that should be loaded threw Snowpack
.filter(name => !allowList.has(name))
// Add extras
.concat(denyList)
.sort();