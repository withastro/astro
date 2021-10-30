import type { AstroComponentMetadata, Renderer } from '../../@types/astro-core';
import type { SSRResult, SSRElement } from '../../@types/astro-runtime';
import type { Writable } from 'stream';
import { defineScriptVars, defineStyleVars, spreadAttributes } from './index.js';

export interface AstroComponentFactory {
  (result: any, props: any, slots: any): ReturnType<any>;
  isAstroComponentFactory?: boolean;
}

// Filter out duplicate elements in our set
const uniqueElements = (item: any, index: number, all: any[]) => {
  const props = JSON.stringify(item.props);
  const children = item.children;
  return index === all.findIndex((i) => JSON.stringify(i.props) === props && i.children == children);
};

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

export async function renderPageToStream(res: Writable, result: SSRResult, componentFactory: AstroComponentFactory, props: any, children: any) {
  const component = await componentFactory(result, props, children);
  
  let index = 0;
  let head = 0;
  let rendereredScripts = new Set();
  let rendereredStyles = new Set();
  for await (const value of component) {

    for (const script of result.scripts) {
      if (!rendereredScripts.has(JSON.stringify(script))) {
        if (head === 1) {
          const html = renderElement('script', script)
          res.write(html)
          rendereredScripts.add(JSON.stringify(script));
          result.scripts.delete(script);
        }
      }
    }

    for (const style of result.styles) {
      if (!rendereredStyles.has(JSON.stringify(style))) {
        if (head === 1) {
          const html = renderElement('style', style)
          res.write(html)
          rendereredStyles.add(JSON.stringify(style));
          result.styles.delete(style);
        }
      }
    }

    if (value || value === 0) {
      if (value.indexOf("<head>") > -1 && head === 0) {
        head = 1;
      }
      // res.write()
      res.write(value);

      if (value.indexOf("</head>") > -1 && head === 1) {
        head = 2;
      }
    }
    index++;
  }

  // const styles = Array.from(result.styles)
  //   .filter(uniqueElements)
  //   .map((style) => renderElement('style', style));
  // const scripts = Array.from(result.scripts)
  //   .filter(uniqueElements)
  //   .map((script) => renderElement('script', script));
  return res;
}

function renderElement(name: string, { props: _props, children = '' }: SSRElement) {
  // Do not print `hoist`, `lang`, `global`
  const { lang: _, 'data-astro-id': astroId, 'define:vars': defineVars, ...props } = _props;
  if (defineVars) {
    if (name === 'style') {
      if (props.global) {
        children = defineStyleVars(`:root`, defineVars) + '\n' + children;
      } else {
        children = defineStyleVars(`.astro-${astroId}`, defineVars) + '\n' + children;
      }
      delete props.global;
    }
    if (name === 'script') {
      delete props.hoist;
      children = defineScriptVars(defineVars) + '\n' + children;
    }
  }
  return `<${name}${spreadAttributes(props)}>${children}</${name}>`;
}
