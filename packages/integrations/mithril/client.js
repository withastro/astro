import m from 'mithril'
import StaticHtml from './static-html.js';

export default (element) =>
	(Component, props, { default: children, ...slotted }, { client }) => {
		for (const [key, value] of Object.entries(slotted)) {
			props[key] = m(StaticHtml, { value, name: key });
		}
    const componentEl = {
      view: () => {
        return m(
          Component, 
          props, 
          children != null ? m(StaticHtml, { value: children }) : children
        )
      }
    }
		if (client === 'only') {
			return m.mount(element, componentEl)
		}
    
    return m.mount(element, componentEl)
	};
