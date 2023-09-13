---
'@astrojs/vercel': major
---

Turn off functionPerRoute by default

In `@astrojs/vercel` the default for `functionPerRoute` was changed to `true`. While this option has several advantages, if you a free tier user you are likely to run into the limit of 12 functions per deployment. This will result in an error when you attempt to deploy.

For this reason, the `functionPerRoute` option is not back to defaulting to `false`. It's still a useful option if you have a paid plan and have run into issues with your single function exceeding the size limits.
