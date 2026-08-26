import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

const traceId = '0af7651916cd43dd8448eb211c80319c';
const spanId = 'b7ad6b7169203331';
const traceparent = `00-${traceId}-${spanId}-01`;

declare global {
	var astroVercelInstrumentationRuns: number | undefined;
	var resetAstroVercelOpenTelemetry: (() => void) | undefined;
}

describe('instrumentation', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/instrumentation/',
		});
		await fixture.build({});
	});

	after(() => {
		globalThis.resetAstroVercelOpenTelemetry?.();
	});

	async function loadFunction(name: '_render' | '_isr') {
		globalThis.resetAstroVercelOpenTelemetry?.();
		const functionConfig = JSON.parse(
			await fixture.readFile(`../.vercel/output/functions/${name}.func/.vc-config.json`),
		);
		const functionEntry = new URL(
			`../.vercel/output/functions/${name}.func/${functionConfig.handler}`,
			fixture.config.outDir,
		);

		return import(`${functionEntry.href}?function=${name}`);
	}

	async function expectTraceContext(
		serverlessFunction: { default: { fetch(request: Request): Promise<Response> } },
		url: string,
	) {
		const responses = await Promise.all(
			Array.from({ length: 2 }, () =>
				serverlessFunction.default.fetch(new Request(url, { headers: { traceparent } })),
			),
		);

		for (const response of responses) {
			assert.equal(response.status, 200);
			assert.deepEqual(await response.json(), {
				contextSurvivedAwait: true,
				instrumentationRuns: 1,
				spanId,
				traceId,
			});
		}
	}

	it('loads instrumentation and propagates context through _render', async () => {
		const renderFunction = await loadFunction('_render');

		await expectTraceContext(renderFunction, 'https://example.com/api/context');
	});

	it('loads instrumentation and propagates context through _isr', async () => {
		const isrFunction = await loadFunction('_isr');
		const deploymentConfig = JSON.parse(await fixture.readFile('../.vercel/output/config.json'));
		const isrRoute = deploymentConfig.routes.find(
			(route: { dest?: string }) =>
				typeof route.dest === 'string' && route.dest.startsWith('/_isr?'),
		);
		const pathToken = new URL(isrRoute.dest, 'https://example.com').searchParams.get(
			'x_astro_path_token',
		);

		await expectTraceContext(
			isrFunction,
			`https://example.com/_isr?x_astro_path=/cached&x_astro_path_token=${pathToken}`,
		);
	});
});
