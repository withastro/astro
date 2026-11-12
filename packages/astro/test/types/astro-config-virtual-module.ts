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
		expectTypeOf<keyof typeof server>().toEqualTypeOf<keyof ServerDeserializedManifest>();
		expectTypeOf(server.base).toEqualTypeOf<ServerDeserializedManifest['base']>();
		expectTypeOf(server.build).toEqualTypeOf<ServerDeserializedManifest['build']>();
		expectTypeOf(server.cacheDir).toEqualTypeOf<ServerDeserializedManifest['cacheDir']>();
		expectTypeOf(server.outDir).toEqualTypeOf<ServerDeserializedManifest['outDir']>();
		expectTypeOf(server.publicDir).toEqualTypeOf<ServerDeserializedManifest['publicDir']>();
		expectTypeOf(server.srcDir).toEqualTypeOf<ServerDeserializedManifest['srcDir']>();
		expectTypeOf(server.root).toEqualTypeOf<ServerDeserializedManifest['root']>();
		expectTypeOf(server.trailingSlash).toEqualTypeOf<ServerDeserializedManifest['trailingSlash']>();
		expectTypeOf(server.site).toEqualTypeOf<ServerDeserializedManifest['site']>();
		expectTypeOf(server.compressHTML).toEqualTypeOf<ServerDeserializedManifest['compressHTML']>();
		expectTypeOf(server.i18n).toEqualTypeOf<ServerDeserializedManifest['i18n']>();
		expectTypeOf(server.image).toEqualTypeOf<ServerDeserializedManifest['image']>();
		// @ts-expect-error ES module bindings are read-only.
		server.base = '/changed/';
	});
	it('astro:config/client', () => {
		expectTypeOf<keyof typeof client>().toEqualTypeOf<keyof ClientDeserializedManifest>();
		expectTypeOf(client.base).toEqualTypeOf<ClientDeserializedManifest['base']>();
		expectTypeOf(client.i18n).toEqualTypeOf<ClientDeserializedManifest['i18n']>();
		expectTypeOf(client.trailingSlash).toEqualTypeOf<ClientDeserializedManifest['trailingSlash']>();
		expectTypeOf(client.site).toEqualTypeOf<ClientDeserializedManifest['site']>();
		expectTypeOf(client.compressHTML).toEqualTypeOf<ClientDeserializedManifest['compressHTML']>();
		expectTypeOf(client.build).toEqualTypeOf<ClientDeserializedManifest['build']>();
		expectTypeOf(client.image).toEqualTypeOf<ClientDeserializedManifest['image']>();
		// @ts-expect-error ES module bindings are read-only.
		client.base = '/changed/';
	});
});
