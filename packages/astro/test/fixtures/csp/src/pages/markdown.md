---
title: Markdown Code Blocks CSP Test
---

# Testing Markdown Code Blocks with CSP

This page tests that markdown code blocks work correctly with CSP when using class-based styles instead of inline styles.

## JavaScript Example

```js
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));
```

## TypeScript Example

```ts
type Point = {
  x: number;
  y: number;
};

function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}
```

## HTML Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Test Page</title>
  </head>
  <body>
    <h1>Hello World</h1>
  </body>
</html>
```

## CSS Example

```css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
}

.button {
  padding: 10px 20px;
  border-radius: 4px;
  color: white;
}
```
