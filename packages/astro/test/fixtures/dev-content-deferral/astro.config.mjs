import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

const markerPath = fileURLToPath(new URL('./server-started.txt', import.meta.url));

export default defineConfig({
	name: 'content-deferral-test-fixture',
	integrations: [
		{
			name: 'content-deferral-hook-recorder',
			hooks: {
				'astro:server:start': () => {
					fs.writeFileSync(markerPath, Date.now().toString());
				},
			},
		},
	],
});