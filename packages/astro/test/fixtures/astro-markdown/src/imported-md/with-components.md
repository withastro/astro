---
setup: |
  import Counter from '../components/Counter.jsx'
  import Hello from '../components/Hello.jsx'
---

## With components

### Non-hydrated

<Hello name="Astro Naut" />

### Hydrated

<Counter client:load />
