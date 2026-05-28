import type * as estree from 'estree';
import type * as hast from 'hast';
import type * as mdast from 'mdast';
import type * as unified from 'unified';

export { SpyLogger } from 'astro/_internal/test/units/test-utils';
export {
	loadFixture,
	type AstroInlineConfig,
	type DevServer,
	type Fixture,
} from 'astro/_internal/test/test-utils';

export type RemarkPlugin<PluginParameters extends any[] = any[]> = unified.Plugin<
	PluginParameters,
	mdast.Root
>;

export type RehypePlugin<PluginParameters extends any[] = any[]> = unified.Plugin<
	PluginParameters,
	hast.Root
>;

export type RecmaPlugin<PluginParameters extends any[] = any[]> = unified.Plugin<
	PluginParameters,
	estree.Program
>;
