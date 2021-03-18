import crypto from 'crypto';
import path from 'path';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import postcssModules from 'postcss-modules';
import sass from 'sass';

type StyleType = 'text/css' | 'text/scss' | 'text/sass' | 'text/postcss';

const getStyleType: Map<string, StyleType> = new Map([
  ['.css', 'text/css'],
  ['.pcss', 'text/postcss'],
  ['.sass', 'text/sass'],
  ['.scss', 'text/scss'],
  ['css', 'text/css'],
  ['postcss', 'text/postcss'],
  ['sass', 'text/sass'],
  ['scss', 'text/scss'],
  ['text/css', 'text/css'],
  ['text/postcss', 'text/postcss'],
  ['text/sass', 'text/sass'],
  ['text/scss', 'text/scss'],
]);

const SASS_OPTIONS: Partial<sass.Options> = {
  outputStyle: 'compressed',
};

/** Should be deterministic, given a unique filename */
function hashFromFilename(filename: string): string {
  const hash = crypto.createHash('sha256');
  return hash.update(filename.replace(/\\/g, '/')).digest('base64').toString().substr(0, 8);
}

export async function transformStyle(
  code: string,
  { type, classNames, filename, fileID }: { type?: string; classNames?: Set<string>; filename: string; fileID: string }
): Promise<{ css: string; cssModules: Map<string, string> }> {
  let styleType: StyleType = 'text/css'; // important: assume CSS as default
  if (type) {
    styleType = getStyleType.get(type) || styleType;
  }

  let css = '';
  switch (styleType) {
    case 'text/css': {
      css = code;
      break;
    }
    case 'text/sass':
    case 'text/scss': {
      css = sass
        .renderSync({
          ...SASS_OPTIONS,
          data: code,
          includePaths: [path.dirname(filename)],
        })
        .css.toString('utf8');
      break;
    }
    case 'text/postcss': {
      css = code; // TODO
      break;
    }
    default: {
      throw new Error(`Unsupported: <style type="${styleType}">`);
    }
  }

  const cssModules = new Map<string, string>();

  css = await postcss([
    postcssModules({
      generateScopedName(name: string) {
        if (classNames && classNames.has(name)) {
          return `${name}__${hashFromFilename(fileID)}`;
        }
        return name;
      },
      getJSON(_: string, json: any) {
        Object.entries(json).forEach(([k, v]: any) => {
          if (k !== v) cssModules.set(k, v);
        });
      },
    }),
    autoprefixer(),
  ])
    .process(css, { from: filename })
    .then((result) => result.css);

  return { css, cssModules };
}
