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

describe('rendering', () => {
	describe('expressions', () => {
		it('components are evaluated depth first', async () => {
			const evaluated = [];

			const Root = createComponent((_, props) => {
				evaluated.push(props.id);
				return renderTemplate`<root>
					${renderComponent({}, "", Scalar, {id: `${props.id}/scalarA`})}
					${renderComponent({}, "", Nested, {id: `${props.id}/nested`})}
					${renderComponent({}, "", Scalar, {id: `${props.id}/scalarB`})}
				</root>`;
			});

			const Scalar = createComponent((_, props) => {
				evaluated.push(props.id);
				return renderTemplate`<scalar id="${props.id}" />`;
			});

			const Nested = createComponent((_, props) => {
				evaluated.push(props.id);
				return renderTemplate`<nested id="${props.id}">
					${renderComponent({}, "", Scalar, {id: `${props.id}/scalar`})}
				</nested>`;
			});

			const result = await renderToString(Root({}, {id: "root"}, {}));
			
			assert.deepEqual(evaluated, [
				"root",
				"root/scalarA",
				"root/nested",
				"root/scalarB",
				"root/nested/scalar"
			]);
		});
	});
});
