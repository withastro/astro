import { h } from './h';

async function renderToStaticMarkup(tag: string, props: Record<string, any>, children: string) {
  const html = await h(tag, props, Promise.resolve(children));
  return {
    html,
  };
}

export { renderToStaticMarkup };
