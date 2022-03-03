import als from '../../dist/index.js';
import t from 'tap';

const { AstroCheck } = als;

let checker = new AstroCheck(new URL("../../../../", import.meta.url).toString());

checker.upsertDocument({
  uri: 'file://fake/file.astro',
  text: `
<Fragment></Fragment>
`});

(async function() {
  let [{diagnostics}] = await checker.getDiagnostics();
  t.equal(diagnostics.length, 0, 'No errors found');
})();
