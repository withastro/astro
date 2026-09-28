import { bindings, defineConfig } from 'cf/config';

export default defineConfig({
	worker: {
		name: 'test-preview-remote-bindings',
		compatibilityDate: '2026-01-28',
		env: {
			ASSETS: bindings.assets(),
			REMOTE_KV: bindings.kv({
				id: 'abcdef0123456789abcdef0123456789',
				dev: { remote: true },
			}),
		},
	},
});
