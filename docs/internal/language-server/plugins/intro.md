# Plugins intro

The Language Server uses a plugin system to manage the different features provided that are supported in different contexts

For instance, whenever we ask for completions, we'll ask all of our plugins "What completions can you give me at this place?". For example, If `this place` is HTML, our HTML plugin will happily answers us with a bunch of HTML-relevant completions (such as Emmet)

The benefits of this is that we can neatly separate different context in different plugins, everything that is relevant to CSS will be in the CSS plugin, nowhere else!

Everything start in our [PluginHost.ts](/packages/language-server/src/plugins/PluginHost.ts), a class used to delegate the different tasks (Completions, Diagnostics etc) to our plugins. For more info on a specific plugin, see the associated `.md` file located in this folder (ex: [css.md](./css.md) for our CSS plugin)
