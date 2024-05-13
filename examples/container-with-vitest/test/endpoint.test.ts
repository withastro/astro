import { expect, test } from 'vitest';
import { unstable_AstroContainer as AstroContainer } from 'astro/container';
import * as API from '../src/pages/api.ts';

test('API endpoint ', async () => {
	const container = await AstroContainer.create();
	const response = await container.renderToResponse(API, {
		routeType: 'endpoint',
	});

	expect(response.status).toEqual(200);
	const content = await response.json();
	expect(content).toEqual({
		foo: 'bar',
		number: 1,
	});
});
