/// @ts-nocheck

/** Utility to check if a nodeList contains a given child */
function containsNode(nodeList: NodeList, child: Node) {
    let contains = false
    for (let i = 0; i < nodeList.length; i++) {
        if (contains) break;
        contains = nodeList.item(i).isSameNode(child);
    }
    return contains;
}

/** Creates a live document fragment to be used as a "virtual" root node */
function createVirtualFragment(parentNode: Node, childNodes: NodeList) {
  const last = childNodes && childNodes[childNodes.length - 1].nextSibling;
  const insert = (child: Node, before?: Node) => {
    try {
        parentNode.insertBefore(child, before || last);
    } catch (e) {}
  }
  const remove = (child: Node) => {
    if (!containsNode(childNodes, child)) return;
    parentNode.removeChild(child);
  }

  const fragment = {
    parentNode,
    firstChild: childNodes.item(0),
    addEventListener: parentNode.addEventListener.bind(parentNode),
    removeEventListener: parentNode.removeEventListener.bind(parentNode),
    childNodes,
    appendChild: insert,
    insertBefore: insert,
    removeChild: remove,
    __astroFragment: true,
    __astro_clear: () => {
      for (const child of childNodes) {
        parentNode.removeChild(child)
      }
    },
  }

  const handler = {
    get: function (_target, prop) {
        if (typeof fragment[prop] === 'undefined') return parentNode[prop];
        return Reflect.get(...arguments);
    },
    set: function() {
        Reflect.set(...arguments);
        return true;
    }
  }

  return new Proxy(fragment, handler);
}

/** Given a list of children, create a virtual hydration root for the framework to mount */
export function createHydrationRoot(children: NodeList) {
  return createVirtualFragment(children[0].parentNode, children);
}
