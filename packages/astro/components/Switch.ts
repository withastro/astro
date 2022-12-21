// @ts-expect-error untyped export
import { createComponent, renderSlot } from 'astro/server/index.js';

interface CaseProps {
  /** The comparator */
  is?: any;
}

/** A specific switch case */
const Case = createComponent(function (result: any, props: any, slots: any) {
    return renderSlot(result, slots['default'])
}) as (props: CaseProps) => any;

/** The default switch case */
const Default = createComponent(function (result: any, props: any, slots: any) {
    return renderSlot(result, slots['default'])
}) as (props: { children: any }) => any;

interface SwitchProps {
  /** The value to be compared. If not included, this component acts like `switch (true) {}`*/
  on?: any;
}

/**
 * A flow control utility component that acts like a native JavaScript `switch` statement
 */
const Switch = createComponent(function (result: any, props: SwitchProps, slots: any) {
  const components = slots['default'].expressions;
  for (const component of components) {
    if ('on' in props && props.on === component.props.is) {
        return component;
    } else if (!('on' in props) && component.props.is === true) {
        return component;
    } else if (component.factory === Default) {
        return component;
    }
  }
}) as (props: SwitchProps) => any;

export { Switch, Case, Default };
