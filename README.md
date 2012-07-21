gettext.js, a cross-browser library for internationalizing your JavaScript applications
=====
Quick start
-----
1. Insert the script in your web page. The script adds an object in the
global scope: `gt`.
2. Add a `link` element per translations you have, with `rel` and `lang` attributes :
```html
<link rel='gettext' lang='en' href='translations/en.json' />
```
3. Set the language in a `lang` attribute in the `html` tag. Note that even
without this library, this is recommended for accessibility to switch
the language in screen readers.
4. Call `gt.init`. This will load the appropriate language file depending
on the configured language. `init` can take some options, please see
below for the available options.
5. Call `gt.gettext` or `gt._` to translate a string.

Available methods
-----
### `addInitListener(function)`
