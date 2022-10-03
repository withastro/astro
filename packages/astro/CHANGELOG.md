# astro

## 1.4.4

### Patch Changes

- [#4967](https://github.com/withastro/astro/pull/4967) [`e6a881081`](https://github.com/withastro/astro/commit/e6a881081f456b83294e1d85179b20951d7677e9) Thanks [@matthewp](https://github.com/matthewp)! - Final perf fix from 1.3.0 regression

  A regression in rendering perf happened in 1.3.0. This is the final fix for the underlying issue.

## 1.4.3

### Patch Changes

- [#4956](https://github.com/withastro/astro/pull/4956) [`ee8dd424f`](https://github.com/withastro/astro/commit/ee8dd424fda90688ff3f3ed4e736fb6151d9b422) Thanks [@matthewp](https://github.com/matthewp)! - Fix perf regression in SSR

- [#4952](https://github.com/withastro/astro/pull/4952) [`5bcd76e3a`](https://github.com/withastro/astro/commit/5bcd76e3ab3dfaab1d84d0af46d7e5a55a2b6ce2) Thanks [@bluwy](https://github.com/bluwy)! - Refactor ViteConfigWithSSR type

## 1.4.2

### Patch Changes

- [#4932](https://github.com/withastro/astro/pull/4932) [`9898088c0`](https://github.com/withastro/astro/commit/9898088c0a976da2cbf7607d92e5daf5db6a4536) Thanks [@matthewp](https://github.com/matthewp)! - Prevent hydration mismatch in streaming SSR

- [#4939](https://github.com/withastro/astro/pull/4939) [`cf2bba1e4`](https://github.com/withastro/astro/commit/cf2bba1e4a32ff7d424cc1c4954d6328167af8d7) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix MDX error handling, preventing a memory leak

## 1.4.1

### Patch Changes

- [#4928](https://github.com/withastro/astro/pull/4928) [`7690849a8`](https://github.com/withastro/astro/commit/7690849a87a7e192e28119211b75446ddbbc2ae3) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix module definition of Markdown and MDX files not being available outside Astro files

## 1.4.0

### Minor Changes

- [#4907](https://github.com/withastro/astro/pull/4907) [`01c1aaa00`](https://github.com/withastro/astro/commit/01c1aaa00397c7fdc7a3ef7fb0212eb43aad6238) Thanks [@matthewp](https://github.com/matthewp)! - Order Astro styles last, to override imported styles

  This fixes CSS ordering so that imported styles are placed _higher_ than page/component level styles. This means that if you do:

  ```astro
  ---
  import '../styles/global.css';
  ---

  <style>
    body {
      background: limegreen;
    }
  </style>
  ```

  The `<style>` defined in this component will be placed _below_ the imported CSS. When compiled for production this will result in something like this:

  ```css
  /* /src/styles/global.css */
  body {
    background: blue;
  }

  /* /src/pages/index.astro */
  body:where(.astro-12345) {
    background: limegreen;
  }
  ```

  Given Astro's 0-specificity hashing, this change effectively makes it so that Astro styles "win" when they have the same specificity as global styles.

- [#4876](https://github.com/withastro/astro/pull/4876) [`d3091f89e`](https://github.com/withastro/astro/commit/d3091f89e92fcfe1ad48daca74055d54b1c853a3) Thanks [@matthewp](https://github.com/matthewp)! - Adds the Astro.cookies API

  `Astro.cookies` is a new API for manipulating cookies in Astro components and API routes.

  In Astro components, the new `Astro.cookies` object is a map-like object that allows you to get, set, delete, and check for a cookie's existence (`has`):

  ```astro
  ---
  type Prefs = {
    darkMode: boolean;
  };

  Astro.cookies.set<Prefs>(
    'prefs',
    { darkMode: true },
    {
      expires: '1 month',
    }
  );

  const prefs = Astro.cookies.get<Prefs>('prefs').json();
  ---

  <body data-theme={prefs.darkMode ? 'dark' : 'light'}></body>
  ```

  Once you've set a cookie with Astro.cookies it will automatically be included in the outgoing response.

  This API is also available with the same functionality in API routes:

  ```js
  export function post({ cookies }) {
    cookies.set('loggedIn', false);

    return new Response(null, {
      status: 302,
      headers: {
        Location: '/login',
      },
    });
  }
  ```

  See [the RFC](https://github.com/withastro/rfcs/blob/main/proposals/0025-cookie-management.md) to learn more.

### Patch Changes

- [#4897](https://github.com/withastro/astro/pull/4897) [`fd9d323a6`](https://github.com/withastro/astro/commit/fd9d323a68c0f0cbb3b019e0a05e2c33450f3d33) Thanks [@bluwy](https://github.com/bluwy)! - Support Vue JSX

- [#4892](https://github.com/withastro/astro/pull/4892) [`ff7ba0ee0`](https://github.com/withastro/astro/commit/ff7ba0ee0fd652a92f5d06d9b644dd646cebe65c) Thanks [@matthewp](https://github.com/matthewp)! - Prevent multiple rendering of head content

- [#4842](https://github.com/withastro/astro/pull/4842) [`812658ad2`](https://github.com/withastro/astro/commit/812658ad2ab3732a99e35c4fd903e302e723db46) Thanks [@bluwy](https://github.com/bluwy)! - Add missing dependencies, support strict dependency installation (e.g. pnpm)

- [#4891](https://github.com/withastro/astro/pull/4891) [`87a7cf48e`](https://github.com/withastro/astro/commit/87a7cf48e7198ab94aa6310e58e9f30fd234c429) Thanks [@matthewp](https://github.com/matthewp)! - Hoist hydration scripts out of slot templates

- Updated dependencies [[`812658ad2`](https://github.com/withastro/astro/commit/812658ad2ab3732a99e35c4fd903e302e723db46), [`812658ad2`](https://github.com/withastro/astro/commit/812658ad2ab3732a99e35c4fd903e302e723db46)]:
  - @astrojs/markdown-remark@1.1.3
  - @astrojs/telemetry@1.0.1

## 1.3.1

### Patch Changes

- [#4861](https://github.com/withastro/astro/pull/4861) [`42fe8e0c7`](https://github.com/withastro/astro/commit/42fe8e0c7f40ebb9b81f29501a18969c6f335c41) Thanks [@rishi-raj-jain](https://github.com/rishi-raj-jain)! - use const instead of let for define:vars

- [#4878](https://github.com/withastro/astro/pull/4878) [`90c207299`](https://github.com/withastro/astro/commit/90c2072990952ff0331e8728e74abbcacc355fbf) Thanks [@rishi-raj-jain](https://github.com/rishi-raj-jain)! - add warning for post routes called when output is not server

- [#4855](https://github.com/withastro/astro/pull/4855) [`49ca9e129`](https://github.com/withastro/astro/commit/49ca9e1291616b0cbe5544ae451ea6d1c79ba93b) Thanks [@matthewp](https://github.com/matthewp)! - Fix TS errors when not using skipLibCheck

- [#4845](https://github.com/withastro/astro/pull/4845) [`3389f0ce9`](https://github.com/withastro/astro/commit/3389f0ce919dad14b15613f9ca24449ae02ab2e0) Thanks [@matthewp](https://github.com/matthewp)! - Prevent the root folder from being deleted during the build

- [#4841](https://github.com/withastro/astro/pull/4841) [`4b092269c`](https://github.com/withastro/astro/commit/4b092269c1f1c11327d7f61a8b543066b178f7ef) Thanks [@rishi-raj-jain](https://github.com/rishi-raj-jain)! - copy assets even if outDir is out of process.cwd()

- [#4849](https://github.com/withastro/astro/pull/4849) [`ee5fdeffd`](https://github.com/withastro/astro/commit/ee5fdeffddfee32a0d7708bbf6b64cee50e82aa7) Thanks [@rishi-raj-jain](https://github.com/rishi-raj-jain)! - append .html to the file URL in case build.format says file

- [#4867](https://github.com/withastro/astro/pull/4867) [`03e8b750a`](https://github.com/withastro/astro/commit/03e8b750ada926cca53d755947fc422e77285fb9) Thanks [@rishi-raj-jain](https://github.com/rishi-raj-jain)! - check if class:list's value is defined before converting

- [#4873](https://github.com/withastro/astro/pull/4873) [`83ed1cc1f`](https://github.com/withastro/astro/commit/83ed1cc1f20411ec876757f199cc0a1f182f2a80) Thanks [@bluwy](https://github.com/bluwy)! - Prevent /undefined catch-all routes in dev

- [#4454](https://github.com/withastro/astro/pull/4454) [`6a1a17dd2`](https://github.com/withastro/astro/commit/6a1a17dd28d884eb23faf2f2894fb66aff86acdc) Thanks [@bluwy](https://github.com/bluwy)! - Allow HMR for internal e2e tests

- [#4712](https://github.com/withastro/astro/pull/4712) [`17dbc6701`](https://github.com/withastro/astro/commit/17dbc670186188ba418a1c8842d9349ee557fa2a) Thanks [@Lifeni](https://github.com/Lifeni)! - Fix slashes for paths containing non-ASCII characters on Windows

- [#4850](https://github.com/withastro/astro/pull/4850) [`edb7bead6`](https://github.com/withastro/astro/commit/edb7bead6e42b463dce0f6837ea78ae733eab88b) Thanks [@rishi-raj-jain](https://github.com/rishi-raj-jain)! - add support for changing mode via CLI

- [#4868](https://github.com/withastro/astro/pull/4868) [`b99f9902b`](https://github.com/withastro/astro/commit/b99f9902b7ef90f2cb537b0204e41317c9f6ea83) Thanks [@rishi-raj-jain](https://github.com/rishi-raj-jain)! - remove all the ssr generated folders in static build if only empty

- Updated dependencies [[`5e4c5252b`](https://github.com/withastro/astro/commit/5e4c5252bd80cbaf6a7ee4d4503ece007664410f)]:
  - @astrojs/webapi@1.1.0

## 1.3.0

### Minor Changes

- [#4775](https://github.com/withastro/astro/pull/4775) [`b0cc93996`](https://github.com/withastro/astro/commit/b0cc93996169fe8a52a7b1119ce2180ae6101e70) Thanks [@tony-sull](https://github.com/tony-sull)! - Adds a new "astro:build:generated" hook that runs after SSG builds finish but **before** build artifacts are cleaned up. This is a very specific use case, "astro:build:done" is probably what you're looking for.

- [#4669](https://github.com/withastro/astro/pull/4669) [`a961aa3c2`](https://github.com/withastro/astro/commit/a961aa3c2fa946898fd209dfc70a7b5472b60817) Thanks [@aggre](https://github.com/aggre)! - astro-island now correctly passes Uint8Array/Uint16Array/Uint32Array

- [#4832](https://github.com/withastro/astro/pull/4832) [`73f215df7`](https://github.com/withastro/astro/commit/73f215df76d238a5ce0cb0e64543af032f468773) Thanks [@matthewp](https://github.com/matthewp)! - Allows Responses to be passed to set:html

  This expands the abilities of `set:html` to ultimate service this use-case:

  ```astro
  <div set:html={fetch('/legacy-post.html')}></div>
  ```

  This means you can take a legacy app that has been statically generated to HTML and directly consume that HTML within your templates. As is always the case with `set:html`, this should only be used on trusted content.

  To make this possible, you can also pass several other types into `set:html` now:

  - `Response` objects, since that is what fetch() returns:
    ```astro
    <div
      set:html={new Response('<span>Hello world</span>', {
        headers: { 'content-type': 'text/html' },
      })}
    >
    </div>
    ```
  - `ReadableStream`s:
    ```astro
    <div
      set:html={new ReadableStream({
        start(controller) {
          controller.enqueue(`<span>read me</span>`);
          controller.close();
        },
      })}
    >
    </div>
    ```
  - `AsyncIterable`s:
    ```astro
    <div
      set:html={(async function* () {
        for await (const num of [1, 2, 3, 4, 5]) {
          yield `<li>${num}</li>`;
        }
      })()}
    >
    </div>
    ```
  - `Iterable`s (non-async):
    ```astro
    <div
      set:html={(function* () {
        for (const num of [1, 2, 3, 4, 5]) {
          yield `<li>${num}</li>`;
        }
      })()}
    >
    </div>
    ```

### Patch Changes

- [#4831](https://github.com/withastro/astro/pull/4831) [`29b29e6a8`](https://github.com/withastro/astro/commit/29b29e6a8a54f6ed764e57bb97f1799657d39be7) Thanks [@yuhang-dong](https://github.com/yuhang-dong)! - Update vite-jsx-plugin for jsx export

- [#4754](https://github.com/withastro/astro/pull/4754) [`baae1b3fd`](https://github.com/withastro/astro/commit/baae1b3fd10cf0a74e880c0e0552ba8d58f24453) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Update `astro check` to latest version of the language server

- [#4509](https://github.com/withastro/astro/pull/4509) [`a0619f086`](https://github.com/withastro/astro/commit/a0619f08699de34f1d4c3da8020ac9a9ad3b9ff9) Thanks [@bluwy](https://github.com/bluwy)! - Refactor server url logs

## 1.2.8

### Patch Changes

- [#4813](https://github.com/withastro/astro/pull/4813) [`be9eaa069`](https://github.com/withastro/astro/commit/be9eaa069287d16ac8efc69e13407a5dfa5e5808) Thanks [@bluwy](https://github.com/bluwy)! - Allow override `vite.build.target`

- [#4817](https://github.com/withastro/astro/pull/4817) [`a49bc2f02`](https://github.com/withastro/astro/commit/a49bc2f02e8fa6c3e26e73d28a1c9c0e40da082a) Thanks [@mohammed-elhaouari](https://github.com/mohammed-elhaouari)! - fix parsing integration names with astro add command

- [#4819](https://github.com/withastro/astro/pull/4819) [`518e8f7e2`](https://github.com/withastro/astro/commit/518e8f7e25e03df7bdc9323cc26ea19c6b5e6d8c) Thanks [@matthewp](https://github.com/matthewp)! - Allow passing promises to set:html

- [#4807](https://github.com/withastro/astro/pull/4807) [`44fa37818`](https://github.com/withastro/astro/commit/44fa378186d711f8efab2135247ffde980e94795) Thanks [@lucacasonato](https://github.com/lucacasonato)! - Remove explicit `Transfer-Encoding: chunked` header from streaming responses

- [#4803](https://github.com/withastro/astro/pull/4803) [`f53d97d56`](https://github.com/withastro/astro/commit/f53d97d56be809a4c4a7f7d7ad79a22b36d8cd28) Thanks [@Enteleform](https://github.com/Enteleform)! - replaces hard-coded `minify` values with `vite.build.minify`

- Updated dependencies [[`df54595a8`](https://github.com/withastro/astro/commit/df54595a8836448a621fceeb38fbaacde1bb27cf)]:
  - @astrojs/markdown-remark@1.1.2

## 1.2.7

### Patch Changes

- [#4802](https://github.com/withastro/astro/pull/4802) [`cf5ed5f3a`](https://github.com/withastro/astro/commit/cf5ed5f3a87ea7b3a7ac6b9dd5a8659e41084ce1) Thanks [@bluwy](https://github.com/bluwy)! - Update Vite 3.1.3

- [#4782](https://github.com/withastro/astro/pull/4782) [`8f9463e07`](https://github.com/withastro/astro/commit/8f9463e07f23f0b617ca420852acf7af5f3d04ef) Thanks [@matthewp](https://github.com/matthewp)! - Fixes client:only CSS in Svelte components

## 1.2.6

### Patch Changes

- [#4771](https://github.com/withastro/astro/pull/4771) [`f3a81d82f`](https://github.com/withastro/astro/commit/f3a81d82f6ab4516cb86bf6b5e3eb01cb3ba39fb) Thanks [@matthewp](https://github.com/matthewp)! - Internal refactor

## 1.2.5

### Patch Changes

- [#4768](https://github.com/withastro/astro/pull/4768) [`9a59e24e0`](https://github.com/withastro/astro/commit/9a59e24e0250617333c1a0fd89b7d52fd1c829de) Thanks [@matthewp](https://github.com/matthewp)! - nsure before-hydration is only loaded when used

- [#4759](https://github.com/withastro/astro/pull/4759) [`fc885eaea`](https://github.com/withastro/astro/commit/fc885eaea1f08429599c0ab4697ab6382f3d7fa4) Thanks [@matthewp](https://github.com/matthewp)! - Read jsxImportSource from tsconfig

## 1.2.4

### Patch Changes

- [#4736](https://github.com/withastro/astro/pull/4736) [`13ca686ea`](https://github.com/withastro/astro/commit/13ca686ea18346a68db6af37348ee6d50719350d) Thanks [@bluwy](https://github.com/bluwy)! - Handle builds with outDir outside of current working directory

- [#4748](https://github.com/withastro/astro/pull/4748) [`c5e134d03`](https://github.com/withastro/astro/commit/c5e134d0358b7548bebe60b5707366b861c2fe28) Thanks [@bluwy](https://github.com/bluwy)! - Fix console.error filtering

- [#4742](https://github.com/withastro/astro/pull/4742) [`cf8a7e933`](https://github.com/withastro/astro/commit/cf8a7e933d26125eee44ce8b4f84d1353cfed957) Thanks [@matthewp](https://github.com/matthewp)! - Allow file uploads in dev server

- [#4752](https://github.com/withastro/astro/pull/4752) [`1bedb9427`](https://github.com/withastro/astro/commit/1bedb9427ebbe92eb74a82fc70cb67a97a250f32) Thanks [@bluwy](https://github.com/bluwy)! - Support Vite 3.1

- [#4755](https://github.com/withastro/astro/pull/4755) [`f1efd88dd`](https://github.com/withastro/astro/commit/f1efd88ddefe078f64901b1754ebfbaf65d36b51) Thanks [@matthewp](https://github.com/matthewp)! - Upgrade to Vite 3.1

- [#4594](https://github.com/withastro/astro/pull/4594) [`005d5bacd`](https://github.com/withastro/astro/commit/005d5bacd9c4dca5635da0759d5f73427df68e50) Thanks [@matthewp](https://github.com/matthewp)! - Allow custom 404 route to handle API route missing methods

## 1.2.3

### Patch Changes

- [#4724](https://github.com/withastro/astro/pull/4724) [`6efafa4b0`](https://github.com/withastro/astro/commit/6efafa4b0e392563d5375ec62ac6e3ac8372ec61) Thanks [@matthewp](https://github.com/matthewp)! - Use import order to sort CSS in the build

## 1.2.2

### Patch Changes

- [#4705](https://github.com/withastro/astro/pull/4705) [`5b6173fd0`](https://github.com/withastro/astro/commit/5b6173fd031b7e85974cbadd39de7fa199075e44) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Properly show an error message when a renderer is not properly configured

- [#4723](https://github.com/withastro/astro/pull/4723) [`0dba3b6f3`](https://github.com/withastro/astro/commit/0dba3b6f3fbd013f922fd11b9d6d977d165a512a) Thanks [@matthewp](https://github.com/matthewp)! - Makes the dev server more resilient to crashes

## 1.2.1

### Patch Changes

- [#4703](https://github.com/withastro/astro/pull/4703) [`d28f7013c`](https://github.com/withastro/astro/commit/d28f7013c2b415cbf6b640f17c9678ef0ac53253) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix: [astro add] Apply fetch polyfill before running

## 1.2.0

### Minor Changes

- [#4682](https://github.com/withastro/astro/pull/4682) [`d1e695914`](https://github.com/withastro/astro/commit/d1e69591479741022eecc122c43afb05985a94fd) Thanks [@bholmesdev](https://github.com/bholmesdev)! - astro add - move configuration updates to final step

- [#4549](https://github.com/withastro/astro/pull/4549) [`255636cc7`](https://github.com/withastro/astro/commit/255636cc7b4ed5f72045f75a2411ebd84a2bdb0d) Thanks [@altano](https://github.com/altano)! - Allow specifying custom encoding when using a non-html route. Only option before was 'utf-8' and now that is just the default.

- [#4578](https://github.com/withastro/astro/pull/4578) [`c706d845e`](https://github.com/withastro/astro/commit/c706d845ebf4786c33d2295954a98df8c5a7f183) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Restart dev server when config file is added, updated, or removed

### Patch Changes

- [#4699](https://github.com/withastro/astro/pull/4699) [`b85d05a84`](https://github.com/withastro/astro/commit/b85d05a841538b6a995808b6422b234f3e746804) Thanks [@matthewp](https://github.com/matthewp)! - Fix missing CSS in client:only in child packages

## 1.1.8

### Patch Changes

- [#4675](https://github.com/withastro/astro/pull/4675) [`63e49c3b6`](https://github.com/withastro/astro/commit/63e49c3b642274835cf99e2c0816a5bb655971c9) Thanks [@matthewp](https://github.com/matthewp)! - Prevent locking up when encountering invalid CSS

- [#4684](https://github.com/withastro/astro/pull/4684) [`919df13b9`](https://github.com/withastro/astro/commit/919df13b91eb561ae939e9be51e5a76ca97d8512) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fixes regression introduced in [#4646](https://github.com/withastro/astro/pull/4646) with better cyclic reference detection

- [#4683](https://github.com/withastro/astro/pull/4683) [`cc242d3af`](https://github.com/withastro/astro/commit/cc242d3af2cc39731cc40b07ac0aa1db687b2920) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix `tsc` compilation errors when `skipLibCheck` wasn't enabled

- [#4667](https://github.com/withastro/astro/pull/4667) [`9290b2414`](https://github.com/withastro/astro/commit/9290b24143d753edd3daf25945990c25a58e5bde) Thanks [@Holben888](https://github.com/Holben888)! - Fix framework components on Vercel Edge

- [#4645](https://github.com/withastro/astro/pull/4645) [`f27ca6ab3`](https://github.com/withastro/astro/commit/f27ca6ab3edbf0ef55e213ffd09aac454ce07995) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix client-side scripts reloads on dev server in windows

## 1.1.7

### Patch Changes

- [#4646](https://github.com/withastro/astro/pull/4646) [`98f242cdc`](https://github.com/withastro/astro/commit/98f242cdcd860679ad787ffb387558cb1dc93b87) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Add cyclic ref detection when serializing props

- [#4656](https://github.com/withastro/astro/pull/4656) [`6d845c353`](https://github.com/withastro/astro/commit/6d845c353d5688f30787c4361f86c605fb638dd9) Thanks [@matthewp](https://github.com/matthewp)! - Fix bug with using `assert` as import identifier

- [#4403](https://github.com/withastro/astro/pull/4403) [`d31e72c3b`](https://github.com/withastro/astro/commit/d31e72c3ba8270d1e8d33c533502b3c4c6390a15) Thanks [@JohnDaly](https://github.com/JohnDaly)! - Fix for components, declared with JSXMemberExpression nodes, that failed to hydrate due to incomplete 'component-export' metadata

## 1.1.6

### Patch Changes

- [#4623](https://github.com/withastro/astro/pull/4623) [`eb1862b4e`](https://github.com/withastro/astro/commit/eb1862b4e68b399eecc7267ea9e0bee36983b0cb) Thanks [@delucis](https://github.com/delucis)! - Improve third-party Astro package support

- [#4643](https://github.com/withastro/astro/pull/4643) [`307b7b97c`](https://github.com/withastro/astro/commit/307b7b97ce79d076ceb4fdc25fd28a27077deb34) Thanks [@matthewp](https://github.com/matthewp)! - Remove regression when there is duplicate client/server CSS

- [#4584](https://github.com/withastro/astro/pull/4584) [`29a5fdc15`](https://github.com/withastro/astro/commit/29a5fdc1535fc389035d8107025f7490bfa976ed) Thanks [@bluwy](https://github.com/bluwy)! - Correctly escape paths in file names

- [#4621](https://github.com/withastro/astro/pull/4621) [`0068afb87`](https://github.com/withastro/astro/commit/0068afb876342ae76154e552dfc5bb6832b665ed) Thanks [@AllanChain](https://github.com/AllanChain)! - Ensure SSR module is loaded before testing if it's CSS in dev

## 1.1.5

### Patch Changes

- [#4603](https://github.com/withastro/astro/pull/4603) [`36dee7169`](https://github.com/withastro/astro/commit/36dee7169be7f595825d3dfecb04e61cea1b2fe4) Thanks [@matthewp](https://github.com/matthewp)! - Fix error when no JSX renderer configured

## 1.1.4

### Patch Changes

- [#4586](https://github.com/withastro/astro/pull/4586) [`16814dc71`](https://github.com/withastro/astro/commit/16814dc718614c0cce46b788470c1bc40b5cc981) Thanks [@bluwy](https://github.com/bluwy)! - Move ast-types as dev dependency

- [#4585](https://github.com/withastro/astro/pull/4585) [`f018e365c`](https://github.com/withastro/astro/commit/f018e365cf22bd6b7235fe956e33b5d80fa059a1) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Add docs link to "missing adapter" error msg

## 1.1.3

### Patch Changes

- [#4574](https://github.com/withastro/astro/pull/4574) [`b92c24f40`](https://github.com/withastro/astro/commit/b92c24f4097f264a458c6f5044528c33fc897f01) Thanks [@delucis](https://github.com/delucis)! - Update `astro add` to list official integrations & adapters with same organisation we use in docs

* [#4566](https://github.com/withastro/astro/pull/4566) [`9ad307a9f`](https://github.com/withastro/astro/commit/9ad307a9fca064dcd9b2f27c3243d09d9154a5dc) Thanks [@bluwy](https://github.com/bluwy)! - Remove unused CSS for `client:load` components

## 1.1.2

### Patch Changes

- [#4519](https://github.com/withastro/astro/pull/4519) [`a2e8e76c3`](https://github.com/withastro/astro/commit/a2e8e76c303e8d6f39c24c122905a10f06907997) Thanks [@JuanM04](https://github.com/JuanM04)! - Upgraded Shiki to v0.11.1

- [#4531](https://github.com/withastro/astro/pull/4531) [`2d2e38e47`](https://github.com/withastro/astro/commit/2d2e38e473166e1e79886d3a9c7854927995dda1) Thanks [@bluwy](https://github.com/bluwy)! - Remove hardcoded Vite middleware handling

- [#4553](https://github.com/withastro/astro/pull/4553) [`2f05f5d30`](https://github.com/withastro/astro/commit/2f05f5d3071f01bf011212b5a91a5ac0c84fcff1) Thanks [@matthewp](https://github.com/matthewp)! - Include trailingSlash in astro:build:done hook

  This change ensures that the `pages` provided in the `astro:build:done` hook conform to the `trailingSlash` and `build.format` configs.

- [#4526](https://github.com/withastro/astro/pull/4526) [`046bfd908`](https://github.com/withastro/astro/commit/046bfd908de8bbfe9d24d1531260f1e6df03e912) Thanks [@bluwy](https://github.com/bluwy)! - Skip clean SSR output if page generation fails

- [#4546](https://github.com/withastro/astro/pull/4546) [`bb71be78d`](https://github.com/withastro/astro/commit/bb71be78db8abfc1a95de26c4508b694894cbcfd) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Update "Add an Adapter" help heading to "Add an SSR Adapter"

- [#4548](https://github.com/withastro/astro/pull/4548) [`69b640b87`](https://github.com/withastro/astro/commit/69b640b87c5d0f346129cd0cbd23efaf366bc8b1) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix "failed to load for SSR" on styles when using tailwind

- [#4535](https://github.com/withastro/astro/pull/4535) [`ca28d7578`](https://github.com/withastro/astro/commit/ca28d7578b7168fbc407132dc9a0c4115e1be878) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add missing `slot` attributes to SVG definitions

- [#4524](https://github.com/withastro/astro/pull/4524) [`d431fbe4e`](https://github.com/withastro/astro/commit/d431fbe4e1b04deba96e10679ebaaeedfcd6a239) - fix import in the config type declarations

- Updated dependencies [[`a2e8e76c3`](https://github.com/withastro/astro/commit/a2e8e76c303e8d6f39c24c122905a10f06907997)]:
  - @astrojs/markdown-remark@1.1.1

## 1.1.1

### Patch Changes

- [#4507](https://github.com/withastro/astro/pull/4507) [`4e1af3f0e`](https://github.com/withastro/astro/commit/4e1af3f0e8f5627cea24e4ec76d711d0387e3176) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix `import-meta.d.ts` not being included in the npm package

## 1.1.0

### Minor Changes

- [#4352](https://github.com/withastro/astro/pull/4352) [`cd154e447`](https://github.com/withastro/astro/commit/cd154e447ba7883531d484deea2fd046898d749b) Thanks [@matthewp](https://github.com/matthewp)! - Make Astro.url match the build.format configuration during the build

* [#4423](https://github.com/withastro/astro/pull/4423) [`d4cd7a59f`](https://github.com/withastro/astro/commit/d4cd7a59fd38d411c442a818cfaab40f74106628) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Update Markdown type signature to match new markdown plugin,and update top-level layout props for better alignment

- [#4474](https://github.com/withastro/astro/pull/4474) [`ac0321824`](https://github.com/withastro/astro/commit/ac03218247763e4782824e220a384fd20ae6d769) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add "extends" to markdown plugin config to preserve Astro defaults

* [#4138](https://github.com/withastro/astro/pull/4138) [`839097c84`](https://github.com/withastro/astro/commit/839097c84e830542c17c18d8337a88de8885c356) Thanks [@gtnbssn](https://github.com/gtnbssn)! - Makes remark-rehype options available in astro.config.mjs

- [#4182](https://github.com/withastro/astro/pull/4182) [`fcc36ac90`](https://github.com/withastro/astro/commit/fcc36ac908429733b1d9e51caddbc7590f9eeea5) Thanks [@Alxandr](https://github.com/Alxandr)! - Make type definitions available through package.json exports

### Patch Changes

- [#4500](https://github.com/withastro/astro/pull/4500) [`9874c7bf4`](https://github.com/withastro/astro/commit/9874c7bf42e48e8da214b77c5eb20c0f0cdce42f) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Update `astro check` to use latest version of the Astro language server

* [#4439](https://github.com/withastro/astro/pull/4439) [`77ce6be30`](https://github.com/withastro/astro/commit/77ce6be30c9cb8054ebf69a4943b984eed90152e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add tsconfig templates for users to extend from

- [#4499](https://github.com/withastro/astro/pull/4499) [`1f42c0791`](https://github.com/withastro/astro/commit/1f42c0791c342740d3650dc04a15c3610f9ab00a) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix `tsc` not being able to find Vite's import.meta types on Linux

* [#4497](https://github.com/withastro/astro/pull/4497) [`78e06c8ec`](https://github.com/withastro/astro/commit/78e06c8ec01e041e3f78625cb85bcce0cf5be029) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Production build logging - Only log `[code].html` instead of `[code]/index.html` for 404 and 500 routes

* Updated dependencies [[`ac0321824`](https://github.com/withastro/astro/commit/ac03218247763e4782824e220a384fd20ae6d769), [`839097c84`](https://github.com/withastro/astro/commit/839097c84e830542c17c18d8337a88de8885c356)]:
  - @astrojs/markdown-remark@1.1.0

## 1.1.0-next.0

### Minor Changes

- [#4352](https://github.com/withastro/astro/pull/4352) [`cd154e447`](https://github.com/withastro/astro/commit/cd154e447ba7883531d484deea2fd046898d749b) Thanks [@matthewp](https://github.com/matthewp)! - Make Astro.url match the build.format configuration during the build

* [#4423](https://github.com/withastro/astro/pull/4423) [`d4cd7a59f`](https://github.com/withastro/astro/commit/d4cd7a59fd38d411c442a818cfaab40f74106628) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Update Markdown type signature to match new markdown plugin,and update top-level layout props for better alignment

- [#4474](https://github.com/withastro/astro/pull/4474) [`ac0321824`](https://github.com/withastro/astro/commit/ac03218247763e4782824e220a384fd20ae6d769) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add "extends" to markdown plugin config to preserve Astro defaults

* [#4138](https://github.com/withastro/astro/pull/4138) [`839097c84`](https://github.com/withastro/astro/commit/839097c84e830542c17c18d8337a88de8885c356) Thanks [@gtnbssn](https://github.com/gtnbssn)! - Makes remark-rehype options available in astro.config.mjs

- [#4182](https://github.com/withastro/astro/pull/4182) [`fcc36ac90`](https://github.com/withastro/astro/commit/fcc36ac908429733b1d9e51caddbc7590f9eeea5) Thanks [@Alxandr](https://github.com/Alxandr)! - Make type definitions available through package.json exports

### Patch Changes

- [#4439](https://github.com/withastro/astro/pull/4439) [`77ce6be30`](https://github.com/withastro/astro/commit/77ce6be30c9cb8054ebf69a4943b984eed90152e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Add tsconfig templates for users to extend from

- Updated dependencies [[`ac0321824`](https://github.com/withastro/astro/commit/ac03218247763e4782824e220a384fd20ae6d769), [`839097c84`](https://github.com/withastro/astro/commit/839097c84e830542c17c18d8337a88de8885c356)]:
  - @astrojs/markdown-remark@1.1.0-next.0

## 1.0.9

### Patch Changes

- [#4457](https://github.com/withastro/astro/pull/4457) [`9490f0e22`](https://github.com/withastro/astro/commit/9490f0e2235a61984bc0bba7e2383d2383085cf2) Thanks [@matthewp](https://github.com/matthewp)! - Include styles imported by hoisted scripts

* [#4469](https://github.com/withastro/astro/pull/4469) [`8a2d6958f`](https://github.com/withastro/astro/commit/8a2d6958f1747ddc010464d7d8ccbad2d6838921) Thanks [@kagankan](https://github.com/kagankan)! - Fix load `base` option in build

- [#4451](https://github.com/withastro/astro/pull/4451) [`a38a56829`](https://github.com/withastro/astro/commit/a38a568299e6d23cb05ca2419b4a79e7ef5eef0b) Thanks [@bluwy](https://github.com/bluwy)! - Bump @astrojs/compiler dependency

* [#4473](https://github.com/withastro/astro/pull/4473) [`467108730`](https://github.com/withastro/astro/commit/467108730e4f45e4cd99779a7126b9dbd93d9ce5) Thanks [@bluwy](https://github.com/bluwy)! - Remove optional chaining in astro-island

- [#4475](https://github.com/withastro/astro/pull/4475) [`78334b976`](https://github.com/withastro/astro/commit/78334b9765f3044969b761053382db5fe208ed56) Thanks [@matthewp](https://github.com/matthewp)! - Fixes regression with JSX in Solid library

* [#4458](https://github.com/withastro/astro/pull/4458) [`aa555932b`](https://github.com/withastro/astro/commit/aa555932be9c4805c3dc3008a7edf244090155ea) Thanks [@bluwy](https://github.com/bluwy)! - Support `vite.build.cssCodeSplit: false` option

- [#4422](https://github.com/withastro/astro/pull/4422) [`85646918a`](https://github.com/withastro/astro/commit/85646918acbfe6a96be234ad3e93f60bc74a0b6e) Thanks [@bluwy](https://github.com/bluwy)! - Refactor CSS preprocess and deps HMR

* [#4456](https://github.com/withastro/astro/pull/4456) [`47e71ae8f`](https://github.com/withastro/astro/commit/47e71ae8f8735149facb34ce63d4d582f0dfd32e) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Added an error message when the second argument of Astro.slots.render is not an array

## 1.0.8

### Patch Changes

- [#4330](https://github.com/withastro/astro/pull/4330) [`baa2ddd01`](https://github.com/withastro/astro/commit/baa2ddd0103c269c862258520020395135e823ec) Thanks [@bluwy](https://github.com/bluwy)! - Warn hydration directive for Astro components in JSX

* [#4427](https://github.com/withastro/astro/pull/4427) [`b2e976f39`](https://github.com/withastro/astro/commit/b2e976f39c383eda8de58a2c86e94cbc9b3d678c) Thanks [@cameronmcefee](https://github.com/cameronmcefee)! - Fix config types to allow falsy values in integrations list, to match docs

- [#4385](https://github.com/withastro/astro/pull/4385) [`8164fa6f1`](https://github.com/withastro/astro/commit/8164fa6f1a01152f00542be33baebecd8ac60818) Thanks [@krolebord](https://github.com/krolebord)! - Fix warning when using hooks inside the react components not exported as a function declaration

* [#4445](https://github.com/withastro/astro/pull/4445) [`df4e99928`](https://github.com/withastro/astro/commit/df4e999284ae912b2a3f8a56573598a6ff21aa2a) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add "waiting for X integration" log for long-running integration hooks

- [#4430](https://github.com/withastro/astro/pull/4430) [`dc42f2c00`](https://github.com/withastro/astro/commit/dc42f2c00fdc0c2f310ba43aa7f6ab15c525f18c) Thanks [@bholmesdev](https://github.com/bholmesdev)! - astro add - Fix third-party npm orgs, i.e. `@example/integration`

* [#4441](https://github.com/withastro/astro/pull/4441) [`ca0c7e8b8`](https://github.com/withastro/astro/commit/ca0c7e8b836b1be2db6a77698c9535a34ada8fe6) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Allow arbitrary strings on the target attribute

- [#4446](https://github.com/withastro/astro/pull/4446) [`27ac6a03a`](https://github.com/withastro/astro/commit/27ac6a03a1b58da836190922304de5645854b49b) Thanks [@matthewp](https://github.com/matthewp)! - Deterministic CSS ordering

  This makes our CSS link order deterministic. It uses CSS depth; that is how deeply a module import the CSS comes from, in order to determine which CSS is page-level vs. component-level CSS.

  This is intended to match dev ordering where, because we do not bundle, the page-level CSS always comes after component-level.

* [#4426](https://github.com/withastro/astro/pull/4426) [`f40065f51`](https://github.com/withastro/astro/commit/f40065f510b4fef40d3d3e069e8dc2d4d9a4edb2) Thanks [@matthewp](https://github.com/matthewp)! - Ensure index pages are generated on paginated results

## 1.0.7

### Patch Changes

- [#4415](https://github.com/withastro/astro/pull/4415) [`39088e11d`](https://github.com/withastro/astro/commit/39088e11db2ab69b370616d7cb369952cd9fd266) Thanks [@bluwy](https://github.com/bluwy)! - Bump Vite to 3.0.9

* [#4362](https://github.com/withastro/astro/pull/4362) [`aa5118e85`](https://github.com/withastro/astro/commit/aa5118e8543bb9ed240681acdabfcc09bdbb5438) Thanks [@joseph-lozano](https://github.com/joseph-lozano)! - Allow user config to set `markdown.drafts` option

- [#4344](https://github.com/withastro/astro/pull/4344) [`500332a42`](https://github.com/withastro/astro/commit/500332a426c8fa43e6534f0e41de5fc902f98ccd) Thanks [@bluwy](https://github.com/bluwy)! - Refactor static build config merge

* [#4364](https://github.com/withastro/astro/pull/4364) [`77b068086`](https://github.com/withastro/astro/commit/77b068086d923e99eb693d1c57b7d6cd906a1e8a) Thanks [@bluwy](https://github.com/bluwy)! - Preserve all error stack lines

- [#4405](https://github.com/withastro/astro/pull/4405) [`a70f69a06`](https://github.com/withastro/astro/commit/a70f69a06c069781c56393289f82efc1251fc37b) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Refactor JSX build plugin, improve performance

* [#4356](https://github.com/withastro/astro/pull/4356) [`beed20be4`](https://github.com/withastro/astro/commit/beed20be4a4dd01a52cff49887420b6a8b92b1a9) Thanks [@delucis](https://github.com/delucis)! - Provide correct MIME type for dynamic endpoint routes in dev

- [#4375](https://github.com/withastro/astro/pull/4375) [`5e82f6c24`](https://github.com/withastro/astro/commit/5e82f6c245be332764fcd5a90be491a430655c87) Thanks [@matthewp](https://github.com/matthewp)! - Fixes race condition between directives being defined

## 1.0.6

### Patch Changes

- [#4324](https://github.com/withastro/astro/pull/4324) [`45fdbc465`](https://github.com/withastro/astro/commit/45fdbc4650610bd8363a05c07f3863cc12391b28) Thanks [@BurntCaramel](https://github.com/BurntCaramel)! - Use TextEncoder instead of Buffer.byteLength() for Deno compatibility

* [#4334](https://github.com/withastro/astro/pull/4334) [`b55f76c1c`](https://github.com/withastro/astro/commit/b55f76c1cafb7918f7087c6df03dd1d59eeaa065) Thanks [@matthewp](https://github.com/matthewp)! - Fix double injecting of head content in md pages

- [#4329](https://github.com/withastro/astro/pull/4329) [`0274b8d47`](https://github.com/withastro/astro/commit/0274b8d47be6ad2f5a503f70e2efdd52e43dc9c4) Thanks [@tony-sull](https://github.com/tony-sull)! - Updates routing logic to allow multiple routes to match the same URL in SSR

* [#4347](https://github.com/withastro/astro/pull/4347) [`166b3b8a5`](https://github.com/withastro/astro/commit/166b3b8a544e6ba8f6a32960cf9c73bbb88c8b34) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix MDXLayoutProps type signature for linting

## 1.0.5

### Patch Changes

- [#4302](https://github.com/withastro/astro/pull/4302) [`1d3a0a16f`](https://github.com/withastro/astro/commit/1d3a0a16f33aa88c2b60088d6a497e4beaadb2dc) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Revert "Ensure hydration scripts inside of slots render ASAP (#4288)" to fix Svelte integration bug

* [#4284](https://github.com/withastro/astro/pull/4284) [`73f367c77`](https://github.com/withastro/astro/commit/73f367c77b8311707b1c142e03dd53952f14d934) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Prevent preview if 'output: server' is configured

## 1.0.4

### Patch Changes

- [#4268](https://github.com/withastro/astro/pull/4268) [`f7afdb889`](https://github.com/withastro/astro/commit/f7afdb889fe4e97177958c8ec92f80c5f6e5cb51) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Align MD with MDX on layout props and "glob" import results:
  - Add `Content` to MDX
  - Add `file` and `url` to MDX frontmatter (layout import only)
  - Update glob types to reflect differences (lack of `rawContent` and `compiledContent`)

* [#4265](https://github.com/withastro/astro/pull/4265) [`8f845ca95`](https://github.com/withastro/astro/commit/8f845ca9507965e3898b3c7b70952c849bef310e) Thanks [@matthewp](https://github.com/matthewp)! - Prevents automatic trailingSlash appending on getStaticPaths produced pages

- [#4288](https://github.com/withastro/astro/pull/4288) [`c21810068`](https://github.com/withastro/astro/commit/c218100684c90c2b5c490e73b0687ad59d0c58df) Thanks [@matthewp](https://github.com/matthewp)! - Ensure hydration scripts inside of slots render ASAP

* [#4282](https://github.com/withastro/astro/pull/4282) [`c0992e1fe`](https://github.com/withastro/astro/commit/c0992e1fefc105577e99ac94338d349dbabf38d8) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Fix bug where Astro's server runtime would end up in the browser

- [#4272](https://github.com/withastro/astro/pull/4272) [`24d2f7a6e`](https://github.com/withastro/astro/commit/24d2f7a6e6700c10c863f826f37bb653d70e3a83) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Properly handle hydration for namespaced components

* [#4289](https://github.com/withastro/astro/pull/4289) [`3ca905174`](https://github.com/withastro/astro/commit/3ca905174967d6339ba90aa5bc1756fbe2fafdb0) Thanks [@bholmesdev](https://github.com/bholmesdev)! - [astro add] Set `output: 'server'` when adding adapter

## 1.0.3

### Patch Changes

- [#4239](https://github.com/withastro/astro/pull/4239) [`a9baa45af`](https://github.com/withastro/astro/commit/a9baa45af35abdd3e1930fb49e8b6fb0a4340e2a) Thanks [@bluwy](https://github.com/bluwy)! - Fix Astro client scripts sourcemap 404

* [#4279](https://github.com/withastro/astro/pull/4279) [`42fd6936c`](https://github.com/withastro/astro/commit/42fd6936cdb7106aea3770bed5313e558fc8b6dc) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Handle "not found" imports without throwing an "Invalid URL" error

- [#4273](https://github.com/withastro/astro/pull/4273) [`0022f46b5`](https://github.com/withastro/astro/commit/0022f46b57946f4f71e7f9f6e265081ee4ae1565) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fix build output adding `/index.html` at the end of endpoints route

* [#4270](https://github.com/withastro/astro/pull/4270) [`7127b1bb3`](https://github.com/withastro/astro/commit/7127b1bb35ca4e8f419e18683e380a4917eca4bb) Thanks [@natemoo-re](https://github.com/natemoo-re)! - Make third-party integration names nicer when using `astro add`

## 1.0.2

### Patch Changes

- [#4247](https://github.com/withastro/astro/pull/4247) [`714a8399e`](https://github.com/withastro/astro/commit/714a8399e20f334d2ba341c98d8ef5d590af9c39) Thanks [@matthewp](https://github.com/matthewp)! - Return 404 status code for 404.astro in SSR

* [#4240](https://github.com/withastro/astro/pull/4240) [`561a34d91`](https://github.com/withastro/astro/commit/561a34d91209c9d4959f74beaa17008edb27ff5d) Thanks [@matthewp](https://github.com/matthewp)! - Properly invalidate Astro modules when a child script updates in HMR

- [#4234](https://github.com/withastro/astro/pull/4234) [`c38e7f189`](https://github.com/withastro/astro/commit/c38e7f1890ba5bc97ddacee91ea196bcfc7652e6) Thanks [@bluwy](https://github.com/bluwy)! - Remove dev server during build

* [#4213](https://github.com/withastro/astro/pull/4213) [`f8e385339`](https://github.com/withastro/astro/commit/f8e3853394c2f2f48fac4b5eb2284e1960e59a13) Thanks [@bluwy](https://github.com/bluwy)! - Bump Vite to 3.0.5

- [#4225](https://github.com/withastro/astro/pull/4225) [`e918b3883`](https://github.com/withastro/astro/commit/e918b3883e156a0de2148517b619a2cf451917d2) Thanks [@mayank99](https://github.com/mayank99)! - `astro add` now supports `-y`

## 1.0.1

### Patch Changes

- [`3a7f2385e`](https://github.com/withastro/astro/commit/3a7f2385eadadb21794a06c86b7fa20b83b2f8f8) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Add rawContent and compiledContent to MD layout props

## 1.0.0

> Astro v1.0 is out! Read the [official announcement post](https://astro.build/blog/astro-1/).

> **Note**
> If you need help migrating an existing Astro project to the new Astro v1.0, check out our updated [Migration Guide](https://docs.astro.build/en/migrate/) and [full documentation website](https://docs.astro.build/).

## 0.X

For older changelog entries -- including all v0.X, v1.0 Beta, and v1.0 Release Candidate versions -- check out [the v0.X changelog](https://github.com/withastro/astro/blob/astro%401.0.0/packages/astro/CHANGELOG.md).
