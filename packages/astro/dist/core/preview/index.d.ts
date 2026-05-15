import type { AstroInlineConfig } from '../../types/public/config.js';
import type { PreviewServer } from '../../types/public/preview.js';
/**
 * Starts a local server to serve your static dist/ directory. This command is useful for previewing
 * your build locally, before deploying it. It is not designed to be run in production.
 *
 * @experimental The JavaScript API is experimental
 */
export default function preview(inlineConfig: AstroInlineConfig): Promise<PreviewServer>;
