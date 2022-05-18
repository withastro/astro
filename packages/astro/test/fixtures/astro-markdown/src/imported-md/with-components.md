---
setup: |
  import Counter from '../components/Counter.jsx'
  import Hello from '../components/Hello.jsx'
  import SvelteButton from '../components/SvelteButton.svelte'
---

## With components

### Non-hydrated

<Hello name="Astro Naut" />

### Hydrated

<Counter client:load />
<SvelteButton client:load />
