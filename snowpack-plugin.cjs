const { readFile } = require('fs').promises;

// Snowpack plugins must be CommonJS :(
const transformPromise = import('./lib/compiler/index.js');

module.exports = function (snowpackConfig, { resolve, extensions } = {}) {
  return {
    name: 'snowpack-astro',
    knownEntrypoints: ['deepmerge'],
    resolve: {
      input: ['.astro', '.md'],
      output: ['.js'],
    },
    async load({ filePath }) {
      const { compileComponent } = await transformPromise;
      const projectRoot = snowpackConfig.root;
      const contents = await readFile(filePath, 'utf-8');
      const compileOptions = {
        resolve,
        extensions
      };
      const result = await compileComponent(contents, { compileOptions, filename: filePath, projectRoot });
      return result.contents;
    },
  };
};
