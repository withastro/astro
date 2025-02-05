import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderTemplate } from '../../../dist/runtime/server/index.js';
import { isPromise } from 'node:util/types';
import { createComponent } from '../../../dist/runtime/server/index.js';
import { renderComponent } from '../../../dist/runtime/server/index.js';

function renderTempalateToString(htmlParts, ...expressions) {
	let result = "";

	const destination = {
		write: (chunk) => { 
			result += chunk.toString();
		},
	}

	const maybePromise = renderTemplate(htmlParts, expressions);
	
	if (isPromise(maybePromise)) {
		return maybePromise.then((x) => {
			x.render(destination);
			return result;
		});
	}

	maybePromise.render(destination);
	
	return result;
}

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

const BaseLayout = createComponent((_result, _props, _slots) => {
	return renderTemplate`<html>
	<body>
		<div>hello world</div>
	</body>
</html>`;
});

describe('Container', () => {
	it('Renders a div with hello world text', async () => {
		const Page = createComponent((result) => {
			return renderTemplate`${renderComponent(
				result,
				'BaseLayout',
				BaseLayout,
				{},
				{},
			)}`;
		});

		const page = Page({}, {}, {});

		const result = renderToString(page);

		// ideally this will be false.
		assert.ok(isPromise(result));

		assert.equal('<html>\n\t<body>\n\t\t<div>hello world</div>\n\t</body>\n</html>', await result);
	});
});

describe("renderTemplate", () => {
	it("evaluates expressions depth-first", async () => {
		const expectedOrder = [
			"1. function",
			"2. array => function",
			"3. function => function",
		];

		const invocations = [];

		const expressions = [
			() => { 
				invocations.push("1. function");
			},
			() => {
				return [
					() => { 
						invocations.push("2. array => function")
					},
				];
			},
			() => { 
				return () => {
					invocations.push("3. function => function");
				}
			},
			() => {
				
			}
		];

		const result = renderTempalateToString([], expressions);
		assert.equal(result, "");

		assert.deepEqual(expectedOrder, invocations);
	});
});
