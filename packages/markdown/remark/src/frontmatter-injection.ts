import type { VFile, VFileData as Data } from 'vfile';
import type { MarkdownAstroData } from './types.js';

function isValidAstroData(obj: unknown): obj is MarkdownAstroData {
	if (typeof obj === 'object' && obj !== null && obj.hasOwnProperty('frontmatter')) {
		const { frontmatter } = obj as any;
		try {
			// ensure frontmatter is JSON-serializable
			JSON.stringify(frontmatter);
		} catch {
			return false;
		}
		return typeof frontmatter === 'object' && frontmatter !== null;
	}
	return false;
}

export class InvalidAstroDataError extends TypeError {}

export function safelyGetAstroData(vfileData: Data): MarkdownAstroData | InvalidAstroDataError {
	const { astro } = vfileData;

	if (!astro || !isValidAstroData(astro)) {
		return new InvalidAstroDataError();
	}

	return astro;
}

export function setVfileFrontmatter(vfile: VFile, frontmatter: Record<string, any>) {
	vfile.data ??= {};
	vfile.data.astro ??= {};
	(vfile.data.astro as any).frontmatter = frontmatter;
}
