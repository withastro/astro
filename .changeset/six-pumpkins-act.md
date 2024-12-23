---
'astro': patch
---

Fixes server islands failing to check content-type header under certain circumstances

Sometimes a reverse proxy or similar service might modify the content-type header to include the charset or other parameters in the media type of the response. This previously wasn't handled by the client-side server island script and thus removed the script without actually placing the requested content in the DOM. This fix makes it so the script checks if the header starts with the proper content type instead of exactly matching `text/html`, so the following will still be considered a valid header: `text/html; charset=utf-8`
