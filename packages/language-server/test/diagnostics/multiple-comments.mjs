import als from '../../dist/index.js';
import t from 'tap';

const { AstroCheck } = als;

let checker = new AstroCheck();

checker.upsertDocument({
  uri: 'file://fake/file.astro',
  text: `
<html>
  <body class="is-preload">
    <!-- Wrapper -->
    <div id="wrapper">
      <!-- Main -->
      <div id="main"></div>
    </div>
  </body>
</html>
`});

(async function() {
  let [{diagnostics}] = await checker.getDiagnostics();
  t.equal(diagnostics.length, 0, 'No errors found');
})();
