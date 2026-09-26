import { readFile } from 'node:fs/promises';
import type { Plugin } from 'vite';

const FRONTMATTER_RE = /^---\r?$[\s\S]+?^---\r?$/m;
const COMMENT_RE = /<!--.*?-->/gs;
const SCRIPT_RE =
	/(<script(?:\s+[a-z_:][-\w:]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^"'<>=\s]+))?)*\s*>)(.*?)<\/script>/gis;
const SRC_RE = /\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s'">]+))/i;
const TYPE_RE = /\btype\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s'">]+))/i;
const LANG_RE = /\blang\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s'">]+))/i;
const MULTILINE_COMMENTS_RE = /\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g;
const SINGLELINE_COMMENTS_RE = /\/\/.*/g;
const IMPORTS_RE =
	/(?<!\/\/.*)(?<=^|;|\*\/)\s*import(?!\s+type)(?:[\w*{}\n\r\t, ]+from)?\s*("[^"]+"|'[^']+')\s*(?=$|;|\/\/|\/\*)/gm;

type ScriptLoader = 'js' | 'jsx' | 'ts' | 'tsx';

interface InlineScript {
	content: string;
	loader: ScriptLoader;
}

interface ExtractedScripts {
	imports: string[];
	inline: InlineScript[];
}

/** Preserves scan edges when TypeScript removes imports used only in type positions. */
function extractImportPaths(code: string): string {
	code = code.replace(MULTILINE_COMMENTS_RE, '/* */').replace(SINGLELINE_COMMENTS_RE, '');
	let imports = '';
	let match: RegExpExecArray | null;
	IMPORTS_RE.lastIndex = 0;
	while ((match = IMPORTS_RE.exec(code)) !== null) imports += `\nimport ${match[1]}`;
	return imports;
}

/** Returns external and inline client scripts after removing frontmatter and HTML comments. */
export function extractScripts(raw: string): ExtractedScripts {
	let body = raw.replace(FRONTMATTER_RE, (match) => match.replace(/[^\n]/g, ' '));
	body = body.replace(COMMENT_RE, '<!---->');

	const scripts: ExtractedScripts = { imports: [], inline: [] };
	for (const [, openTag, content] of body.matchAll(SCRIPT_RE)) {
		const typeMatch = TYPE_RE.exec(openTag);
		const type = typeMatch && (typeMatch[1] || typeMatch[2] || typeMatch[3]);
		if (
			type &&
			!(type.includes('javascript') || type.includes('ecmascript') || type === 'module')
		) {
			continue;
		}

		const srcMatch = SRC_RE.exec(openTag);
		if (srcMatch) {
			scripts.imports.push(srcMatch[1] || srcMatch[2] || srcMatch[3]);
		} else if (content.trim()) {
			const langMatch = LANG_RE.exec(openTag);
			const lang = langMatch && (langMatch[1] || langMatch[2] || langMatch[3]);
			const loader = lang === 'jsx' || lang === 'tsx' || lang === 'ts' ? lang : 'ts';
			scripts.inline.push({
				content: content + (loader.startsWith('ts') ? extractImportPaths(content) : ''),
				loader,
			});
		}
	}

	return scripts;
}

interface ScanScript extends InlineScript {
	importer: string;
}

/**
 * Intercepts `.astro` dependency-scan entries because Vite's HTML scanner treats script-like
 * frontmatter text as markup. Each inline script remains a separate module so its scope and loader
 * match Vite's scan behavior.
 *
 * @see https://github.com/withastro/astro/issues/18068
 */
export function rolldownAstroClientScanPlugin(): Plugin {
	const scripts = new Map<string, ScanScript>();
	const scriptsByFile = new Map<string, string[]>();

	return {
		name: 'astro:client-dep-scan',
		async resolveId(source, importer) {
			if (scripts.has(source)) return source;

			const parentScript = importer && scripts.get(importer);
			if (parentScript) {
				return this.resolve(source, parentScript.importer, { skipSelf: true });
			}
		},
		async load(id) {
			const script = scripts.get(id);
			if (script) {
				return { code: script.content, moduleType: script.loader };
			}
			if (!id.endsWith('.astro')) return;

			let raw: string;
			try {
				raw = await readFile(id, 'utf-8');
			} catch {
				return { code: 'export default {}', moduleType: 'ts' };
			}

			for (const scriptId of scriptsByFile.get(id) ?? []) scripts.delete(scriptId);

			const extracted = extractScripts(raw);
			const scriptIds = extracted.inline.map((inlineScript, index) => {
				const scriptId = `${id}?astro-client-dep-scan=${index}&lang.${inlineScript.loader}`;
				scripts.set(scriptId, { ...inlineScript, importer: id });
				return scriptId;
			});
			scriptsByFile.set(id, scriptIds);

			const code = [
				...extracted.imports.map((source) => `import ${JSON.stringify(source)}`),
				...scriptIds.map((scriptId) => `export * from ${JSON.stringify(scriptId)}`),
				'export default {}',
			].join('\n');
			return { code, moduleType: 'ts' };
		},
	};
}
