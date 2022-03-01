import { readFileSync } from 'fs';
import { EOL } from 'os';
import { parseAstro } from '../../core/documents/parseAstro';

const ASTRO_DEFINITION_BYTES = readFileSync(require.resolve('../../../astro.d.ts'));
const ASTRO_DEFINITION_STR = ASTRO_DEFINITION_BYTES.toString('utf-8');

function addProps(content: string, dtsContent: string): string {
  let defaultExportType = 'AstroBuiltinProps & Record<string, any>';
  // Using TypeScript to parse here would cause a double-parse, slowing down the extension
  // This needs to be done a different way when the new compiler is added.
  if(/(interface|type) Props/.test(content)) {
    defaultExportType = 'AstroBuiltinProps & Props';
  }
  return dtsContent + EOL + `export default function (_props: ${defaultExportType}) { return <div></div>; }`
}

function escapeTemplateLiteralContent(content: string) {
  return content.replace(/`/g, '\\`');
}

interface Astro2TSXResult {
  code: string;
}

export default function (content: string): Astro2TSXResult {
	let result: Astro2TSXResult = {
		code: '',
	};

	const astroDocument = parseAstro(content);

	// Frontmatter replacements
	let frontMatterRaw = '';
	if (astroDocument.frontmatter.state === 'closed') {
		frontMatterRaw = content
			.substring(astroDocument.frontmatter.startOffset ?? 0, (astroDocument.frontmatter.endOffset ?? 0) + 3)
			// Handle case where semicolons is not used in the frontmatter section
			.replace(/((?!^)(?<!;)\n)(---)/g, (_whole, start, _dashes) => {
				return start + ';' + '//';
			})
			// Replace frontmatter marks with comments
			.replace(/---/g, '///');
	}

	// Content replacement
	const htmlBegin = astroDocument.frontmatter.endOffset ? astroDocument.frontmatter.endOffset + 3 : 0
	let htmlRaw = content
		.substring(htmlBegin)
		// Turn comments into JS comments
		.replace(/<\s*!--([^-->]*)(.*?)-->/gs, (whole) => {
			return `{/*${whole}*/}`;
		})
		// Turn styles into internal strings
		.replace(/<\s*style([^>]*)>(.*?)<\s*\/\s*style>/gs, (_whole, attrs, children) => {
			return `<style${attrs}>{\`${escapeTemplateLiteralContent(children)}\`}</style>`;
		})
		// Turn scripts into function calls
		.replace(/<\s*script([^\/>]*)>(.*?)<\s*\/\s*script>/gs, (_whole, attrs, children, offset) => {
			return `<script${attrs}>{()=>{${children}}}</script>`;
		})
		// Close void elements
		.replace(/<(\s*(meta|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)([^>]*))>/g, (whole, inner) => {
			if (whole.endsWith('/>')) return whole;
			return `<${inner} />`;
		})
		// Replace `@` prefixed attributes with `_` prefix
		.replace(/<([$A-Z_a-z][^\s\/>]*)([^\/>]*)>/g, (whole: string, tag: string, attrs: string) => {
			if (attrs.includes('@')) {
				return `<${tag}${attrs.replace(
					// the following regular expression captures:
					//   $1. any character that may appear before an attribute name (https://html.spec.whatwg.org/#before-attribute-name-state)
					// then, one `@` at sign, then:
					//   $2. any characters that may appear in an attribute name (https://html.spec.whatwg.org/#attribute-name-state)
					// then, looking ahead any one character that may not appear in an attribute name, or the end
					/([\f\n\r\t "'])@([^\f\n\r\t /=>"'<]+)(?=[\f\n\r\t /=>"'<]|$)/g,
					'$1_$2'
				)}>`;
			} else {
				return whole;
			}
		})
		// Fix doctypes
		.replace(/<!(doctype html)>/gi, (_whole, main) => {
			return `<${main.toLowerCase()}/>`;
		});

	result.code =
		frontMatterRaw +
		htmlRaw +
		EOL +
		// Add TypeScript definitions
		addProps(frontMatterRaw, ASTRO_DEFINITION_STR);

	return result;
}
