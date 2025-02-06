import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isPromise } from 'node:util/types';
import { renderTemplate, createComponent, renderComponent } from '../../../dist/runtime/server/index.js';

function renderToString(item) {
	if (isPromise(item)) {
		return item.then(renderToString);
	}

	let result = "";

	const destination = {
		write: (chunk) => { 
			result += chunk.toString();
		},
	}

	const renderResult = item.render(destination);

	if (isPromise(renderResult)) {
		return renderResult.then(() => result);
	}

	return result;
}

const Widget = createComponent((result, props) => {
	if (props.async === true) {
		return new Promise((resolve) => setImmediate(resolve)).then(() => continuation());
	}

	return continuation();

	function continuation() {
		const expressions = createExpressions(result, Widget, {...props})

		if (expressions.length === 0) {
			return renderTemplate`<${props.type ?? "scalar"} id="${props.id}" />`;
		}

		const htmlParts = new Array(expressions.length+1)
			.fill("")
			.fill(`<${props.type} id="${props.id}">`, 0, 1)
			.fill(`</${props.type}>`, -1);

		return renderTemplate(htmlParts, ...expressions);
	}
});

function createExpressions(result, Component, exdef) {
	const type = exdef.type;

	if (type === "async-generator") {
		return [async function*() {
			for (const ex of exdef.expressions ?? []) {
				yield await new Promise((resolve) => setImmediate(() => {
					resolve([createExpressions(result, Component, {...ex})]);
				}));
			}
		}];
	}

	if (type === "generator") {
		return [function*() {
			for (const ex of exdef.expressions ?? []) {
				yield [createExpressions(result, Component, {...ex})];
			}
		}];
	}

	if (type === "flat") {
		return exdef.expressions.map((ex) => createExpressions(result, Component, {...ex}));
	}

	if (type === "array") {
		return [exdef.expressions.map((ex) => createExpressions(result, Component, {...ex}))];
	}

	if (type === "promise") {
		return [new Promise((resolve) => setImmediate(() => resolve([createExpressions(result, Component, {...exdef.expression})])))];
	}

	if (type === "function") {
		return () => [createExpressions(result, Component, {...exdef.expression})];
	}

	if (type === "scalar") {
		return [renderComponent(result, "", Component, {...exdef.component ?? {}}, null)];
	}

	throw new Error(`Unknown expression type: "${type}".`);
}

describe('rendering', () => {
	it('evaluates expressions depth-first', async () => {
		const expression = {
			id: "04E54520-94AE-465F-86E9-2642DFC48DEC",
			type: "scalar",
			component: {
				id: "1C5D44F8-80C3-4AF9-A929-ED4E63BF24AF",
				type: "scalar",
				expressions: [
					{
						id: "73A14025-2FC2-4171-93A6-15D2539B64C8",
						type: "async-generator",
						expressions: [{
							type: "scalar",
							component: {
							}
						}]
					},
					{
						id: "EC182366-BDE3-4E28-8A1D-53407DE1F788",
						type: "generator",
						expressions: [{
							id: "7E196EAF-1EFE-4371-8D03-82E06433A844",
							type: "scalar",
							component: {
								id: "42879303-09A4-4348-9CFF-A1B87AB9645E"
							}
						}]
					},
					{
						id: "B053E18E-35FA-4976-B0C4-479842146483",
						type: "array",
						expressions: [{
							id: "49F26CCF-C411-4B08-9CC6-B9F802F2674C",
							type: "promise",
							expression: {
								id: "2DC74550-93F0-493D-929D-65B81C715C67",
								type: "scalar",
								component: {
									id: "F33B5D59-0E9B-4510-B1EF-69A969AA1C76",
								}
							}
						}]
					},
					{
						id: "1DF8B83D-8280-4D12-AA72-9150CC549995",
						type: "scalar",
						component: {
							id: "2DACD685-8603-4038-950D-2AC2B1738CD4",
						},
					},
					{
						id: "9A9E79B8-343B-4856-BAA3-C2A47FDB1531",
						type: "promise",
						expression: {
							id: "34D97751-51B0-430F-A2FA-0C1336C43AB4",
							type: "scalar",
							component: {
								id: "4E4FA4AA-F55C-44A7-A81A-18B10062B9B4",
							}
						}
					},
					{
						id: "9C72D8F3-B08F-4ED6-BC5F-6EBDDD9EFB09",
						type: "function",
						expression: {
							id: "BA9BC7C0-72B5-42CC-9DA4-74FCEDCA2897",
							type: "scalar",
							component: {
								id: "5477DB8D-B5B6-468F-8E05-3AEC20133790",
							}
						}
					},
				],
			}
		};

		const result = await renderToString(Widget({}, {...expression}, {}));

		const actual = [];

		const AsyncWidgetChild = createComponent(async (_result, props) => {
			actual.push(props.path);

			await Promise.resolve();
			return renderTemplate``;
		});

		const AsyncWidgetParent = createComponent(async (result, props) => {
			actual.push(props.path);

			await Promise.resolve();
			return renderTemplate`
				${renderComponent(result, '', AsyncWidgetChild, {path: `${props.path}::AsyncWidgetChild0`}, {})}
			`;
		});

		const SyncWidgetChild = createComponent((_result, props) => {
			actual.push(props.path);

			return renderTemplate``;
		});

		const SyncWidgetParent = createComponent((result, props) => {
			actual.push(props.path);

			return renderTemplate`
				${renderComponent(result, '', SyncWidgetChild, {path: `${props.path}::SyncWidgetChild0`}, {})},
				${() => renderComponent(result, '', SyncWidgetChild, {path: `${props.path}::SyncWidgetChild1`}, {})},
				${[
					() => renderComponent(result, '', SyncWidgetChild, {path: `${props.path}::SyncWidgetChild2`}, {}),
					renderComponent(result, '', SyncWidgetChild, {path: `${props.path}::SyncWidgetChild3`}, {}),
				]},
				${asyncGenerator(`${props.path}::SyncWidgetChild4`)}
				${syncGenerator(`${props.path}::SyncWidgetChild5`)}
			`;

			function* syncGenerator(path) {
				yield renderComponent(result, '', SyncWidgetChild, {path: path}, {});
			}

			async function* asyncGenerator(path) {
				yield renderComponent(result, '', SyncWidgetChild, {path: path}, {});
			}
		});

		const Root = createComponent((result, props) => {
			actual.push(props.path);
			return renderTemplate`
				${renderComponent(result, '', AsyncWidgetParent, {path: `${props.path}::AsyncWidgetParent0`}, {})}
				${renderComponent(result, '', SyncWidgetParent, {path: `${props.path}::SyncWidgetParent0`}, {})}
			`;
		});

		await renderToString(Root({}, {path: "Root"}, {}));

		const expected = [
			"Root",
			"Root::AsyncWidgetParent0",
			"Root::SyncWidgetParent0",
			"Root::AsyncWidgetParent0::AsyncWidgetChild0"
		];

		assert.deepEqual(actual, expected);
	});
});
