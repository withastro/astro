export const COUNTER_COMPONENTS = {
	preact: {
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
	react: {
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
	solid: {
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
	svelte: {
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
	vue: {
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

export interface Integration {
	id: string;
	packageName: string;
}

export const FRAMEWORKS: { title: string; value: Integration }[] = [
	{
		title: 'Preact',
		value: { id: 'preact', packageName: '@astrojs/preact' },
	},
	{
		title: 'React',
		value: { id: 'react', packageName: '@astrojs/react' },
	},
	{
		title: 'Solid.js',
		value: { id: 'solid', packageName: '@astrojs/solid-js' },
	},
	{
		title: 'Svelte',
		value: { id: 'svelte', packageName: '@astrojs/svelte' },
	},
	{
		title: 'Vue',
		value: { id: 'vue', packageName: '@astrojs/vue' },
	},
];
