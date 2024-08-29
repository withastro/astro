import { loadFixture as baseLoadFixture } from '@astrojs/test-utils';

export { fixLineEndings } from '@astrojs/test-utils';

export function loadFixture(config) {
	if (config?.root) {
		config.root = new URL(config.root, import.meta.url);
	}
	return baseLoadFixture(config);
}
