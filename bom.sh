#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

if ! command -v node &>/dev/null; then
	echo "Nodejs is not installed."
fi
if ! command -v npm &>/dev/null; then
	echo "NPM is not installed."
fi
if ! command -v cyclonedx-node &>/dev/null; then
	npm install -g @cyclonedx/bom -y
fi

find . -name bom.json -type f -exec rm -rf {} \;
cyclonedx-node --include-dev --output bom.json

pushd packages/astro
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/astro-prism
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/astro-rss
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/create-astro
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/integrations/cloudflare
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/integrations/deno
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/integrations/image
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/integrations/lit
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/integrations/mdx
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/integrations/netlify
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/integrations/node
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/integrations/partytown
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/integrations/preact
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/integrations/prefetch
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/integrations/react
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/integrations/sitemap
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/integrations/solid
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/integrations/svelte
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/integrations/tailwind
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/integrations/turbolinks
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/integrations/vercel
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/integrations/vue
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/markdown/component
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/markdown/remark
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/telemetry
cyclonedx-node --include-dev --output bom.json
popd

pushd packages/webapi
cyclonedx-node --include-dev --output bom.json
popd
