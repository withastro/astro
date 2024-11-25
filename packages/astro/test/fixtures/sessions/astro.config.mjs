//  @ts-check
import { defineConfig } from 'astro/config';
import testAdapter from '../../test-adapter.js';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export default defineConfig({
	adapter: testAdapter(),
	output: 'server',
	experimental: {
		session: {
			driver: 'fsLite',
			options: {
				base: join(tmpdir(), 'sessions'),
			},
		},
	},
});
