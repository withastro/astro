import type { HoistedScript, TransformResult } from '@astrojs/compiler';
import type { PropagationHint } from '../@types/astro.js';
import type { CompileCssResult } from '../core/compile/compile.js';

export interface PageOptions {
	prerender?: boolean;
}

export interface PluginMetadata {
	astro: {
		hydratedComponents: TransformResult['hydratedComponents'];
		clientOnlyComponents: TransformResult['clientOnlyComponents'];
		scripts: TransformResult['scripts'];
		containsHead: TransformResult['containsHead'];
		propagation: PropagationHint;
		pageOptions: PageOptions;
	};
}

export interface CompileMetadata {
	/** Used for HMR to compare code changes */
	originalCode: string;
	/** For Astro CSS virtual module */
	css: CompileCssResult[];
	/** For Astro hoisted scripts virtual module */
	scripts: HoistedScript[];
}
