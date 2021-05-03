import { promises as fs, readFileSync } from 'fs';
import { resolve, dirname, sep, join } from 'path';
import arg from 'arg';
import glob from 'globby';
import tar from 'tar';

/** @type {import('arg').Spec} */
const spec = {
  '--tgz': Boolean,
};

export default async function copy() {
  let { _: patterns, ['--tgz']: isCompress } = arg(spec);
  patterns = patterns.slice(1);

  if (isCompress) {
    const files = await glob(patterns, { gitignore: true });
    const rootDir = resolveRootDir(files);
    const destDir = rootDir.replace(/^[^/]+/, 'dist');

    const templates = files.reduce((acc, curr) => {
      const name = curr.replace(rootDir, '').slice(1).split(sep)[0];
      if (acc[name]) {
        acc[name].push(resolve(curr));
      } else {
        acc[name] = [resolve(curr)];
      }
      return acc;
    }, {});

    let meta = {};
    return Promise.all(
      Object.entries(templates).map(([template, files]) => {
        const cwd = resolve(join(rootDir, template));
        const dest = join(destDir, `${template}.tgz`);
        const metafile = files.find((f) => f.endsWith('meta.json'));
        if (metafile) {
          files = files.filter((f) => f !== metafile);
          meta[template] = JSON.parse(readFileSync(metafile).toString());
        }
        return fs.mkdir(dirname(dest), { recursive: true }).then(() =>
          tar.create(
            {
              gzip: true,
              portable: true,
              file: dest,
              cwd,
            },
            files.map((f) => f.replace(cwd, '').slice(1))
          )
        );
      })
    ).then(() => {
      if (Object.keys(meta).length > 0) {
        return fs.writeFile(resolve(destDir, 'meta.json'), JSON.stringify(meta, null, 2));
      }
    });
  }

  const files = await glob(patterns);
  await Promise.all(
    files.map((file) => {
      const dest = resolve(file.replace(/^[^/]+/, 'dist'));
      return fs.mkdir(dirname(dest), { recursive: true }).then(() => fs.copyFile(resolve(file), dest));
    })
  );
}

function resolveRootDir(files) {
  return files
    .reduce((acc, curr) => {
      const currParts = curr.split(sep);
      if (acc.length === 0) return currParts;
      const result = [];
      currParts.forEach((part, i) => {
        if (acc[i] === part) result.push(part);
      });
      return result;
    }, [])
    .join(sep);
}
