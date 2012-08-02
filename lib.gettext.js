/*!
 * Copyright 2011 France Télécom
 * This software is distributed under the terms of either the GNU Lesser
 * General Public License (GPL) Version 2 or later.
 * See GPL-LICENSE.txt and LGPL-LICENSE.txt.
 */
 
/**
 * gettext.js
 * version : 1
 * 
 * This module is inspired of the GPL jquery plugin gettext, especially
 * the translations format, but nothing has been copied.
 * 
 * However, some source code from the LGPL library jsgettext
 * (http://freshmeat.net/projects/jsgettext) has been copied (the
 * function "createPluralFunc") so this implementation is also LGPL.
 * 
 * If you need some help to define the plural-forms, you can find it
 * on the GNU gettext library manual:
 * 
 * http://www.gnu.org/software/gettext/manual/gettext.html#Plural-forms
 * 
 * Note: the loading of translations doesn't work in Chrome for local
 * URLs (ie file: URLs).
 */ 

(function(window, document) {
/*jshint evil: true */
var gt = (function() {
	var currentLocale;
	var opts = {}, directory = {}, pluralFunc = function(){};
	
	function createXhrObject() {
		
	    if (window.XMLHttpRequest) {
	        return new XMLHttpRequest();
	    }
	 
	    if (window.ActiveXObject)
	    {
	        try{ return new ActiveXObject(names["Microsoft.XMLHTTP"]); }
	        catch(e){}
	    }
	
	    return null;
	}
	
	function loadData(url, method, callback) {
		
		var responseData, xhr;
		if( !( xhr = createXhrObject() ) ) {
		    return;
		}
		
		function xhrStatusChange() {
			if (xhr.readyState == 4 && xhr.status == 200) {

				// TODO to be able to use JSON.parse we must clean the JSON first
				// responseData = JSON.parse( xhr.responseText ) ;
				responseData = eval( '(' + xhr.responseText  + ')') ;
				callback && callback(responseData);
				opts.callback && opts.callback(gt);
				callListeners();
			}
		}
		
		xhr.open(method, url, !!opts.async);
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.setRequestHeader("Accept", "application/json");
		
		if (opts.async) {
			xhr.onreadystatechange = xhrStatusChange;
		}
		
		xhr.send(null);
		
		if (!opts.async) {
			xhrStatusChange();
		}	
	}
	
	function getGettextTranslationUrl(lang) {
		// the selector could be "link[rel=gettext][lang=" + lang + "]"
		// but for IE we have to use good ol' DOM
		
		var links = document.getElementsByTagName("link");
		for (var i = 0, l = links.length; i < l; i++) {   
			var link = links[i];
			if (link.getAttribute("rel") == "gettext" && link.getAttribute("lang") == lang) {
				return link.getAttribute("href");
			}
		}
		// return undefined;
	}

	/**
	 * This initialize the gettext enfine
	 * 
	 * the parameter _opts can have the following optional fields :
	 * - async: false by default; if this is true, the XHR request to get
	 * the translation is done in asynchronous mode. Using this mode,
	 * there is a possibility that the first translation request are
	 * not initialized. You can use the "callback" parameter or init
	 * listeners (see addInitListener method) to use async mode.
	 * - callback: this is called when loading is done. Especially
	 * useful in async mode.
	 * - createShorcuts: false by default; this creates the global
	 * shortcuts "_", "_n", "_o" and "strfmt".
	 */
	function init(_opts) {
		opts = _opts || {};
		if (opts.createShortcuts) {
			window._ = gettext_string;
			window._o = gettext_object;
			window._n = ngettext;
			window.strfmt = strfmt;
		}
		
		var html = document.documentElement;
		currentLocale = html.getAttribute("lang");
		var url = getGettextTranslationUrl(currentLocale);
		if (url) {
			loadData(url, "GET", initTranslation);
		}
	}
	
	function getCurrentLocale() {
		return currentLocale;
	}
	
    var pf_re = new RegExp('^\\s*nplurals\\s*=\\s*[0-9]+\\s*;\\s*plural\\s*=\\s*(?:\\s|[-\\?\\|&=!<>+*/%:;a-zA-Z0-9_\(\)])+');

    // this function (and only this function) is largely inspired from
	// http://freshmeat.net/projects/jsgettext (LGPL)
	function createPluralFunc(pluralFormCondition) {
		var func;
		
		if (pluralFormCondition) {
		   if (pf_re.test(pluralFormCondition)) {
		       //ex english: "Plural-Forms: nplurals=2; plural=(n != 1);\n"
		       //pf = "nplurals=2; plural=(n != 1);";
		       //ex russian: nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10< =4 && (n%100<10 or n%100>=20) ? 1 : 2)
		       //pf = "nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)";
		
		       /* We used to use eval, but it seems IE has issues with it.
		        * We now use "new Function", though it carries a slightly
		        * bigger performance hit.
		       var code = 'function (n) { var plural; var nplurals; '+pf+' return { "nplural" : nplurals, "plural" : (plural === true ? 1 : plural ? plural : 0) }; };';
		       func = eval("("+code+")");
		       */
		       var code = 'var plural; var nplurals; '+ pluralFormCondition +' return { nplural : nplurals, plural : (plural === true ? 1 : (plural ? plural : 0)) };';
		       func = new Function("n", code);
		   } else {
		       throw new Error("Syntax error in language file. Plural-Forms header is invalid ["+plural_forms+"]");
		   }   
		
		   // default to english plural form
		} else {
			func = function (n) {
				var p = (n != 1) ? 1 : 0;
				return { 'nplural' : 2, 'plural' : p };
			};
		}
		
		return func;
	}
	
	function initTranslation(data) {
		var i, l, index, cur, key, value;
		var header = data[""],
			headers = header.split('\n');
		delete data[""];

		directory = data;
		
		// I'd love to use reduce or forEach if I needn't to support IE.
		header = {};
		for (i = 0, l = headers.length; i < l; i++) {
			cur = headers[i];
			index = cur.indexOf(':');
			key = cur.substr(0, index);
			value = cur.substr(index + 1);
			header[key] = value;
		}
		
		pluralFunc = createPluralFunc(header["Plural-Forms"]);
	}
	
	/**
	 * normal gettext
	 */
	function gettext_string(str) {
		var translated = directory[str];
		if (translated && typeof translated !== "string") {
			translated = translated[0];
		}
		return (translated || str);
	}
	
	/**
	 * takes an object as parameter.
	 * This function iterates on this object and replaces each value
	 * by the return of the gettext function applied on this value.
	 * 
	 * So take care because this function modifies the object.
	 * It also returns this object.
	 */
	function gettext_object(obj) {
		for (var key in obj) {
			obj[key] = gettext_string(obj[key]);
		}
		
		return obj;
	}
	
	function ngettext(str, plural_str, n) {
		var translated = directory[str];
		if (!translated) {
			translated = [str, plural_str];
		}
		
		if (typeof translated === "string") {
			return translated;
		}

		var plural = pluralFunc(n);
		if (plural.plural > plural.nplural || translated.length < plural.plural) {
			plural.plural = 0;
		}
		
		translated = translated[plural.plural];
		return translated;
	}
	
	
	var fmt_re = /{(\d+)}/g;
	/**
	 * takes as argument a pattern and some arguments.
	 * The pattern contains some ordered parameters like {0} {1}.
	 * 
	 * Example :
	 * 
	 * strfmt("{0} sheeps are in {1}", 5, "the sheepfold");
	 * 
	 * This is very useful for plural forms, for example we can
	 * also use it like that :
	 * 
	 * strfmt("One sheep is in {1}", 5, "la bergerie");
	 * 
	 * Please note that the first parameter is silently discarded, so
	 * that you can use the very same command and only change the
	 * pattern.
	 */
	function strfmt(fmt) {
		var args = Array.prototype.slice.call(arguments, 1);
		var fmt_func = function (str, p1) {
			return args[p1];
		};
		return fmt.replace(fmt_re, fmt_func);
	}
	
	var listenersCalled = false;
	var listeners = [];
	function callListeners() {
		listenersCalled = true;
		for (var i = listeners.length; i; i--) {
			listeners[i - 1](gt);
		}
		listeners = null;
	}
	
	/**
	 * The function "func" will get called when the translation
	 * is loaded.
	 * 
	 * This function will have the gettext object as parameter
	 */
	function addInitListener(func) {
		if (listenersCalled) {
			// call func right now if we're already loaded
			func(gt);
			return;
		}
		
		listeners.push(func);
	}
	
	return {
		init: init,
		gettext: gettext_string,
		ngettext: ngettext,
		ogettext: gettext_object,
		_: gettext_string,
		_n: ngettext,
		_o: gettext_object,
		strfmt: strfmt,
		addInitListener : addInitListener,
		getCurrentLocale : getCurrentLocale
	};
})();

window.gt = gt;

})(this, document);
