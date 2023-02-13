import m from 'mithril';
import render from 'mithril-node-render'
import StaticHtml from './static-html.js';

const slotName = (str) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());

async function check(Component, props, children) {
	// Note: Mithril can use function, object and class components so the best
  // way to check if the Component is valid is to try rendering it
	let error = null;
	let isMithrilComponent = false;
	function Tester(...args) {
		try {
      const vnode = m(Component, args)
      // If mithril doesn't throw an error, we know it can render the Component
      isMithrilComponent = true;
		} catch (err) {
			error = err;
		}

    return m('div')
	}

	await renderToStaticMarkup(Tester, props, children, {});

	if (error) {
		throw error;
	}

  return isMithrilComponent;
}

async function renderToStaticMarkup(Component, props, { default: children, ...slotted }, metadata) {
	delete props['class'];
	const slots = {};
	for (const [key, value] of Object.entries(slotted)) {
		const name = slotName(key);
		slots[name] = m(StaticHtml, { value, name });
	}
	// Note: create newProps to avoid mutating `props` before they are serialized
	const newProps = {
		...props,
		...slots,
	};
	const newChildren = children ?? props.children;
	if (newChildren != null) {
		newProps.children = m(StaticHtml, { value: newChildren });
	}
	
  let html;
  html = render.sync({
    view: () => {
      return m(Component, newProps, newProps.children)
    }
  })
  return { html }
}

export default {
	check,
	renderToStaticMarkup,
};
