import { renderToString, ssr, createComponent } from 'solid-js/web/dist/server.js';

function check(Component, props, children) {
  if (typeof Component !== 'function') return false;

  const { html } = renderToStaticMarkup(Component, props, children);
  return typeof html === 'string';
}

function renderToStaticMarkup(Component, props, children) {
  const html = renderToString(() =>
    createComponent(Component, {
      ...props,
      // In Solid SSR mode, `ssr` creates the expected structure for `children`.
      // In Solid client mode, `ssr` is just a stub.
      children: ssr(`<astro-fragment>${children}</astro-fragment>`),
    })
  );
  return { html: html + `<script>window._$HYDRATION||(window._$HYDRATION={events:[],completed:new WeakSet})</script>` };
}

export default {
  check,
  renderToStaticMarkup,
};
