gettext.js, a cross-browser library for internationalizing your JavaScript applications
=====
Features
-----
* easy to use
* strong support of plural forms
* small (1.8 kB minified and gzipped)

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
#### `_(string)` or `gettext(string)`
This returns the translated `string`, or the passed `string` itself if there
is no translation.

#### `_n(string, plural_string, number)` or `ngettext(string, plural_string, number)`
This methods makes it easier to translate plural forms. The three parameters
are :
* `string` is the singular form to translate; this is the key that will be used to
find the translation in the translation file.
* `plural_string` is the plural forms that will be returned if `string`
is not found in the translation file and if `number` is greater than 1.
* `number` is the parameter that defines which plural form will be returned.

Please see below for more informations about plural forms.

#### `_o(object)` or `ogettext(object)`
This is a nice addition to the original gettext API. It lets you
translate a whole object in one call, iterating through the `object` and
translating each of its members.

For each pair of (`key`, `value`) in the object, it replaces the value
with the result of `gettext(value)`. It modifies the `object` that is
passed and returns it as well.

This is only useful for non-contextual texts, without plural forms. You
can use this in the callback function called by `addInitListener`.

##### Example :
```Javascript
var translations = {
  text1: "This is my text.",
  text2: "This is another text."
};

gt.addInitListener(onTranslationInit);

function onTranslationInit(gt) {
  gt._o(translations);
  // now, translations contains the translations of the texts.
}
```

### Utility methods
#### `getCurrentLocale`
This returns the locale used for translations in this session. Basically,
this will be the value stored in the `lang` attribute of the `html`
element.

#### `strfmt(string_pattern, param1, param2, ...)`
This takes as argument a string pattern and some arguments.

The pattern contains some ordered parameters like `{0}` `{1}` that gets
replaced by the arguments. As you may guess, the number between the
curly braces determines which argument to pick. This allows you
to put very generic strings inside your language files, and even
reorder the replacement strings!

##### Example
```javascript
strfmt("{0} sheeps are in {1}", 5, "the sheepfold");
```
This is very useful for plural forms, for example we can
also use it like that :

```javascript
strfmt("One sheep is in {1}", 5, "la bergerie");
```
Please note that the first parameter is silently discarded, so
that you can use the very same command and only change the
pattern, which is returned by `_n`.

Syntax for the language files
-----
The language files are normal JSON files. As the files are parsed using
JavaScript's `eval` you don't have to adhere to the stricter JSON rules:
you can left your keys unquoted (although it's easier to
always quote them), you can use string concatenation to
make your file more readable, and you can use comments.

Here are the basic rules to follow :
* Each key to translate is a key in the JavaScript object.
* You must have an empty key. This empty key has several lines which are
only informational except the line defining the plural forms (see below).
* Plural forms are specified using normal JavaScript arrays.

### Example
```javascript
{
    // all of this is not really needed but it's good
    // to provide informations to your translators
    "": "Project-Id-Version: gettext-example\n" +
        "Report-Msgid-Bugs-To: \n" +
        "PO-Revision-Date: 2011-11-29\n" +
        "Last-Translator: Julien Wajsberg <julien.wajsberg@orange.com>\n" +
        "Language-Team: France Telecom\n" +
        "MIME-Version: 1.0\n" +
        "Content-Type: text/plain; charset=UTF-8\n" +
        "Content-Transfer-Encoding: 8bit\n" +
        "Plural-Forms: nplurals=2; plural=n != 1;",

    // the translations
    "$$text1$$": "This is a really good text.",
    "$$text2$$": "This is an awesome text.",
    "$$text3$$": "This text is very bad, very naughty.",
    "$$sheeps-in-sheepfold$$": [
		"One sheep is in the sheepfold.",
		"{0} sheeps are in the sheepfold."
	]
}
```

As a best practice, I use keys that are prefixed and suffixed with `$$` so
that I can then easily see what's not translated.


About plural forms
----
`gettext.js` has a strong support for plural forms. As you may know,
different languages have different rules for plural forms. Some
languages have more than 1 form of plural. Most existing libraries
only support the english plural form, which is obviously not sufficient.
For example, do you know that Polish has 3 forms ?

Here is how to use this support :
* first, you must have a correct `Plural-Forms` line in your language
file. The [gettext manual page about plural forms](http://www.gnu.org/software/gettext/manual/html_node/Plural-forms.html)
gathers lots of `Plural-Forms` examples you can just copy and paste.
* then, when you want a key with plural forms, you must use a normal
JavaScript array as a value, with as many elements as there are forms
for this language (as in the `$$sheeps-in-sheepfold$$` key above).
* and at last, use the `ngettext` method as described before.
