// @ts-expect-error untyped export
import { createComponent, renderSlot } from 'astro/server/index.js';
import { getFunctionExpression } from './utils';

interface ForEachProps<Item> {
  /** An array or iterable which should be looped over */
  each: Iterable<Item>;
  /** Optionally, the delay in milliseconds between each iteration */
  delay?: number;
  /** A function which recieves each item and its assosciated index in the iterable */
  children: (item: Item, i: number) => any;
}

type ForEach = <Item>(props: ForEachProps<Item>) => any;

/**
 * A flow control utility component which can loop over any iterable
 */
const For = createComponent(async function* (result: any, props: any, slots: any) {
  const fn = getFunctionExpression(slots);
  if (typeof fn !== 'function') throw new Error(`<For> expected a single child function!`);
  let i = 0;
  for (const item of props.each) {
    const markup = await renderSlot(result, fn(item, i++));
    yield markup;

    if ('delay' in props) {
      await new Promise(res => setTimeout(res, props.delay));
    }
  }
}) as ForEach;

export { For };
