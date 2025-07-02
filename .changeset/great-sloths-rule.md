---
'astro': patch
---

Fixes a bug where server islands wouldn't be correctly rendered when they are rendered inside fragments.

Now the following examples work as expected:

```astro
---
import { Cart } from "../components/Cart.astro";
---

<>
  <Cart server:defer />
</>


<Fragment slot="rest">
  <Cart server:defer>
    <div slot="fallback">
      Not working
    </div>
  </Cart>
</Fragment>

```
