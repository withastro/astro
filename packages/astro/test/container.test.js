import { describe, it } from 'node:test';
import {
	Fragment,
	createComponent,
	maybeRenderHead,
	render,
	renderComponent,
	renderHead,
	renderSlot,
} from '../dist/runtime/server/index.js';
import { unstable_AstroContainer } from '../dist/container/index.js';
import assert from 'node:assert/strict';

const createAstroModule = (AstroComponent) => ({ default: AstroComponent });

const BaseLayout = createComponent((result, _props, slots) => {
	return render`<html>
	<head>
	${renderSlot(result, slots['head'])}
	${renderHead(result)}
	</head>
	${maybeRenderHead(result)}
	<body>
		${renderSlot(result, slots['default'])}
	</body>
</html>`;
});

describe('Container', () => {
	it('Renders a head with hello world', async () => {
		const Page = createComponent((result) => {
			return render`${renderComponent(
				result,
				'BaseLayout',
				BaseLayout,
				{},
				{
					default: () => render`${maybeRenderHead(result)}<div>hello world</div>`,
					head: () => render`
						${renderComponent(
							result,
							'Fragment',
							Fragment,
							{ slot: 'head' },
							{
								default: () => render`<meta charset="utf-8">`,
							}
						)}
					`,
				}
			)}`;
		});

		const container = await unstable_AstroContainer.create();
		const PageModule = createAstroModule(Page);
		const response = await container.renderToString(PageModule);

		assert.match(response, /hello world/);
	});
});
