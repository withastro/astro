import { h, Fragment } from 'preact';
import VueComponent from './VueComponent.vue?astro&renderer=preact';

export default function() {
  return (
    <Fragment>
      <div>i am preact</div>
      <VueComponent />
    </Fragment>
  );
}