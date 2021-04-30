/* eslint-disable */
// @ts-nocheck
// TODO: don't precompile this, but it works for now
import {
  HtmlTag,
  SvelteComponentDev,
  assign,
  claim_component,
  create_component,
  destroy_component,
  detach_dev,
  dispatch_dev,
  empty,
  exclude_internal_props,
  get_spread_object,
  get_spread_update,
  init,
  insert_dev,
  mount_component,
  noop,
  not_equal,
  transition_in,
  transition_out,
  validate_slots,
} from 'svelte/internal';

const file = 'App.svelte';

// (5:0) <Component {...props}>
function create_default_slot(ctx) {
  let html_tag;
  let html_anchor;

  const block = {
    c: function create() {
      html_anchor = empty();
      this.h();
    },
    l: function claim(nodes) {
      html_anchor = empty();
      this.h();
    },
    h: function hydrate() {
      html_tag = new HtmlTag(html_anchor);
    },
    m: function mount(target, anchor) {
      html_tag.m(/*__astro_children*/ ctx[1], target, anchor);
      insert_dev(target, html_anchor, anchor);
    },
    p: noop,
    d: function destroy(detaching) {
      if (detaching) detach_dev(html_anchor);
      if (detaching) html_tag.d();
    },
  };

  dispatch_dev('SvelteRegisterBlock', {
    block,
    id: create_default_slot.name,
    type: 'slot',
    source: '(5:0) <Component {...props}>',
    ctx,
  });

  return block;
}

function create_fragment(ctx) {
  let component;
  let current;
  const component_spread_levels = [/*props*/ ctx[2]];

  let component_props = {
    $$slots: { default: [create_default_slot] },
    $$scope: { ctx },
  };

  for (let i = 0; i < component_spread_levels.length; i += 1) {
    component_props = assign(component_props, component_spread_levels[i]);
  }

  component = new /*Component*/ ctx[0]({ props: component_props, $$inline: true });

  const block = {
    c: function create() {
      create_component(component.$$.fragment);
    },
    l: function claim(nodes) {
      claim_component(component.$$.fragment, nodes);
    },
    m: function mount(target, anchor) {
      mount_component(component, target, anchor);
      current = true;
    },
    p: function update(ctx, [dirty]) {
      const component_changes = dirty & /*props*/ 4 ? get_spread_update(component_spread_levels, [get_spread_object(/*props*/ ctx[2])]) : {};

      if (dirty & /*$$scope*/ 16) {
        component_changes.$$scope = { dirty, ctx };
      }

      component.$set(component_changes);
    },
    i: function intro(local) {
      if (current) return;
      transition_in(component.$$.fragment, local);
      current = true;
    },
    o: function outro(local) {
      transition_out(component.$$.fragment, local);
      current = false;
    },
    d: function destroy(detaching) {
      destroy_component(component, detaching);
    },
  };

  dispatch_dev('SvelteRegisterBlock', {
    block,
    id: create_fragment.name,
    type: 'component',
    source: '',
    ctx,
  });

  return block;
}

function instance($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  validate_slots('App', slots, []);
  const { __astro_component: Component, __astro_children, ...props } = $$props;

  $$self.$$set = ($$new_props) => {
    $$invalidate(3, ($$props = assign(assign({}, $$props), exclude_internal_props($$new_props))));
  };

  $$self.$capture_state = () => ({ Component, __astro_children, props });

  $$self.$inject_state = ($$new_props) => {
    $$invalidate(3, ($$props = assign(assign({}, $$props), $$new_props)));
  };

  if ($$props && '$$inject' in $$props) {
    $$self.$inject_state($$props.$$inject);
  }

  $$props = exclude_internal_props($$props);
  return [Component, __astro_children, props];
}

class App extends SvelteComponentDev {
  constructor(options) {
    super(options);
    init(this, options, instance, create_fragment, not_equal, {});

    dispatch_dev('SvelteRegisterComponent', {
      component: this,
      tagName: 'App',
      options,
      id: create_fragment.name,
    });
  }
}

export default App;
