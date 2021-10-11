import als from '../../dist/index.js';
import t from 'tap';

const { AstroCheck } = als;

let checker = new AstroCheck();

checker.upsertDocument({
  uri: 'file://fake/file.astro',
  text: `
{Astro.slots.a && <span>testing</span>}
`});

let [{diagnostics}] = await checker.getDiagnostics();
t.equal(diagnostics.length, 0, 'No errors found');