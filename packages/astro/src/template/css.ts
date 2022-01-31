/**
 *  CSS is exported as a string so the error pages:
 * 1. don’t need to resolve a deep internal CSS import
 * 2. don’t need external dependencies to render (they may be shown because of a dep!)
 */

// Base CSS: shared CSS among pages
export const baseCSS = `
:root {
  --gray-10: hsl(258, 7%, 10%);
  --gray-20: hsl(258, 7%, 20%);
  --gray-30: hsl(258, 7%, 30%);
  --gray-40: hsl(258, 7%, 40%);
  --gray-50: hsl(258, 7%, 50%);
  --gray-60: hsl(258, 7%, 60%);
  --gray-70: hsl(258, 7%, 70%);
  --gray-80: hsl(258, 7%, 80%);
  --gray-90: hsl(258, 7%, 90%);
  --orange: #ff5d01;
}

* {
  box-sizing: border-box;
}

body {
  background-color: var(--gray-10);
  color: var(--gray-80);
  font-family: monospace;
  line-height: 1.5;
  margin: 0;
}

a {
  color: var(--orange);
}

h1 {
  font-weight: 800;
  margin-top: 1rem;
  margin-bottom: 0;
}

pre {
  color:;
  font-size: 1.2em;
  margin-top: 0;
  max-width: 60em;
}
`;
