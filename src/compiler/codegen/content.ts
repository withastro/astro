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

/** import.meta.fetchContent() */
export function fetchContent(spec: string, { namespace, filename }: GlobOptions): GlobResult {
  let code = '';
  const imports = new Set<string>();
  const importPaths = globSearch(spec, { filename });

  // gather imports
  importPaths.forEach((importPath, j) => {
    const id = `${namespace}_${j}`;
    imports.add(`import { __content as ${id} } from '${importPath}';`);

    // add URL if this appears within the /pages/ directory (probably can be improved)
    const fullPath = path.resolve(path.dirname(filename), importPath);
    if (fullPath.includes(`${path.sep}pages${path.sep}`)) {
      const url = importPath.replace(/^\./, '').replace(/\.md$/, '');
      imports.add(`${id}.url = '${url}';`);
    }
  });

  // generate replacement code
  code += `${namespace} = [${importPaths.map((_, j) => `${namespace}_${j}`).join(',')}];\n`;

  return { imports, code };
}
