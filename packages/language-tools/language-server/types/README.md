# Types

**Heads up!** `env.d.ts` and `astro-jsx.d.ts` in this folder are only used as fallback by the language server whenever we're not able to load the real types from the user's project. The types here should be in line with the types from Astro, but only loosely as not being able to load the real types from the user's project is an uncommon situation and some things are not necessarily possible without relying on Astro's internals

As such, if you're making a PR to fix/improve something related to types, you should probably make a PR to [Astro itself](https://github.com/withastro/astro), not this project!
