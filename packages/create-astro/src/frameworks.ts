export const COUNTER_COMPONENTS = {
	'@astrojs/renderer-preact': {
		filename: `src/components/PreactCounter.jsx`,
		content: `import { useState } from 'preact/hooks';

export default function PreactCounter() {
  const [count, setCount] = useState(0);
  const add = () => setCount((i) => i + 1);
  const subtract = () => setCount((i) => i - 1);

  return (
    <div id="preact" class="counter">
      <button onClick={subtract}>-</button>
      <pre>{count}</pre>
      <button onClick={add}>+</button>
    </div>
  );
}
`,
	},
	'@astrojs/renderer-react': {
		filename: `src/components/ReactCounter.jsx`,
		content: `import { useState } from 'react';

export default function ReactCounter() {
  const [count, setCount] = useState(0);
  const add = () => setCount((i) => i + 1);
  const subtract = () => setCount((i) => i - 1);

  return (
    <div id="react" className="counter">
      <button onClick={subtract}>-</button>
      <pre>{count}</pre>
      <button onClick={add}>+</button>
    </div>
  );
}
`,
	},
	'@astrojs/renderer-solid': {
		filename: `src/components/SolidCounter.jsx`,
		content: `import { createSignal } from "solid-js";

export default function SolidCounter() {
  const [count, setCount] = createSignal(0);
  const add = () => setCount(count() + 1);
  const subtract = () => setCount(count() - 1);

  return (
    <div id="solid" class="counter">
      <button onClick={subtract}>-</button>
      <pre>{count()}</pre>
      <button onClick={add}>+</button>
    </div>
  );
}
`,
	},
	'@astrojs/renderer-svelte': {
		filename: `src/components/SvelteCounter.svelte`,
		content: `<script>
  let count = 0;

  function add() {
    count += 1;
  }

  function subtract() {
    count -= 1;
  }
</script>

<div id="svelte" class="counter">
  <button on:click={subtract}>-</button>
  <pre>{ count }</pre>
  <button on:click={add}>+</button>
</div>
`,
	},
	'@astrojs/renderer-vue': {
		filename: `src/components/VueCounter.vue`,
		content: `<template>
  <div id="vue" class="counter">
      <button @click="subtract()">-</button>
      <pre>{{ count }}</pre>
      <button @click="add()">+</button>
  </div>
</template>

<script>
import { ref } from 'vue';
export default {
  setup() {
    const count = ref(0)
    const add = () => count.value = count.value + 1;
    const subtract = () => count.value = count.value - 1;

    return {
      count,
      add,
      subtract
    }
  }
}
</script>
`,
	},
};

export const FRAMEWORKS = [
	{
		title: 'Preact',
		value: '@astrojs/renderer-preact',
	},
	{
		title: 'React',
		value: '@astrojs/renderer-react',
	},
	{
		title: 'Solid',
		value: '@astrojs/renderer-solid',
	},
	{
		title: 'Svelte',
		value: '@astrojs/renderer-svelte',
	},
	{
		title: 'Vue',
		value: '@astrojs/renderer-vue',
	},
];
