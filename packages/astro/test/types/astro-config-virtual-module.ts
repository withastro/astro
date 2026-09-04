import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import type {
	ClientDeserializedManifest,
	ServerDeserializedManifest,
} from '../../dist/types/public/index.js';
import '../../client.d.ts';

const server = null as unknown as typeof import('astro:config/server');
const client = null as unknown as typeof import('astro:config/client');

describe('astro:config', () => {
	it('astro:config/server', () => {
		expectTypeOf(server).toEqualTypeOf<ServerDeserializedManifest>();
	});
	it('astro:config/client', () => {
		expectTypeOf(client).toEqualTypeOf<ClientDeserializedManifest>();
	});
});
