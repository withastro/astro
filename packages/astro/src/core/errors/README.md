# Errors

## Writing error messages for Astro

### Tips
- Error codes don't really matter, error 5005 and error 5006 don't necessarily have to be related, or be in the same area at all.

  Users are not reading codes sequentially, they're much more likely to directly land on the error or search for a specific code

  We do however try to keep errors in certain buckets (ex: errors starting with 7xxx are all configuration errors)
- Errors should roughly follow the following form to be the most informative:
  - The message should first start with what happened and why (ex: `Could not use {feature} because SSR is not enabled`)
  - Then, a simple text describing the fix (ex: `Update your Astro config with `output: 'server'` to enable SSR.`)
  - The hint can be used for any additional info that might help the user (ex: a link to the documentation, or a common cause)
- Technical jargon is mostly okay! We are targeting developers, however not every user (especially newcomers) is gonna know every abbreviations, so avoid them
- An error message and hint will be more helpful if it addresses the user from their perspective (likely doesn’t know Astro internals, or necessarily care).
- Avoid using cutesy language (ex: Oops!). The tone is often inappropriate and it can be frustrating when the error is hard to debug

### CLI specifics:
- If the error happened in something that changes the state of the project (ex: editing configuration, creating files), the error
should reassure the user about the state of things (ex: "Failed to update configuration, your project has been restored to previous state")

### Shape
- **Error codes and names are set in stone once written**, and should never be changed. It's very important that users can search for an error they're having and always find relevant information. If an error is not relevant anymore, it should be deprecated, not removed.
- Contextual information may be used to enhance the message or the hint, however the location of the error shouldn't be included in the message as it's already included in the error itself
- Do not prefix messages and hints with things such as "Error:" or "Hint:" as it may lead to duplicated labels in the UI / CLI

### Always remember

Error are a reactive strategy, they're the last line of defense against a mistake.

When adding an error, always think: Was there a way this situation could've been avoided in the first place? (docs, editor tooling etc)

## Additional resources on writing good error messages

- [When life gives you lemons, write better error messages](https://wix-ux.com/when-life-gives-you-lemons-write-better-error-messages-46c5223e1a2f)
- [RustConf 2020 - Bending the Curve: A Personal Tutor at Your Fingertips by Esteban Kuber](https://www.youtube.com/watch?v=Z6X7Ada0ugE) (part on error messages starts around 19:17)
