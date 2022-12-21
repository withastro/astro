// @ts-expect-error untyped export
import { createComponent, renderSlot } from 'astro/server/index.js';
import { getFunctionExpression } from './utils';

interface RangeProps {
  /** The number (inclusive) from which to start. Defaults to `0`. */
  from?: number;
  /** The number (inclusive) on which to end. */
  to: number;
  /** Optionally, the delay in milliseconds between each iteration */
  delay?: number;
  /** A function which recieves the current number in the range */
  children: (i: number) => any;
}

type Range = (props: RangeProps) => any;

/**
 * A flow control utility component which loops over a given range of numbers
 */
const Range = createComponent(async function* (result: any, props: any, slots: any) {
  const fn = getFunctionExpression(slots);
  if (typeof fn !== 'function') throw new Error(`<Range> expected a single child function!`);
  for (let i = props.from ?? 0; i < props.to + 1; i++) {
      const markup = await renderSlot(result, fn(i));
      yield markup;
      if ('delay' in props) {
        await new Promise(res => setTimeout(res, props.delay));
      }
  }
}) as Range

export { Range };
