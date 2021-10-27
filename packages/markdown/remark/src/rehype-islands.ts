import {SKIP, visit} from 'unist-util-visit';

export default function rehypeIslands(): any {
  return function (node: any): any {
    return visit(node, 'element', (el) => {
      // Bugs only happen inside of <astro-root> islands
      if (el.tagName == 'astro-root') {
        visit(el, 'text', (child, index, parent) => {
          if (child.type === 'text') {
            // Sometimes comments can be trapped as text, which causes them to be escaped 
            // This casts them back to real HTML comments
            if (parent && child.value.indexOf('<!--') > -1 && index != null) {
              parent.children.splice(index, 1, { ...child, type: 'comment', value: child.value.replace('<!--', '').replace('-->', '').trim()});
              return [SKIP, index]
            }
            // For some reason `rehype` likes to inject extra linebreaks,
            // but React and Vue throw hydration errors when they see these!
            // This removes any extra linebreaks, which is fine because
            // framework compilers don't preserve them anyway
            child.value = child.value.replace(/\n+/g, '');
            return child;
          }
        })
      }
    });
  };
}
