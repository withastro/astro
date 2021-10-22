import als from '../../dist/index.js';
import t from 'tap';

const { AstroCheck } = als;

let checker = new AstroCheck();

checker.upsertDocument({
  uri: 'file://fake/file.astro',
  text: `<div @is="div" @click="" @dog @cat @rat>Hello, world!</div>`
});

let [{diagnostics}] = await checker.getDiagnostics();
t.equal(diagnostics.length, 0, 'No errors found');