import { promises as fs } from 'node:fs';
import { parse, HTMLElement } from 'node-html-parser';

const addTailSlash = (s: string) => (s.endsWith('/') ? s : s + '/');
const removeHeadingSlash = (s: string) => s.replace(/^\/+/, '');
const removeTrailingSlash = (s: string) => s.replace(/\/+$/, '');

const getFileDir = (pathname: string) => {
  const name = addTailSlash(pathname);
  const file = name === '404/' ? '404.html' : `${name}index.html`;
  return removeHeadingSlash(file);
};

const getFileFile = (pathname: string) => (pathname ? `${removeTrailingSlash(pathname)}.html` : 'index.html');

export async function processPages(pages: { pathname: string }[], dir: URL, headHTML: string, buildFormat: string) {
  if (pages.length === 0) {
    return;
  }
  if (buildFormat !== 'directory' && buildFormat !== 'file') {
    throw new Error(`Unsupported build.format: '${buildFormat}' in your astro.config`);
  }

  for (const page of pages) {
    const fileUrl = new URL(buildFormat === 'directory' ? getFileDir(page.pathname) : getFileFile(page.pathname), dir);

    const html = await fs.readFile(fileUrl, 'utf-8');
    const root = parse(html);
    let head = root.querySelector('head');
    if (!head) {
      head = new HTMLElement('head', {}, '', root);
      root.appendChild(head);
      console.warn(`No <head> found in \`${fileUrl.pathname}\`. <head> will be created.`);
    }
    head.innerHTML = head.innerHTML + headHTML;
    const inlined = root.toString();
    await fs.writeFile(fileUrl, inlined, 'utf-8');
  }
}
