import type { HoistedScript, TransformResult } from '@astrojs/compiler';
import type { CompileCssResult } from '../core/compile/types.js';
import type { PropagationHint } from '../types/public/internal.js';

interface PageOptions {
	prerender?: boolean;
}

export interface PluginMetadata {
	astro: {
		hydratedComponents: TransformResult['hydratedComponents'];
		clientOnlyComponents: TransformResult['clientOnlyComponents'];
		serverComponents: TransformResult['serverComponents'];
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
	/** For Astro scripts virtual module */
	scripts: HoistedScript[];
}
