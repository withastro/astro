import type { APIRoute } from "astro";

export const prerender = false;

// Simple demo auth - in production, use a real auth library
const DEMO_USERNAME = 'demo';
const DEMO_PASSWORD = 'password';
const AUTH_COOKIE_NAME = 'auth-token';
const REDIRECT_COOKIE_NAME = 'redirect-after-login';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const url = new URL(request.url);
  const action = url.pathname.split('/').pop();

  if (action === 'login') {
    const formData = await request.formData();
    const username = formData.get('username')?.toString();
    const password = formData.get('password')?.toString();

    if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
      // Set auth cookie (in production, use a secure session token)
      cookies.set(AUTH_COOKIE_NAME, 'valid-token', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
      });

      // Redirect to original URL or home
      const redirectTo = cookies.get(REDIRECT_COOKIE_NAME)?.value || '/';
      cookies.delete(REDIRECT_COOKIE_NAME, { path: '/' });
      
      return redirect(redirectTo);
    }

    // Invalid credentials
    return redirect('/login?error=invalid');
  }

  if (action === 'logout') {
    cookies.delete(AUTH_COOKIE_NAME, { path: '/' });
    return redirect('/');
  }

  return new Response('Not found', { status: 404 });
};
