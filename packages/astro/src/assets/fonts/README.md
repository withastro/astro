# fonts

Here is an overview of the architecture of the fonts in Astro:

- [`orchestrate()`](./orchestrate.ts) combines sub steps and takes care of getting useful data from the config
  - It resolves font families (eg. import remote font providers)
  - It prepares [`unifont`](https://github.com/unjs/unifont) providers
  - It initializes `unifont`
  - For each family, it resolves fonts data and normalizes them
  - For each family, optimized fallbacks (and related CSS) are generated if applicable
  - It returns the data
- [`/logic`](./logic/) contains the sub steps of `orchestrate()` so they can be easily tested
- The logic uses [inversion of control](https://en.wikipedia.org/wiki/Inversion_of_control) to make it easily testable and swappable
  - [`definitions.ts`](./definitions.ts) defines dependencies
  - Those dependencies are implemented in [`/implementations`](./implementations/)
- [`fontsPlugin()`](./vite-plugin-fonts.ts) calls `orchestrate()` and using its result, setups anything required so that fonts can
  - Be exposed to users (virual module)
  - Be used in dev (middleware)
  - Be used in build (copy)
- [`<Font />`](../../../components/Font.astro) is managed in [`assets()`](../vite-plugin-assets.ts) so it can be imported from `astro:assets` and consumes the virtual module
