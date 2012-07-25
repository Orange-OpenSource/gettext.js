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
### Initialization methods
#### `init(options)`
Call this method to initialize the library. This will find the
language to load using the `lang` attribute on the `html` node,
and the language file to load using the `link` with the appropriate
`lang` attribute as well. Then it will load and parse the language file.

The method takes an option parameter with the following possible options:
* `async` (`false` by default). If `true`, the loading is
asynchronous. The various listeners will be called when the library
is ready. If `false`, the call blocks until the file is downloaded, parsed,
and the library is ready.
* `callback` (empty by default). This function will be called when
the loading finishes. See also `addInitListener` below.
* `createShortcuts` (`false` by default). If `true`, the library will
create the top-level functions `_`, `_n`, `_o`, `strfmt`. See below for
their documentation.

#### `addInitListener(function)`
This registers a function to be called as soon as the language file is
loaded. The function will be passed the gettext object.

If the language file is already loaded, the function will be called
immediately (and synchronously).

### Translation methods

