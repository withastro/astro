import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import ReactWrapper from '../src/components/ReactWrapper.astro';
import { loadRenderers} from "astro:container";
import { getContainerRenderer } from "@astrojs/react";

test('ReactWrapper with react renderer', async () => {
	const renderers = await loadRenderers([getContainerRenderer(19)])
	
	const container = await AstroContainer.create({
		renderers,
	});
	const result = await container.renderToString(ReactWrapper);

	expect(result).toContain('Counter');
	expect(result).toContain('Count: <!-- -->5');
});
