---
layout: ~/layouts/MainLayout.astro
title: Progressive Enhancement
---

Not all users can run JavaScript. Some users might be using more limited browsers, or they could be trying to limit data usage with things like Chrome's data saver mode.
To help make your website function optimally with limited JavaScript, you can use progressive enhancement.
Progressive enhancement allows your website to function at a certain level without certain things like JavaScript, making it so your website is fine without JavaScript and is progressively enhanced with JavaScript.

Astro provides great support for progressive enhancement as Astro components compile down to completely static HTML that does not require JavaScript by default. However, you can acidentally mess up your progressive enhancement with client side hydrated components.

# Avoid generating using HTML placeholders instead of content when possible

You can often make your application lose the benefits of Static Generation simply by messing up a conditional. For example, let's say you were implementing theming based on a value in localstorage in React.
You might write

```jsx
import {useState,useEffect} from "react"
export function Page() {
  let [theme,setTheme] = useState(null)
  useEffect(()=>{
    if (localStorage) {
      setTheme(localStorage.getItem("Theme"))
    }
  },[])
  if (theme) {
    return (<div class={`theme-${theme}`}>
    <h1>Content</h1>
    <p>Lorem ipsum</p>
    </div>)
  } else {
    return (<h1>Loading</h1>)
  }
}
```

Can you catch the problem? When this page is statically generated, the content will just be a loading header, which removes the advantage of SSG in the first place.
Instead, you could insert a short render blocking script at the start of the page that browsers without JavaScript will ignore, or you could take advantage of CSS media queries.

# Only use JavaScript when you need to

There are many cases where you can do things that might seem like they need JavaScript that do not. For example, you can make a fully functional drawer using just [CSS and checkboxes](https://daisyui.com/components/drawer).

Another helpful thing is HTML forms, which allow you to do limited form submitting without any JavaScript.

In general, use HTML semantics to your advantage. Many elements provide built in behavior that some people use JavaScript for, plus they are more accessible and SEO friendly.

There are many help elements for interactivity like `<dialog>`, `<details>`, and `<form>`. They sometimes are not suitable for their functions, but it is often a good idea to use them when you can.
