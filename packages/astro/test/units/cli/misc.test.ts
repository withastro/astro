// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { serverStart } from '../../../dist/core/messages/runtime.js';
import { PassthroughTextStyler } from '../../../dist/cli/infra/passthrough-text-styler.js';
import { FakeAstroVersionProvider } from './utils.js';

const textStyler = new PassthroughTextStyler();
const astroVersionProvider = new FakeAstroVersionProvider('1.2.3');

describe('CLI misc', () => {
	it('serverStart()', () => {
		assert.equal(
			serverStart({
				textStyler,
				astroVersionProvider,
				startupTime: 300,
				host: true,
				base: '/',
				resolvedUrls: {
					local: ['http://localhost:4321'],
					network: ['http://192.168.1.15:4321'],
				},
			}),
			' astro  v1.2.3 ready in 300 ms\n┃ Local    http://localhost:4321/\n┃ Network  http://192.168.1.15:4321/',
		);

		assert.equal(
			serverStart({
				textStyler,
				astroVersionProvider,
				startupTime: 300,
				host: true,
				base: '/',
				resolvedUrls: {
					local: ['http://localhost:4321', 'http://localhost:4322'],
					network: ['http://192.168.1.15:4321', 'http://192.168.1.15:4322'],
				},
			}),
			' astro  v1.2.3 ready in 300 ms\n┃ Local    http://localhost:4321/\n           http://localhost:4322/\n┃ Network  http://192.168.1.15:4321/\n           http://192.168.1.15:4322/',
		);

		assert.equal(
			serverStart({
				textStyler,
				astroVersionProvider,
				startupTime: 300,
				host: true,
				base: '/foo',
				resolvedUrls: {
					local: ['http://localhost:4321'],
					network: ['http://192.168.1.15:4321'],
				},
			}),
			' astro  v1.2.3 ready in 300 ms\n┃ Local    http://localhost:4321/foo\n┃ Network  http://192.168.1.15:4321/foo',
		);

		assert.equal(
			serverStart({
				textStyler,
				astroVersionProvider,
				startupTime: 300,
				host: false,
				base: '/',
				resolvedUrls: {
					local: ['http://localhost:4321'],
					network: [],
				},
			}),
			' astro  v1.2.3 ready in 300 ms\n┃ Local    http://localhost:4321/\n┃ Network  use --host to expose',
		);

		assert.equal(
			serverStart({
				textStyler,
				astroVersionProvider,
				startupTime: 300,
				host: 'localhost',
				base: '/',
				resolvedUrls: {
					local: ['http://localhost:4321'],
					network: [],
				},
			}),
			' astro  v1.2.3 ready in 300 ms\n┃ Local    http://localhost:4321/',
		);

		assert.equal(
			serverStart({
				textStyler,
				astroVersionProvider,
				startupTime: 300,
				host: '127.0.0.1',
				base: '/',
				resolvedUrls: {
					local: ['http://localhost:4321'],
					network: [],
				},
			}),
			' astro  v1.2.3 ready in 300 ms\n┃ Local    http://localhost:4321/',
		);

		assert.equal(
			serverStart({
				textStyler,
				astroVersionProvider,
				startupTime: 300,
				host: '127.0.0.2',
				base: '/',
				resolvedUrls: {
					local: ['http://localhost:4321'],
					network: [],
				},
			}),
			' astro  v1.2.3 ready in 300 ms\n┃ Local    http://localhost:4321/\n┃ Network  unable to find network to expose',
		);

		assert.equal(
			serverStart({
				textStyler,
				astroVersionProvider,
				startupTime: 300,
				host: true,
				base: '/',
				resolvedUrls: {
					local: ['http://localhost:4321'],
					network: [],
				},
			}),
			' astro  v1.2.3 ready in 300 ms\n┃ Local    http://localhost:4321/\n┃ Network  unable to find network to expose',
		);
	});
});
