#! /bin/sh

# Originally, client-shim.min.sh was generated from client-shim.js and then changed manually.
# This script regenerates client-shim.min.js. Regeneration with current dependencies shows two
# missing changes that have been made to the bundled files since the original generation. See below.

# If you regenerate, check copyright & license for up-to-dateness
# and diffs for correctness before committing the result.

pnpm exec esbuild --bundle --minify --format=esm < client-shim.js > client-shim.tmp.js
COPYRIGHT=$(grep -o "Copyright 2..." client-shim.tmp.js | sort | tail -n 1 )
sed -n '/Copyright/{N;/License/{s/\n/ /p}}'< client-shim.tmp.js | sort -u
pnpm exec prettier -w --log-level warn client-shim.tmp.js
sed -i '/\/\*/,$d' client-shim.tmp.js
cat > client-shim.min.js - client-shim.tmp.js << ENDCOMMENT
/** @license $COPYRIGHT Google LLC (BSD-3-Clause) */
/** Bundled JS generated from "@astrojs/lit/client-shim.js" */
ENDCOMMENT
rm client-shim.tmp.js
exit

The diff against d7f36720d4683c6c1da389a15c5ab04a6de351b4 shows different minified identifiers
and two other diffs that come from updates of the bundled files.
- Updated feature check:
	https://github.com/webcomponents/template-shadowroot/pull/22
- Renaming of shadowroot to shadowrootmode:
	https://github.com/webcomponents/template-shadowroot/pull/43.
	See also [Lit] Forwards compatiblity for streaming Declarative Shadow DOM (#6055)

