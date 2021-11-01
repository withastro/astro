import { parse } from 'acorn';
import { walk } from 'estree-walker';
import MagicString from 'magic-string';

/**
 * Determine if Vite is in SSR mode based on options
 * https://github.com/vitejs/vite/discussions/5109#discussioncomment-1450726
 *
 * @param options boolean | { ssr: boolean }
 * @returns boolean
 */
function isSSR(options) {
  if (options === undefined) {
    return false;
  }
  if (typeof options === 'boolean') {
    return options;
  }
  if (typeof options == 'object') {
    return !!options.ssr;
  }
  return false;
}

// This matches any JS-like file (that we know of)
// See https://regex101.com/r/Cgofir/1
const SUPPORTED_FILES = /\.([cm]?js|jsx|[cm]?ts|tsx)$/;
const IGNORED_MODULES = [/astro\/dist\/runtime\/server/, /\/renderer-lit\/server/, /\/@lit\//];

function scanForTagName(code) {
  const ast = parse(code, {
    sourceType: 'module'
  })

  let tagName;
  walk(ast, {
    enter(node, parent) {
      if (tagName) {
        return this.skip();
      }
      // Matches `customElement("my-component")`, which is Lit's @customElement("my-component") decorator
      if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'customElement') {
        const arg = node.arguments[0];
        if (arg.type === 'Literal') {
          tagName = arg.raw
        }
      }
      // Matches `customElements.define("my-component", thing)`
      if (node.type === 'MemberExpression' && node.object.name === 'customElements' && node.property.name === 'define') {
        const arg = parent.arguments[0];
        if (arg.type === 'Literal') {
          tagName = arg.raw
        } else {
          tagName = arg.name
        }
      }
    }
  })

  return tagName;
}

/**
 * @returns {import('vite').Plugin}
 */
export default function pluginLit() {
  return {
    name: '@astrojs/vite-plugin-lit',
    enforce: 'post',
    async transform(code, id, opts) {
      const ssr = isSSR(opts);
      // If this isn't an SSR pass, `fetch` will already be available!
      if (!ssr) {
        return null;
      }
      // Only transform JS-like files
      if (!id.match(SUPPORTED_FILES)) {
        return null;
      }
      // Optimization: only run on probable matches
      if (!code.includes('customElement') && !code.includes('lit')) {
        return null;
      }
      // Ignore specific modules
      for (const ignored of IGNORED_MODULES) {
        if (id.match(ignored)) {
          return null;
        }
      }

      const tagName = scanForTagName(code);
      if (!tagName) {
        return null;
      }
    
      const s = new MagicString(code);
      s.append(`export const __astroTagName = ${tagName};`);
      const result = s.toString();
      const map = s.generateMap({
        source: id,
        includeContent: true,
      });
      return { code: result, map };
    },
  };
}
