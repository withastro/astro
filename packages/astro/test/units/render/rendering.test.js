import * as assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import { isPromise } from 'node:util/types';
import { renderTemplate, createComponent, renderComponent } from '../../../dist/runtime/server/index.js';
import * as cheerio from 'cheerio';

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
				${renderComponent(result, "", Scalar, {id: `${props.id}/scalar_1`})}
				${renderComponent(result, "", Nested, {id: `${props.id}/nested`})}
				${renderComponent(result, "", Scalar, {id: `${props.id}/scalar_2`})}
			</root>`;
		});

		const Nested = createComponent((result, props) => {
			evaluated.push(props.id);
			return renderTemplate`<nested id="${props.id}">
				${renderComponent(result, "", Scalar, {id: `${props.id}/scalar`})}
			</nested>`;
		});

		const result = await renderToString(Root({}, {id: "root"}, {}));
		const rendered = getRenderedIds(result);

		assert.deepEqual(evaluated, [
			"root",
			"root/scalar_1",
			"root/nested",
			"root/nested/scalar",			
			"root/scalar_2",
		]);

		assert.deepEqual(rendered, [
			"root",
			"root/scalar_1",
			"root/nested",
			"root/nested/scalar",			
			"root/scalar_2",
		]);
	});

	it('synchronous component trees are rendered without promises', () => {
		const Root = createComponent((result, props) => {
			evaluated.push(props.id);
			return renderTemplate`<root id="${props.id}">
				${() => renderComponent(result, "", Scalar, {id: `${props.id}/scalar_1`})}
				${function*() {
					yield renderComponent(result, "", Scalar, {id: `${props.id}/scalar_2`});
				}}
				${[
					renderComponent(result, "", Scalar, {id: `${props.id}/scalar_3`})
				]}
				${renderComponent(result, "", Scalar, {id: `${props.id}/scalar_4`})}
			</root>`;
		});

		const result = renderToString(Root({}, {id: "root"}, {}));
		assert.ok(!isPromise(result));
		
		const rendered = getRenderedIds(result);

		assert.deepEqual(evaluated, [
			"root",
			"root/scalar_1",
			"root/scalar_2",
			"root/scalar_3",
			"root/scalar_4",
		]);

		assert.deepEqual(rendered, [
			"root",
			"root/scalar_1",
			"root/scalar_2",
			"root/scalar_3",
			"root/scalar_4",
		]);
	});

	it('async component children are deferred', async () => {
		const Root = createComponent((result, props) => {
			evaluated.push(props.id);
			return renderTemplate`<root id="${props.id}">
				${renderComponent(result, "", AsyncNested, {id: `${props.id}/asyncnested`})}
				${renderComponent(result, "", Scalar, {id: `${props.id}/scalar`})}
			</root>`;
		});

		const AsyncNested = createComponent(async (result, props) => {
			evaluated.push(props.id);
			await Promise.resolve();
			return renderTemplate`<asyncnested id="${props.id}">
				${renderComponent(result, "", Scalar, {id: `${props.id}/scalar`})}
			</asyncnested>`;
		});

		const result = await renderToString(Root({}, {id: "root"}, {}));
		
		const rendered = getRenderedIds(result);

		assert.deepEqual(evaluated, [
			"root",
			"root/asyncnested",
			"root/scalar",
			"root/asyncnested/scalar"
		]);

		assert.deepEqual(rendered, [
			"root",
			"root/asyncnested",
			"root/asyncnested/scalar",
			"root/scalar",
		]);
	});

	it('adjacent async components are evaluated eagerly', async () => {
		const event1 = new ManualResetEvent();
		// const event2 = new ManualResetEvent();

		const Root = createComponent((result, props) => {
			evaluated.push(props.id);
			return renderTemplate`<root id="${props.id}">
				${renderComponent(result, "", AsyncNested, {id: `${props.id}/asyncnested_1`})}
				${renderComponent(result, "", AsyncNested, {id: `${props.id}/asyncnested_2`})}
			</root>`;
		});

		const AsyncNested = createComponent(async (result, props) => {
			evaluated.push(props.id);
			await event1.wait();
			return renderTemplate`<asyncnested id="${props.id}">
				${renderComponent(result, "", AsyncScalar, {id: `${props.id}/asyncscalar`})}
			</asyncnested>`;
		});

		const AsyncScalar = createComponent(async (result, props) => {
			evaluated.push(props.id);
			// await event2.wait();
			return renderTemplate`<asyncscalar id="${props.id}"></asyncscalar>`;
		});

		const awaitableResult = renderToString(Root({}, {id: "root"}, {}));

		assert.deepEqual(evaluated, [
			"root",
			"root/asyncnested_1",
			"root/asyncnested_2",
		]);

		const result = await awaitableResult;

		event1.release();
		
		const rendered = getRenderedIds(result);
	});
});

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

function getRenderedIds(html) {
	return cheerio
		.load(html, null, false)("*")
		.map((_, node) => node.attribs["id"])
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
				: new Promise((resolve) => { this.#resolve = resolve; });
		}

		return this.#promise;
	}
}
