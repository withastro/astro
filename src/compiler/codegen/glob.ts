import path from 'path';
import glob from 'tiny-glob/sync.js';

/**
 * Handling for import.meta.glob and import.meta.globEager
 */

interface GlobOptions {
  namespace: string;
  filename: string;
}

interface GlobResult {
  /** Array of import statements to inject */
  imports: Set<string>;
  /** Replace original code with */
  code: string;
}

/** General glob handling */
function globSearch(spec: string, { filename }: { filename: string }): string[] {
  try {
    let found: string[];
    found = glob(spec, { cwd: path.dirname(filename), filesOnly: true });
    if (!found.length) {
      throw new Error(`No files matched "${spec}" from ${filename}`);
    }
    return found.map((importPath) => {
      if (importPath.startsWith('http') || importPath.startsWith('.')) return importPath;
      return `./` + importPath;
    });
  } catch (err) {
    throw new Error(`No files matched "${spec}" from ${filename}`);
  }
}

/** import.meta.glob() */
export function handleImportGlob(spec: string, { namespace, filename }: GlobOptions): GlobResult {
  let code = '';
  const imports = new Set<string>();
  const importPaths = globSearch(spec, { filename });

  // gather imports
  importPaths.forEach((importPath, j) => {
    const id = `${namespace}_${j}`;
    const url = importPath.replace(/^\./, '').replace(/\.md$/, '');
    imports.add(`${id} = import('${importPath}').then((m) => ({ ...m.__content, url: '${url}' }));`);
  });

  // generate replacement code
  code += `${namespace} = await Promise.all([${importPaths.map((_, j) => `${namespace}_${j}`).join(',')}]);\n`;

  return { imports, code };
}

/** import.meta.globEager */
export function handleImportGlobEager(spec: string, { namespace, filename }: GlobOptions): GlobResult {
  let code = '';
  const imports = new Set<string>();
  const importPaths = globSearch(spec, { filename });

  // gather imports
  importPaths.forEach((importPath, j) => {
    const id = `${namespace}_${j}`;
    const url = importPath.replace(/^\./, '').replace(/\.md$/, '');
    imports.add(`import { __content as ${id} } from '${importPath}';`);
    code += `${id}.url = '${url}';\n`;
  });

  // generate replacement code
  code += `${namespace} = [${importPaths.map((_, j) => `${namespace}_${j}`).join(',')}];\n`;

  return { imports, code };
}
