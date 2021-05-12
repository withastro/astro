import path from 'path';
import { fdir, PathsOutput } from 'fdir';
import { fileURLToPath } from 'url';
import slash from 'slash';

/**
 * Handling for import.meta.glob and import.meta.globEager
 */

interface GlobOptions {
  namespace: string;
  filename: string;
  projectRoot: URL;
}

interface GlobResult {
  /** Array of import statements to inject */
  imports: Set<string>;
  /** Replace original code with */
  code: string;
}

const crawler = new fdir();

/** General glob handling */
function globSearch(spec: string, { filename }: { filename: string }): string[] {
  try {
    // Note: fdir’s glob requires you to do some work finding the closest non-glob folder.
    // For example, this fails: .glob("./post/*.md").crawl("/…/src/pages") ❌
    //       …but this doesn’t: .glob("*.md").crawl("/…/src/pages/post")   ✅
    let globDir = '';
    let glob = spec;
    for (const part of spec.split('/')) {
      if (!part.includes('*')) {
        // iterate through spec until first '*' is reached
        globDir = path.posix.join(globDir, part); // this must be POSIX-style
        glob = glob.replace(`${part}/`, ''); // move parent dirs off spec, and onto globDir
      } else {
        // at first '*', exit
        break;
      }
    }

    const cwd = path.join(path.dirname(filename), globDir.replace(/\//g, path.sep)); // this must match OS (could be '/' or '\')
    let found = crawler.glob(glob).crawlWithOptions(cwd, { includeBasePath: true }).sync() as PathsOutput;
    if (!found.length) {
      throw new Error(`No files matched "${spec}" from ${filename}`);
    }
    return found.map((importPath) => {
      if (importPath.startsWith('http') || importPath.startsWith('.')) return importPath;
      return './' + path.posix.join(globDir, path.posix.relative(slash(cwd), importPath));
    });
  } catch (err) {
    throw new Error(`No files matched "${spec}" from ${filename}`);
  }
}

/** Astro.fetchContent() */
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
