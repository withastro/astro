# @astrojs/language-server test suite

This folder includes a full test suite for the language server. The goal of this test suite isn't to have full in-depth coverage of every single feature supported, as most features are directly using Volar's code with no modifications on our end. Features where we do deviate (for example: code actions and auto import mappings) from Volar however will be tested fully.

Instead, what this test suite intend to be is a quick sanity check that a code change did not break everything.
