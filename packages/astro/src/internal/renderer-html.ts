import { h } from './h';

async function renderToStaticMarkup(tag: string, props: Record<string, any>, children: string) {
  const html = await h(tag, props, Promise.resolve(children));
  return {
    html
  };
}

export {
  renderToStaticMarkup
};


/*
export function check(Component: any) {
  return Component.isAstroComponent;
}

export async function renderToStaticMarkup(Component: any, props: any, children: string) {
  const html = await Component.__render(props, children);
  return { html };
}

*/