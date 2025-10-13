import { defineMiddleware } from "astro:middleware";

const originalRequestCookieName = "VP-Original-Request";

export const onRequest = defineMiddleware(async (context, next) => {
          console.log("Middleware running on:", context.originPathname, context.cookies.get(originalRequestCookieName)?.value);

  if ( !context.originPathname.includes("secret") 
  ) {
    return next();
  }

  // todo, check cookie
  const isAuthed = false;


      console.log("Middleware running on:", context.originPathname, {isAuthed});


  if (!isAuthed) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/login",
          "Set-Cookie": `${originalRequestCookieName}=${context.originPathname}; Path=/; HttpOnly`,
        },
      });
    } 
  
  if (context.originPathname.startsWith("/api/finish-login")) {
    const redirectTo =
      context.cookies.get(originalRequestCookieName)?.value || "/";
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectTo,
        "Set-Cookie": `${originalRequestCookieName}=/; Path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
      },
    });
  }

  return next();
});
