import { renderToResponse } from '@astrojs/runtime';
import { Hono } from 'hono';
import Page from './components/Page.astro';

const app = new Hono();

app.get('/', () => renderToResponse(Page, { props: { name: 'Hono' } }));
app.get('/hello/:name', (c) => renderToResponse(Page, { props: { name: c.req.param('name') } }));

export default app;
