import yaml from 'js-yaml';

export function isFrontmatterValid(frontmatter: Record<string, any>) {
	try {
		// ensure frontmatter is JSON-serializable
		JSON.stringify(frontmatter);
	} catch {
		return false;
	}
	return typeof frontmatter === 'object' && frontmatter !== null;
}

const frontmatterRE = /^---(.*?)^---/ms;
export function extractFrontmatter(code: string): string | undefined {
	return frontmatterRE.exec(code)?.[1];
}

export interface ParseFrontmatterResult {
	frontmatter: Record<string, any>;
	rawFrontmatter: string;
	content: string;
}

export function parseFrontmatter(code: string): ParseFrontmatterResult {
	const rawFrontmatter = extractFrontmatter(code);

	if (rawFrontmatter == null) {
		return { frontmatter: {}, rawFrontmatter: '', content: code };
	}

	const parsed = yaml.load(rawFrontmatter);
	const frontmatter = (parsed && typeof parsed === 'object' ? parsed : {}) as Record<string, any>;

	return {
		frontmatter,
		rawFrontmatter,
		content: code.replace(rawFrontmatter, rawFrontmatter.replace(/[^\r\n]/g, ' ')),
	};
}
