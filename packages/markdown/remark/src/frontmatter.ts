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

export interface ParseFrontmatterOptions {
	/**
	 * How the frontmatter should be handled in the returned `content` string.
	 * - `preserve`: Keep the frontmatter in the returned `content` string.
	 * - `strip`: Completely remove the frontmatter from the returned `content` string.
	 * - `empty-with-spaces`: Replace the frontmatter with spaces in the returned `content` string. (preserves sourcemap offset/line/col)
	 * - `empty-with-lines`: Replace the frontmatter with newlines in the returned `content` string. (preserves sourcemap line/col)
	 *
	 * @default 'strip'
	 */
	frontmatter: 'preserve' | 'strip' | 'empty-with-spaces' | 'empty-with-lines';
}

export interface ParseFrontmatterResult {
	frontmatter: Record<string, any>;
	rawFrontmatter: string;
	content: string;
}

export function parseFrontmatter(
	code: string,
	options?: ParseFrontmatterOptions,
): ParseFrontmatterResult {
	const rawFrontmatter = extractFrontmatter(code);

	if (rawFrontmatter == null) {
		return { frontmatter: {}, rawFrontmatter: '', content: code };
	}

	const parsed = yaml.load(rawFrontmatter);
	const frontmatter = (parsed && typeof parsed === 'object' ? parsed : {}) as Record<string, any>;

	let content: string;
	switch (options?.frontmatter ?? 'strip') {
		case 'preserve':
			content = code;
			break;
		case 'strip':
			content = code.replace(`---${rawFrontmatter}---`, '');
			break;
		case 'empty-with-spaces':
			content = code.replace(
				`---${rawFrontmatter}---`,
				`   ${rawFrontmatter.replace(/[^\r\n]/g, ' ')}   `,
			);
			break;
		case 'empty-with-lines':
			content = code.replace(`---${rawFrontmatter}---`, rawFrontmatter.replace(/[^\r\n]/g, ''));
			break;
	}

	return {
		frontmatter,
		rawFrontmatter,
		content,
	};
}
