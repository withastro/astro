import { ActionError } from 'astro:actions';
import { expect, it } from 'vitest';

it('imports astro:actions in the Cloudflare vitest pool', () => {
	expect(ActionError).toBeTypeOf('function');
});