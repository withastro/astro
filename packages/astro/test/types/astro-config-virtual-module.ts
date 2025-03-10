import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import type {
	ClientDeserializedManifest,
	ServerDeserializedManifest,
} from '../../dist/types/public';

const server = null as typeof import('astro:config/server');
const client = null as typeof import('astro:config/client');

describe('astro:config', () => {
	it('astro:config/server', () => {
		expectTypeOf(server).toEqualTypeOf<ServerDeserializedManifest>();
	});
	it('astro:config/client', () => {
		expectTypeOf(client).toEqualTypeOf<ClientDeserializedManifest>();
	});
});
