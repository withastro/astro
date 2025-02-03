.PHONY: astro-build
astro-build:
	npx pnpm --filter ./packages/astro run build

.PHONY: build
build:
	npx pnpm --filter @example/minimal run build

.PHONY: start
start:
	npx pnpm --filter @example/minimal run dist --host

.PHONY: debug
debug:
	npx pnpm --filter @example/minimal run dist:debug --host

.PHONY: loadtest
loadtest:
	cat loadtest.js | docker run --rm -i grafana/k6:latest run --vus=1 --duration=30s -e="URL=http://host.docker.internal:4321?sync=1000&async=0" -
# cat loadtest.js | docker run --rm -i grafana/k6:latest run --vus=1 --duration=30s -e="URL=http://host.docker.internal:4321?sync=15000&async=0" -
