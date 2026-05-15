import type { Context } from './context.js';
/**
 * Removes sections from README content that are marked with HTML template markers.
 *
 * Template marker format:
 * <!-- ASTRO:REMOVE:START -->
 * Content to remove
 * <!-- ASTRO:REMOVE:END -->
 */
export declare function removeTemplateMarkerSections(content: string): string;
/**
 * Processes a template README file by removing template marker sections and
 * replacing package manager references.
 */
export declare function processTemplateReadme(content: string, packageManager: string): string;
export declare function template(
	ctx: Pick<Context, 'template' | 'prompt' | 'yes' | 'dryRun' | 'exit' | 'tasks'>,
): Promise<void>;
export declare function getTemplateTarget(tmpl: string, ref?: string): string;
export declare function isThirdPartyTemplate(tmpl: string): boolean;
