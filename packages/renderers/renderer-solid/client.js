import { createComponent } from 'solid-js/web';

export default (element) => (Component, props) => {
  // Solid `createComponent` just returns a DOM node with all reactivity
  // already attached. There's no VDOM, so there's no real need to "mount".
  // Likewise, `children` can just reuse the nearest `astro-fragment` node.
  const comp = createComponent(Component, {
    ...props,
    children: element.querySelector('astro-fragment'),
  });

  element.replaceChildren(comp);
}
