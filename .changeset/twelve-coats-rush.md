---
'astro': major
---

The endpoints that have **lowercase** names are **deprecated**.

The endpoints methods **need** to be in **uppercase**.

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
