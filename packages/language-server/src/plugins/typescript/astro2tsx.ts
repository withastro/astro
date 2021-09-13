import { readFileSync } from 'fs';
import { EOL } from 'os';

const ASTRO_DEFINITION_BYTES = readFileSync(require.resolve('../../../astro.d.ts'));
const ASTRO_DEFINITION_STR = ASTRO_DEFINITION_BYTES.toString('utf-8');

function addProps(content: string, dtsContent: string): string {
  let defaultExportType = 'AstroBuiltinProps';
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

export default function(content: string): Astro2TSXResult {
  let result: Astro2TSXResult = {
    code: ''
  };

  // Replace frontmatter marks with comments
  let raw = content
    // Handle case where semicolons is not used in the frontmatter section
    .replace(/((?!^)(?<!;)\n)(---)/g, (_whole, start, _dashes) => {
      return start + ';' + '//';
    })
    .replace(/---/g, '///')
    // Turn comments into JS comments
    .replace(/<\s*!--([^>]*)(.*?)-->/gs, (whole) => {
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
      if(whole.endsWith('/>')) return whole;
      return `<${inner} />`;
    })
    // Fix doctypes
    .replace(/<!(doctype html)>/gi, (_whole, main) => {
      return `<${main.toLowerCase()}/>`;
    });

  result.code = (
    raw + EOL +

    // Add TypeScript definitions
    addProps(raw, ASTRO_DEFINITION_STR)
  );


  return result;
}