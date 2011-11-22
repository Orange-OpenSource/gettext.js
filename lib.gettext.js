/**
 * implémentation libre de gettext
 * 
 * ce code est inspiré du plugin jQuery gettext (GPL) (notamment le format des
 * traductions), mais rien n'a été copié.
 * 
 * du code de l'implémentation située à http://freshmeat.net/projects/jsgettext (LGPL)
 * a en revanche été copié (fonction "createPluralFunc"), ce qui rend cette
 * implémentation aussi LGPL.
 * 
 * liste des formats pour les plural-forms ici :
 * http://www.gnu.org/software/gettext/manual/gettext.html#Plural-forms
 */ 

(function(window, document) {
/*jshint evil: true */
var gt = (function() {
	var currentLocale;
	var opts = {}, directory = {}, pluralFunc = utils.noop;
	
	var createXhrObject = function(){
		
	    if (window.XMLHttpRequest) {
	        return new XMLHttpRequest();
	    }
	 
	    if (window.ActiveXObject)
	    {
	        try{ return new ActiveXObject(names["Microsoft.XMLHTTP"]); }
	        catch(e){}
	    }
	
	    return null;
	};
	
	var loadData = function(url, method, callback){
		
		var responseData, xhr;
		if( !( xhr = createXhrObject() ) ) {
		    return;
		}
		
		var xhrStatusChange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {

				// TODO voir pkoi JSON.parse marche pas
				// responseData = JSON.parse( xhr.responseText ) ;
				responseData = eval( '(' + xhr.responseText  + ')') ;
				callback && callback(responseData);
				opts.callback && opts.callback();
				callListeners();
			}
		};
		
		xhr.open(method, url, false);
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.setRequestHeader("Accept", "application/json");
		
		if (opts.async) {
			xhr.onreadystatechange = xhrStatusChange;
		}
		
		xhr.send(null);
		
		if (!opts.async) {
			xhrStatusChange();
		}
		
	};
	
	/**
	 * initialise le moteur gettext
	 * 
	 * opts peut contenir les champs suivants :
	 * - async : false par défaut; si true, exécute la requête XHR de manière asynchrone.
	 *      en asynchrone, il y a un risque de demander une traduction avant que ce soit
	 *      initialisé. On peut utiliser la callback dans ce cas.
	 * - callback : est appelée lorsque le chargement est terminé. Surtout utile en
	 *      asynchrone. 
	 * - createShortcuts : false par défaut; permet de créer les raccourcis globaux "_",
	 *      "_n" et "strfmt" vers respectivement "gettext", "ngettext" et "strfmt" 
	 */
	function init(_opts) {
		opts = _opts || {};
		if (opts.createShortcuts) {
			window._ = gettext;
			window._n = ngettext;
			window.strfmt = strfmt;
		}
		
		var html = document.documentElement;
		var lang = html.getAttribute("lang");
		
		//var link = document.querySelector("link[rel=gettext][lang=" + lang + "]");
		// we use jQuery for IE
		var link = $("link[rel=gettext][lang=" + lang + "]");
		if (link.length) {
			link = link.get(0);
			var url = link.getAttribute("href");
			loadData(url, "GET", initTranslation);
		}
		currentLocale = lang;
	}
	
	function getCurrentLocale() {
		return currentLocale;
	}
	
    var pf_re = new RegExp('^\\s*nplurals\\s*=\\s*[0-9]+\\s*;\\s*plural\\s*=\\s*(?:\\s|[-\\?\\|&=!<>+*/%:;a-zA-Z0-9_\(\)])+');

    // cette fonction (et juste elle) est fortement inspirée de
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
		var header = data[""];
		delete data[""];

		directory = data;

		header = header.split('\n').reduce(function(previous, line) {
			var cur = line.split(':');
			previous[cur[0]] = cur[1];
			return previous;
		}, {});
		
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
	 * prend en paramètre un objet
	 * Cette méthode va itérer sur cet objet et remplacer les valeurs
	 * par l'appel de gettext sur cette valeur.
	 * 
	 * Cette méthode modifie donc l'objet passé en paramètre.
	 * Elle retourne ensuite aussi cet objet.
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
	 * prend en argument un format + des arguments
	 * le format contient des paramètres ordonnés, du genre {0} {1}.
	 * 
	 * Exemple :
	 * strfmt("{0} moutons sont dans {1}", 5, "la bergerie");
	 * 
	 * Pour traduire, ça permet de faire des trucs comme ça :
	 * strfmt("Un mouton est dans {1}, 5, "la bergerie");
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
		listeners = undefined;
	}
	
	function addInitListener(func) {
		if (listenersCalled) {
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
