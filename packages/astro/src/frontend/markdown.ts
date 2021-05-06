import { renderMarkdown } from '../compiler/utils.js';

/** Remove leading indentation based on first line */
function normalize(ch: string[]) {
  const str = ch.join('')
    .replace(/^\\n+/, '') // remove leading new lines
	let arr = str.match(/^[ \t]*(?=\S)/gm);
	let min = !!arr && Math.min(...arr.map(x => x.length === 0 ? Infinity : x.length));
	return (!arr || !min) ? str : str.replace(new RegExp(`^[ \\t]{${min}}`, 'gm'), '');
}

/** 
  * Functional component which uses Astro's built-in Markdown rendering 
  * to render out its children.
  *
  * Note: the children have already been properly escaped/rendered 
  * by the parser and Astro, so at this point we're just rendering 
  * out plain markdown, no need for JSX support
  */
export default function Markdown(_props: any, ...children: string[]): any {
  const text = normalize(children);
  const { content } = renderMarkdown(text, { mode: '.md' });
  return content;
}
