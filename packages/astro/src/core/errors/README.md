# Errors

## Writing error messages for Astro

### Tips

**Chosing an Error Code**

Choose any available error code in the appropriate range:
- 1xxxx: this kind of error
- 2xxxx: this kind of error
- 7xxxx: configuration errors

The exact error code used is unimportant. For example, error 5005 and error 5006 don't necessarily have to be related, or follow any logical pattern.

Users are not reading codes sequentially. They're much more likely to directly land on the error or search for a specific code.

If you are unsure about which error code to choose, ask Erika!
    
** Error Code Format **
  - Begin with **what happened** and **why** (ex: `Could not use {feature} because SSR is not enabled`)
  - Then, **describe the action the user should take** (ex: `Update your Astro config with `output: 'server'` to enable SSR.`)
  - A `hint` can be used for any additional info that might help the user (ex: a link to the documentation, or a common cause)

** Error Code Writing Style **
- Technical jargon is mostly okay! But, most abbreviations should be avoided. If a developer is unfamiliar with a technical term, spelling it out in full allows them to look it up on the web more easily.
- Describe the what, why and action to take from the user's perspective. Assume they don't know Astro internals, and care only about how  Astro is _used_ (ex: `You are missing...` vs `Astro/file cannot find...`)
- Avoid using cutesy language (ex: Oops!). This tone minimizes the significance of the error, which _is_ important to the developer. The developer may be frustrated and your error message shouldn't be making jokes about their struggles. Only include words and phrases that help the developer **interpret the error** and **fix the problem**.

### CLI specifics:
If the error happened **during an action that changes the state of the project** (ex: editing configuration, creating files), the error should **reassure the user** about the state of their project (ex: "Failed to update configuration. Your project has been restored to its previous state.")

### Shape
- **Error codes and names are permanent**, and should never be changed, nor deleted. Users should always be able to find an error by searching, and this ensures a matching result. When an error is no longer relevant, it should be deprecated, not removed.
- Contextual information may be used to enhance the message or the hint. However, the error code itself should not be included in the message as it will already be shown as part of the the error.
- Do not prefix `message` and `hint` with descriptive words such as "Error:" or "Hint:" as it may lead to duplicated labels in the UI / CLI.

### Always remember

Error are a reactive strategy. They are the last line of defense against a mistake.

Before adding a new error message, ask yourself, "Was there a way this situation could've been avoided in the first place?" (docs, editor tooling etc). 

**If you can prevent the error, you don't need an error message!**

## Additional resources on writing good error messages

- [When life gives you lemons, write better error messages](https://wix-ux.com/when-life-gives-you-lemons-write-better-error-messages-46c5223e1a2f)
- [RustConf 2020 - Bending the Curve: A Personal Tutor at Your Fingertips by Esteban Kuber](https://www.youtube.com/watch?v=Z6X7Ada0ugE) (part on error messages starts around 19:17)
