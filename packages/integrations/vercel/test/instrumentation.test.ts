import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

const traceContexts = [
	{
		spanId: 'b7ad6b7169203331',
		traceId: '0af7651916cd43dd8448eb211c80319c',
	},
	{
		spanId: 'c7ad6b7169203332',
		traceId: '1af7651916cd43dd8448eb211c80319d',
	},
];

declare global {
	var astroVercelInstrumentationRuns: number | undefined;
	var notifyAstroVercelInstrumentationStarted: (() => void) | undefined;
	var resetAstroVercelOpenTelemetry: (() => void) | undefined;
	var waitForAstroVercelInstrumentation: Promise<void> | undefined;
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

	async function getFunctionEntry(functionFixture: Fixture, name: '_render' | '_isr') {
		const functionConfig = JSON.parse(
			await functionFixture.readFile(`../.vercel/output/functions/${name}.func/.vc-config.json`),
		);
		return new URL(
			`../.vercel/output/functions/${name}.func/${functionConfig.handler}`,
			functionFixture.config.outDir,
		);
	}

	async function loadFunction(name: '_render' | '_isr') {
		globalThis.resetAstroVercelOpenTelemetry?.();
		const functionEntry = await getFunctionEntry(fixture, name);

		let notifyStarted: () => void;
		const registrationStarted = new Promise<void>((resolve) => {
			notifyStarted = resolve;
		});
		let releaseRegistration: () => void;
		globalThis.waitForAstroVercelInstrumentation = new Promise<void>((resolve) => {
			releaseRegistration = resolve;
		});
		globalThis.notifyAstroVercelInstrumentationStarted = notifyStarted!;

		let importFinished = false;
		const functionImport = import(`${functionEntry.href}?function=${name}`).then((module) => {
			importFinished = true;
			return module;
		});
		await registrationStarted;
		await new Promise((resolve) => setImmediate(resolve));
		assert.equal(importFinished, false);

		releaseRegistration!();
		const serverlessFunction = await functionImport;
		globalThis.notifyAstroVercelInstrumentationStarted = undefined;
		globalThis.waitForAstroVercelInstrumentation = undefined;
		return serverlessFunction;
	}

	async function expectTraceContext(
		serverlessFunction: { default: { fetch(request: Request): Promise<Response> } },
		url: string,
	) {
		const responses = await Promise.all(
			traceContexts.map(({ spanId, traceId }) =>
				serverlessFunction.default.fetch(
					new Request(url, { headers: { traceparent: `00-${traceId}-${spanId}-01` } }),
				),
			),
		);

		for (const [index, response] of responses.entries()) {
			const { spanId, traceId } = traceContexts[index]!;
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

	it('ignores instrumentation files unless enabled', async () => {
		const disabledFixture = await loadFixture({
			root: './fixtures/instrumentation-disabled/',
		});
		await disabledFixture.build({});
		const functionEntry = await getFunctionEntry(disabledFixture, '_render');
		const serverlessFunction = await import(`${functionEntry.href}?instrumentation=disabled`);

		const response = await serverlessFunction.default.fetch(new Request('https://example.com/'));

		assert.equal(response.status, 200);
		assert.match(await response.text(), /Instrumentation disabled/);
	});

	it('rejects function initialization when registration fails', async () => {
		const errorFixture = await loadFixture({
			root: './fixtures/instrumentation-error/',
		});
		await errorFixture.build({});
		const functionEntry = await getFunctionEntry(errorFixture, '_render');

		await assert.rejects(
			import(`${functionEntry.href}?instrumentation=error`),
			/Instrumentation registration failed/,
		);
	});
});
