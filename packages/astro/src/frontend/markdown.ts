import { renderMarkdown } from '../compiler/utils.js';

/**
 * Functional component which uses Astro's built-in Markdown rendering
 * to render out its children.
 *
 * Note: the children have already been properly escaped/rendered
 * by the parser and Astro, so at this point we're just rendering
 * out plain markdown, no need for JSX support
 */
export default async function Markdown(props: { $scope: string | null }, ...children: string[]): Promise<string> {
  const { $scope = null } = props ?? {};
  const text = dedent(children.join('').trimEnd());
  let { content } = await renderMarkdown(text, { $: { scopedClassName: $scope } });
  if (content.split('<p>').length === 2) {
    content = content.replace(/^\<p\>/i, '').replace(/\<\/p\>$/i, '');
  }
  return content;
}

/** Remove leading indentation based on first line */
function dedent(str: string) {
  let arr = str.match(/^[ \t]*(?=\S)/gm);
  let first = !!arr && arr.find((x) => x.length > 0)?.length;
  return !arr || !first ? str : str.replace(new RegExp(`^[ \\t]{0,${first}}`, 'gm'), '');
}
