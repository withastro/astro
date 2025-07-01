---
'astro': patch
---

Fixes a bug where server islands wouldn't be correctly rendered when they rendered inside fragments.

Now the following example works as expected:

```astro
---
import { Cart } from "../components/Cart.astro";
---

<>
  <Cart server:defer />
</>

<Fragment>

<Fragment slot="rest">
  <Cart server:defer>
    <div slot="fallback">
      Not working
    </div>
  </Cart>
</Fragment>

```
