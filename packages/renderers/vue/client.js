import { h, createSSRApp } from 'vue';
import StaticHtml from './static-html.js';

export default (element) => (Component, props, children) => {
    const app = createSSRApp({ render: () => h(Component, props, { default: () => h(StaticHtml, { value: children }) })});
    app.mount(element, true);
};
