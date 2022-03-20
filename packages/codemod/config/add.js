import { parse, print, visit, types } from 'recast';
import parserTypeScript from 'recast/parsers/typescript.js';
import { fileURLToPath, pathToFileURL } from 'url';
import { readFile, writeFile } from 'fs/promises';
import prettier from 'prettier';

import load from '@proload/core';
import loadTypeScript from '@proload/plugin-tsm';
load.use([loadTypeScript]);

const named = types.namedTypes;
const b = types.builders;

async function format(filePath) {
  const options = await prettier.resolveConfig(filePath);
  const text = await readFile(filePath, { encoding: 'utf-8' });
  const formatted = prettier.format(text, {
    singleQuote: true,
    semi: true,
    ...options,
    parser: 'babel',
  });
  await writeFile(filePath, formatted, { encoding: 'utf-8' });
}

async function codemod(fileURL, callback) {
  const source = await readFile(fileURLToPath(fileURL), {
    encoding: 'utf-8',
  }).then((res) => res.toString());
  const ast = parse(source, { parser: parserTypeScript });

  function ensureFunctionWrapper(name, args) {
    const existingCallExpressions = new Set();
    let p;
    visit(ast, {
      visitExportDefaultDeclaration(path) {
        p = path;
        let decl = path.node.declaration;

        while (true) {
          if (named.CallExpression.check(decl)) {
            const name = decl.callee.name;
            existingCallExpressions.add(name);
            decl = decl.arguments[0];
          } else {
            break;
          }
        }
        return false;
      },
    });
    if (existingCallExpressions.size === 0) {
      const wrapped = b.callExpression(b.identifier(name), [
        p.node.declaration,
      ]);
      p.replace(`export default ${print(wrapped).code}`);
    }
  }

  function ensureImport(value) {
    const existingImports = new Map();
    visit(ast, {
      visitImportDeclaration(path) {
        const value = path.value;
        existingImports.set(value.source.value, path.node);
        return false;
      },
    });
    const {
      program: {
        body: [decl],
      },
    } = parse(value.trim(), { parser: parserTypeScript });
    const pos = ast.program.body.findIndex(
      (node) => !named.ImportDeclaration.check(node)
    );
    const spec = decl.source.value;
    if (!existingImports.has(spec)) {
      ast.program.body.splice(pos, 0, decl);
    } else {
      const oldDecl = existingImports.get(spec);
      const matches = oldDecl.specifiers
        .map((oldSpec) => {
          const match = decl.specifiers.find((newSpec) => {
            if (oldSpec.type !== newSpec.type) return false;
            if (oldSpec.type === 'ImportSpecifier') {
              return oldSpec.imported.name === newSpec.imported.name;
            }
            return true;
          });
          if (match) return [oldSpec, match];
        })
        .filter((x) => x);
      if (matches.length === 0) {
        oldDecl.specifiers.push(...decl.specifiers);
      } else {
        matches.forEach(([oldSpec, newSpec]) => {
          renameGlobalIdent(oldSpec.local, newSpec.local);
        });
      }
    }
  }
  function renameGlobalIdent(oldIdent, newIdent) {
    if (oldIdent.name === newIdent.name) return;
    visit(ast, {
      visitIdentifier(path) {
        if (path.scope.isGlobal && path.node.name === oldIdent.name) {
          path.replace(newIdent);
        }
        return false;
      },
    });
    visit(ast, {
      visitImportSpecifier(path) {
        if (path.node.local.name === path.node.imported.name) {
          const ident = b.identifier(path.node.imported.name);
          path.replace(b.importSpecifier(ident));
        }
        return false;
      },
    });
  }

  function addIntegration(value) {
    const {
      program: {
        body: [stmt],
      },
    } = parse(value.trim(), { parser: parserTypeScript });
    let p, decl;
    visit(ast, {
      visitExportDefaultDeclaration(path) {
        p = path;
        decl = path.node.declaration;

        if (named.CallExpression.check(decl)) {
          while (true) {
            if (named.CallExpression.check(decl.arguments[0])) {
              decl = decl.arguments[0];
            } else {
              decl = decl.arguments[0];
              break;
            }
          }
        }

        const properties = decl.properties;
        const integrations = properties.find(
          (prop) => prop.key.name === 'integrations'
        );
        if (integrations && named.ArrayExpression.check(integrations.value)) {
          let exists = false;
          for (const value of integrations.value.elements) {
            if (
              named.CallExpression.check(value) &&
              value.callee.name === stmt.expression.callee.name
            ) {
              exists = true;
              break;
            }
          }
          if (!exists) {
            integrations.value.elements.push(stmt.expression);
          }
        } else {
          decl.properties.push(
            b.objectProperty(
              b.identifier('integrations'),
              b.arrayExpression([stmt.expression])
            )
          );
        }

        return false;
      },
    });
  }

  return callback({
    ensureImport,
    ensureFunctionWrapper,
    addIntegration,
  }).then(() =>
    writeFile(fileURLToPath(fileURL), print(ast).code, {
      encoding: 'utf-8',
    }).then(() => format(fileURLToPath(fileURL)))
  );
}

export async function addIntegrationToConfig({ name, package: pkg, args }) {
  const response = await load('astro', { mustExist: false });
  if (!response) return;
  const { filePath } = response;
  const fileURL = pathToFileURL(filePath);
  return codemod(
    fileURL,
    async ({ ensureImport, ensureFunctionWrapper, addIntegration }) => {
      ensureImport('import { defineConfig } from "astro/config";');
      ensureImport(`import ${name} from "${pkg}";`);
      addIntegration(`${name}(${args ? JSON.stringify(args) : ''})`);
      ensureFunctionWrapper('defineConfig');
    }
  );
}
