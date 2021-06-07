const {
  doc: {
    builders: { concat, hardline },
  },
} = require('prettier');
const { parse } = require('@astrojs/parser');

/** @type {Partial<import('prettier').SupportLanguage>[]} */
module.exports.languages = [
  {
    name: 'astro',
    parsers: ['astro'],
    extensions: ['.astro'],
    vscodeLanguageIds: ['astro'],
  },
];

/** @type {Record<string, import('prettier').Parser>} */
module.exports.parsers = {
  astro: {
    parse: (text) => {
      let { html, css, module: frontmatter } = parse(text);
      html = html ? { ...html, text: text.slice(html.start, html.end), isRoot: true } : null;
      return [frontmatter, html, css].filter((v) => v);
    },
    locStart(node) {
      return node.start;
    },
    locEnd(node) {
      return node.end;
    },
    astFormat: 'astro-ast',
  },
  'astro-expression': {
    parse: (text, parsers) => {
      return { text };
    },
    locStart(node) {
      return node.start;
    },
    locEnd(node) {
      return node.end;
    },
    astFormat: 'astro-expression',
  },
};

const findExpressionsInAST = (node, collect = []) => {
  if (node.type === 'MustacheTag') {
    return collect.concat(node);
  }
  if (node.children) {
    collect.push(...[].concat(...node.children.map((child) => findExpressionsInAST(child))));
  }
  return collect;
};

const formatExpression = ({ expression: { codeChunks, children } }, text, options) => {
  if (children.length === 0) {
    const codeStart = codeChunks[0]; // If no children, there should only exist a single chunk.
    if (codeStart && [`'`, `"`].includes(codeStart[0])) {
      return `<script $ lang="ts">${codeChunks.join('')}</script>`;
    }
    return `{${codeChunks.join('')}}`;
  }

  return `<script $ lang="ts">${text}</script>`;
};

const isAstroScript = (node) => node.type === 'concat' && node.parts[0] === '<script' && node.parts[1].type === 'indent' && node.parts[1].contents.parts.find((v) => v === '$');

const walkDoc = (doc) => {
  let inAstroScript = false;
  const recurse = (node, { parent }) => {
    if (node.type === 'concat') {
      if (isAstroScript(node)) {
        inAstroScript = true;
        parent.contents = { type: 'concat', parts: ['{'] };
      }
      return node.parts.map((part) => recurse(part, { parent: node }));
    }
    if (inAstroScript) {
      if (node.type === 'break-parent') {
        parent.parts = parent.parts.filter((part) => !['break-parent', 'line'].includes(part.type));
      }
      if (node.type === 'indent') {
        parent.parts = parent.parts.map((part) => {
          if (part.type !== 'indent') return part;
          return {
            type: 'concat',
            parts: [part.contents],
          };
        });
      }
      if (typeof node === 'string' && node.endsWith(';')) {
        parent.parts = parent.parts.map((part) => {
          if (typeof part === 'string' && part.endsWith(';')) return part.slice(0, -1);
          return part;
        });
      }
      if (node === '</script>') {
        parent.parts = parent.parts.map((part) => (part === '</script>' ? '}' : part));
        inAstroScript = false;
      }
    }
    if (['group', 'indent'].includes(node.type)) {
      return recurse(node.contents, { parent: node });
    }
  };
  recurse(doc, { parent: null });
};

/** @type {Record<string, import('prettier').Printer>} */
module.exports.printers = {
  'astro-ast': {
    print(path, opts, print) {
      const node = path.getValue();

      if (Array.isArray(node)) return concat(path.map(print));
      if (node.type === 'Fragment') return concat(path.map(print, 'children'));

      return node;
    },
    embed(path, print, textToDoc, options) {
      const node = path.getValue();
      if (node.type === 'Script' && node.context === 'setup') {
        return concat(['---', hardline, textToDoc(node.content, { ...options, parser: 'typescript' }), '---', hardline, hardline]);
      }
      if (node.type === 'Fragment' && node.isRoot) {
        const expressions = findExpressionsInAST(node);
        if (expressions.length > 0) {
          const parts = [].concat(
            ...expressions.map((expr, i, all) => {
              const prev = all[i - 1];
              const start = node.text.slice((prev?.end ?? node.start) - node.start, expr.start - node.start);
              const exprText = formatExpression(expr, node.text.slice(expr.start - node.start + 1, expr.end - node.start - 1), options);

              if (i === all.length - 1) {
                const end = node.text.slice(expr.end - node.start);
                return [start, exprText, end];
              }

              return [start, exprText];
            })
          );
          const html = parts.join('\n');
          const doc = textToDoc(html, { parser: 'html' });
          walkDoc(doc);
          return doc;
        }
        return textToDoc(node.text, { parser: 'html' });
      }

      return null;
    },
  },
};
