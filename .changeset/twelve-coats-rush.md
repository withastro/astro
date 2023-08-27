---
'astro': major
---

Lowercase names for endpoint functions are now deprecated.

Rename functions to their uppercase equivalent:

```diff
- export function get() {
+ export function GET() {
    return new Response(JSON.stringify({ "title": "Bob's blog" }));
}

- export function post() {
+ export function POST() {
    return new Response(JSON.stringify({ "title": "Bob's blog" }));
}

- export function put() {
+ export function PUT() {
    return new Response(JSON.stringify({ "title": "Bob's blog" }));
}

- export function all() {
+ export function ALL() {
    return new Response(JSON.stringify({ "title": "Bob's blog" }));
}

// you can use the whole word "DELETE"
- export function del() {
+ export function DELETE() {
    return new Response(JSON.stringify({ "title": "Bob's blog" }));
}
```
