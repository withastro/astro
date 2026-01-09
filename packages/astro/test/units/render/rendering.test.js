import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { isPromise } from 'node:util/types';
import * as cheerio from 'cheerio';
import {
	createComponent,
	HTMLString,
	renderComponent,
	renderTemplate,
} from '../../../dist/runtime/server/index.js';

const DEFAULT_RESULT = {
	clientDirectives: new Map(),
};

describe('rendering', () => {
	const evaluated = [];

	const Scalar = createComponent((_result, props) => {
		evaluated.push(props.id);
		return renderTemplate`<scalar id="${props.id}"></scalar>`;
	});

	beforeEach(() => {
		evaluated.length = 0;
	});

	it('components are evaluated and rendered depth-first', async () => {
		const Root = createComponent((result, props) => {
			evaluated.push(props.id);
			return renderTemplate`<root id="${props.id}">
				${renderComponent(result, '', Scalar, { id: `${props.id}/scalar_1` })}
				${renderComponent(result, '', Nested, { id: `${props.id}/nested` })}
				${renderComponent(result, '', Scalar, { id: `${props.id}/scalar_2` })}
			</root>`;
		});

		const Nested = createComponent((result, props) => {
			evaluated.push(props.id);
			return renderTemplate`<nested id="${props.id}">
				${renderComponent(result, '', Scalar, { id: `${props.id}/scalar` })}
			</nested>`;
		});

		const result = await renderToString(Root(DEFAULT_RESULT, { id: 'root' }, {}));
		const rendered = getRenderedIds(result);

		assert.deepEqual(evaluated, [
			'root',
			'root/scalar_1',
			'root/nested',
			'root/nested/scalar',
			'root/scalar_2',
		]);

		assert.deepEqual(rendered, [
			'root',
			'root/scalar_1',
			'root/nested',
			'root/nested/scalar',
			'root/scalar_2',
		]);
	});

	it('synchronous component trees are rendered without promises', () => {
		const Root = createComponent((result, props) => {
			evaluated.push(props.id);
			return renderTemplate`<root id="${props.id}">
				${() => renderComponent(result, '', Scalar, { id: `${props.id}/scalar_1` })}
				${function* () {
					yield renderComponent(result, '', Scalar, { id: `${props.id}/scalar_2` });
				}}
				${[renderComponent(result, '', Scalar, { id: `${props.id}/scalar_3` })]}
				${renderComponent(result, '', Scalar, { id: `${props.id}/scalar_4` })}
			</root>`;
		});

		const result = renderToString(Root(DEFAULT_RESULT, { id: 'root' }, {}));
		assert.ok(!isPromise(result));

		const rendered = getRenderedIds(result);

		assert.deepEqual(evaluated, [
			'root',
			'root/scalar_1',
			'root/scalar_2',
			'root/scalar_3',
			'root/scalar_4',
		]);

		assert.deepEqual(rendered, [
			'root',
			'root/scalar_1',
			'root/scalar_2',
			'root/scalar_3',
			'root/scalar_4',
		]);
	});

	it('async component children are deferred', async () => {
		const Root = createComponent((result, props) => {
			evaluated.push(props.id);
			return renderTemplate`<root id="${props.id}">
				${renderComponent(result, '', AsyncNested, { id: `${props.id}/asyncnested` })}
				${renderComponent(result, '', Scalar, { id: `${props.id}/scalar` })}
			</root>`;
		});

		const AsyncNested = createComponent(async (result, props) => {
			evaluated.push(props.id);
			await new Promise((resolve) => setTimeout(resolve, 0));
			return renderTemplate`<asyncnested id="${props.id}">
				${renderComponent(result, '', Scalar, { id: `${props.id}/scalar` })}
			</asyncnested>`;
		});

		const result = await renderToString(Root(DEFAULT_RESULT, { id: 'root' }, {}));

		const rendered = getRenderedIds(result);

		assert.deepEqual(evaluated, [
			'root',
			'root/asyncnested',
			'root/scalar',
			'root/asyncnested/scalar',
		]);

		assert.deepEqual(rendered, [
			'root',
			'root/asyncnested',
			'root/asyncnested/scalar',
			'root/scalar',
		]);
	});

	it('adjacent async components are evaluated eagerly', async () => {
		const resetEvent = new ManualResetEvent();

		const Root = createComponent((result, props) => {
			evaluated.push(props.id);
			return renderTemplate`<root id="${props.id}">
				${renderComponent(result, '', AsyncNested, { id: `${props.id}/asyncnested_1` })}
				${renderComponent(result, '', AsyncNested, { id: `${props.id}/asyncnested_2` })}
			</root>`;
		});

		const AsyncNested = createComponent(async (result, props) => {
			evaluated.push(props.id);
			await resetEvent.wait();
			return renderTemplate`<asyncnested id="${props.id}">
				${renderComponent(result, '', Scalar, { id: `${props.id}/scalar` })}
			</asyncnested>`;
		});

		const awaitableResult = renderToString(Root(DEFAULT_RESULT, { id: 'root' }, {}));

		assert.deepEqual(evaluated, ['root', 'root/asyncnested_1', 'root/asyncnested_2']);

		resetEvent.release();

		// relinquish control after release
		await new Promise((resolve) => setTimeout(resolve, 0));

		assert.deepEqual(evaluated, [
			'root',
			'root/asyncnested_1',
			'root/asyncnested_2',
			'root/asyncnested_1/scalar',
			'root/asyncnested_2/scalar',
		]);

		const result = await awaitableResult;
		const rendered = getRenderedIds(result);

		assert.deepEqual(rendered, [
			'root',
			'root/asyncnested_1',
			'root/asyncnested_1/scalar',
			'root/asyncnested_2',
			'root/asyncnested_2/scalar',
		]);
	});

	it('skip rendering blank html fragments', async () => {
		const Root = createComponent(() => {
			const message = 'hello world';
			return renderTemplate`${message}`;
		});

		const renderInstance = await renderComponent(DEFAULT_RESULT, '', Root, {});

		const chunks = [];
		const destination = {
			write: (chunk) => {
				chunks.push(chunk);
			},
		};

		await renderInstance.render(destination);

		assert.deepEqual(chunks, [new HTMLString('hello world')]);
	});

	it('all primitives are rendered in order', async () => {
		const Root = createComponent((result, props) => {
			evaluated.push(props.id);
			return renderTemplate`<root id="${props.id}">
				${renderComponent(result, '', Scalar, { id: `${props.id}/first` })}
				${() => renderComponent(result, '', Scalar, { id: `${props.id}/func` })}
				${new Promise((resolve) => {
					setTimeout(() => {
						resolve(renderComponent(result, '', Scalar, { id: `${props.id}/promise` }));
					}, 0);
				})}
				${[
					() => renderComponent(result, '', Scalar, { id: `${props.id}/array_func` }),
					renderComponent(result, '', Scalar, { id: `${props.id}/array_scalar` }),
				]}
				${async function* () {
					yield await new Promise((resolve) => {
						setTimeout(() => {
							resolve(renderComponent(result, '', Scalar, { id: `${props.id}/async_generator` }));
						}, 0);
					});
				}}
				${function* () {
					yield renderComponent(result, '', Scalar, { id: `${props.id}/generator` });
				}}
				${renderComponent(result, '', Scalar, { id: `${props.id}/last` })}
			</root>`;
		});

		const result = await renderToString(Root(DEFAULT_RESULT, { id: 'root' }, {}));

		const rendered = getRenderedIds(result);

		assert.deepEqual(rendered, [
			'root',
			'root/first',
			'root/func',
			'root/promise',
			'root/array_func',
			'root/array_scalar',
			'root/async_generator',
			'root/generator',
			'root/last',
		]);
	});
});

function renderToString(item) {
	if (isPromise(item)) {
		return item.then(renderToString);
	}

	let result = '';

	const destination = {
		write: (chunk) => {
			result += chunk.toString();
		},
	};

	const renderResult = item.render(destination);

	if (isPromise(renderResult)) {
		return renderResult.then(() => result);
	}

	return result;
}

function getRenderedIds(html) {
	return cheerio
		.load(
			html,
			null,
			false,
		)('*')
		.map((_, node) => node.attribs['id'])
		.toArray();
}

class ManualResetEvent {
	#resolve;
	#promise;
	#done = false;

	release() {
		if (this.#done) {
			return;
		}

		this.#done = true;

		if (this.#resolve) {
			this.#resolve();
		}
	}

	wait() {
		// Promise constructor callbacks are called immediately
		// so retrieving the value of "resolve" should
		// be safe to do.

		if (!this.#promise) {
			this.#promise = this.#done
				? Promise.resolve()
				: new Promise((resolve) => {
						this.#resolve = resolve;
					});
		}

		return this.#promise;
	}
}
