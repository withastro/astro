.PHONY: astro-build
astro-build:
	npx pnpm run build

.PHONY: build
build:
	npx pnpm --filter @example/minimal run build

.PHONY: start-fast
start-fast:
	GO_FAST=yes npx pnpm --filter @example/minimal run dist --host

.PHONY: start-slow
start-slow:
	GO_FAST=no npx pnpm --filter @example/minimal run dist --host

.PHONY: debug-fast
debug-fast:
	GO_FAST=yes npx pnpm --filter @example/minimal run dist:debug --host

.PHONY: debug-slow
debug-slow:
	GO_FAST=no npx pnpm --filter @example/minimal run dist:debug --host

.PHONY: loadtest
loadtest:
	cat loadtest.js | docker run --rm -i grafana/k6:latest run --vus=1 --duration=30s -e="URL=http://host.docker.internal:4321?sync=15000&async=0" -
