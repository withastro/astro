import {visit, SKIP} from 'unist-util-visit'

// Remove the wrapping paragraph for <astro-root> islands
export default function remarkUnwrap() {
  const astroRootNodes = new Set();
  let insideAstroRoot = false;

  return (tree: any) => {
    // reset state
    insideAstroRoot = false;
    astroRootNodes.clear();

    visit(tree, 'html', (node) => {
      if (node.value.indexOf('<astro-root') > -1 && !insideAstroRoot) {
        insideAstroRoot = true;
      }
      if (node.value.indexOf('</astro-root') > -1 && insideAstroRoot) {
        insideAstroRoot = false;
      }
      astroRootNodes.add(node);
    })

    visit(tree, 'paragraph', (node, index, parent) => {
      if (
        parent &&
        typeof index === 'number' &&
        containsAstroRootNode(node)
      ) {
        parent.children.splice(index, 1, ...node.children)
        return [SKIP, index]
      }
    })
  }

  function containsAstroRootNode(node: any) {
    return node.children.map((child: any) => astroRootNodes.has(child)).reduce((all: boolean, v: boolean) => all ? all : v, false)
  }
}
