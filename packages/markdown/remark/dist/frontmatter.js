import yaml from 'js-yaml';
import * as toml from 'smol-toml';
function isFrontmatterValid(frontmatter) {
	try {
		JSON.stringify(frontmatter);
	} catch {
		return false;
	}
	return typeof frontmatter === 'object' && frontmatter !== null;
}
const frontmatterRE = /(?:^\uFEFF?|^\s*\n)(?:---|\+\+\+)([\s\S]*?\n)(?:---|\+\+\+)/;
const frontmatterTypeRE = /(?:^\uFEFF?|^\s*\n)(---|\+\+\+)/;
function extractFrontmatter(code) {
	return frontmatterRE.exec(code)?.[1];
}
function getFrontmatterParser(code) {
	return frontmatterTypeRE.exec(code)?.[1] === '+++' ? ['+++', toml.parse] : ['---', yaml.load];
}
function parseFrontmatter(code, options) {
	const rawFrontmatter = extractFrontmatter(code);
	if (rawFrontmatter == null) {
		return { frontmatter: {}, rawFrontmatter: '', content: code };
	}
	const [delims, parser] = getFrontmatterParser(code);
	const parsed = parser(rawFrontmatter);
	const frontmatter = parsed && typeof parsed === 'object' ? parsed : {};
	let content;
	switch (options?.frontmatter ?? 'remove') {
		case 'preserve':
			content = code;
			break;
		case 'remove':
			content = code.replace(`${delims}${rawFrontmatter}${delims}`, '');
			break;
		case 'empty-with-spaces':
			content = code.replace(
				`${delims}${rawFrontmatter}${delims}`,
				`   ${rawFrontmatter.replace(/[^\r\n]/g, ' ')}   `,
			);
			break;
		case 'empty-with-lines':
			content = code.replace(
				`${delims}${rawFrontmatter}${delims}`,
				rawFrontmatter.replace(/[^\r\n]/g, ''),
			);
			break;
	}
	return {
		frontmatter,
		rawFrontmatter,
		content,
	};
}
export { extractFrontmatter, isFrontmatterValid, parseFrontmatter };
