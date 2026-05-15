import type { AstroRenderer } from '../../types/public/integrations.js';
import type { SSRLoadedRenderer } from '../../types/public/internal.js';
import type { ModuleLoader } from '../module-loader/index.js';
export declare function loadRenderer(
	renderer: AstroRenderer,
	moduleLoader: ModuleLoader,
): Promise<SSRLoadedRenderer | undefined>;
