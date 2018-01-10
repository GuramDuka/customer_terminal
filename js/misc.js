//------------------------------------------------------------------------------
function strftime(fmt, timestamp) {
  //       discuss at: http://locutus.io/php/strftime/
  //      original by: Blues (http://tech.bluesmoon.info/)
  // reimplemented by: Brett Zamir (http://brett-zamir.me)
  //         input by: Alex
  //      bugfixed by: Brett Zamir (http://brett-zamir.me)
  //      improved by: Brett Zamir (http://brett-zamir.me)
  //           note 1: Uses global: locutus to store locale info
  //        example 1: strftime("%A", 1062462400); // Return value will depend on date and locale
  //        returns 1: 'Tuesday'

  //var setlocale = require('../strings/setlocale')

  //var $global = (typeof window !== 'undefined' ? window : global)
  //$global.$locutus = $global.$locutus || {}
  //var $locutus = $global.$locutus

  // ensure setup of localization variables takes place
  //setlocale('LC_ALL', 0)

  var _xPad = function (x, pad, r) {
    if (typeof r === 'undefined') {
      r = 10
    }
    for (; parseInt(x, 10) < r && r > 1; r /= 10) {
      x = pad.toString() + x
    }
    return x.toString()
  }

  var locale;// = $locutus.php.localeCategories.LC_TIME
  var lcTime;// = $locutus.php.locales[locale].LC_TIME

  var _formats = {
    a: function (d) {
      return lcTime.a[d.getDay()]
    },
    A: function (d) {
      return lcTime.A[d.getDay()]
    },
    b: function (d) {
      return lcTime.b[d.getMonth()]
    },
    B: function (d) {
      return lcTime.B[d.getMonth()]
    },
    C: function (d) {
      return _xPad(parseInt(d.getFullYear() / 100, 10), 0)
    },
    d: ['getDate', '0'],
    e: ['getDate', ' '],
    g: function (d) {
      return _xPad(parseInt(this.G(d) / 100, 10), 0)
    },
    G: function (d) {
      var y = d.getFullYear()
      var V = parseInt(_formats.V(d), 10)
      var W = parseInt(_formats.W(d), 10)

      if (W > V) {
        y++
      } else if (W === 0 && V >= 52) {
        y--
      }

      return y
    },
    H: ['getHours', '0'],
    I: function (d) {
      var I = d.getHours() % 12
      return _xPad(I === 0 ? 12 : I, 0)
    },
    j: function (d) {
      var ms = d - new Date('' + d.getFullYear() + '/1/1 GMT')
      // Line differs from Yahoo implementation which would be
      // equivalent to replacing it here with:
      ms += d.getTimezoneOffset() * 60000
      var doy = parseInt(ms / 60000 / 60 / 24, 10) + 1
      return _xPad(doy, 0, 100)
    },
    k: ['getHours', '0'],
    // not in PHP, but implemented here (as in Yahoo)
    l: function (d) {
      var l = d.getHours() % 12
      return _xPad(l === 0 ? 12 : l, ' ')
    },
    m: function (d) {
      return _xPad(d.getMonth() + 1, 0)
    },
    M: ['getMinutes', '0'],
    p: function (d) {
      return lcTime.p[d.getHours() >= 12 ? 1 : 0]
    },
    P: function (d) {
      return lcTime.P[d.getHours() >= 12 ? 1 : 0]
    },
    s: function (d) {
      // Yahoo uses return parseInt(d.getTime()/1000, 10);
      return Date.parse(d) / 1000
    },
    S: ['getSeconds', '0'],
    u: function (d) {
      var dow = d.getDay()
      return ((dow === 0) ? 7 : dow)
    },
    U: function (d) {
      var doy = parseInt(_formats.j(d), 10)
      var rdow = 6 - d.getDay()
      var woy = parseInt((doy + rdow) / 7, 10)
      return _xPad(woy, 0)
    },
    V: function (d) {
      var woy = parseInt(_formats.W(d), 10)
      var dow11 = (new Date('' + d.getFullYear() + '/1/1')).getDay()
      // First week is 01 and not 00 as in the case of %U and %W,
      // so we add 1 to the final result except if day 1 of the year
      // is a Monday (then %W returns 01).
      // We also need to subtract 1 if the day 1 of the year is
      // Friday-Sunday, so the resulting equation becomes:
      var idow = woy + (dow11 > 4 || dow11 <= 1 ? 0 : 1)
      if (idow === 53 && (new Date('' + d.getFullYear() + '/12/31')).getDay() < 4) {
        idow = 1
      } else if (idow === 0) {
        idow = _formats.V(new Date('' + (d.getFullYear() - 1) + '/12/31'))
      }
      return _xPad(idow, 0)
    },
    w: 'getDay',
    W: function (d) {
      var doy = parseInt(_formats.j(d), 10)
      var rdow = 7 - _formats.u(d)
      var woy = parseInt((doy + rdow) / 7, 10)
      return _xPad(woy, 0, 10)
    },
    y: function (d) {
      return _xPad(d.getFullYear() % 100, 0)
    },
    Y: 'getFullYear',
    z: function (d) {
      var o = d.getTimezoneOffset()
      var H = _xPad(parseInt(Math.abs(o / 60), 10), 0)
      var M = _xPad(o % 60, 0)
      return (o > 0 ? '-' : '+') + H + M
    },
    Z: function (d) {
      return d.toString().replace(/^.*\(([^)]+)\)$/, '$1')
    },
    '%': function (d) {
      return '%'
    }
  }

  var _date = (typeof timestamp === 'undefined')
    ? new Date()
    : (timestamp instanceof Date)
      ? new Date(timestamp)
      : new Date(timestamp * 1000)

  var _aggregates = {
    c: 'locale',
    D: '%m/%d/%y',
    F: '%y-%m-%d',
    h: '%b',
    n: '\n',
    r: 'locale',
    R: '%H:%M',
    t: '\t',
    T: '%H:%M:%S',
    x: 'locale',
    X: 'locale'
  }

  // First replace aggregates (run in a loop because an agg may be made up of other aggs)
  while (fmt.match(/%[cDFhnrRtTxX]/)) {
    fmt = fmt.replace(/%([cDFhnrRtTxX])/g, function (m0, m1) {
      var f = _aggregates[m1]
      return (f === 'locale' ? lcTime[m1] : f)
    })
  }

  // Now replace formats - we need a closure so that the date object gets passed through
  var str = fmt.replace(/%([aAbBCdegGHIjklmMpPsSuUVwWyYzZ%])/g, function (m0, m1) {
    var f = _formats[m1]
    if (typeof f === 'string') {
      return _date[f]()
    } else if (typeof f === 'function') {
      return f(_date)
    } else if (typeof f === 'object' && typeof f[0] === 'string') {
      return _xPad(_date[f[0]](), f[1])
    } else {
      // Shouldn't reach here
      return m1
    }
  })

  return str
}
//------------------------------------------------------------------------------
function base64_decode (encodedData) { // eslint-disable-line camelcase
  //  discuss at: http://locutus.io/php/base64_decode/
  // original by: Tyler Akins (http://rumkin.com)
  // improved by: Thunder.m
  // improved by: Kevin van Zonneveld (http://kvz.io)
  // improved by: Kevin van Zonneveld (http://kvz.io)
  //    input by: Aman Gupta
  //    input by: Brett Zamir (http://brett-zamir.me)
  // bugfixed by: Onno Marsman (https://twitter.com/onnomarsman)
  // bugfixed by: Pellentesque Malesuada
  // bugfixed by: Kevin van Zonneveld (http://kvz.io)
  // improved by: Indigo744
  //   example 1: base64_decode('S2V2aW4gdmFuIFpvbm5ldmVsZA==')
  //   returns 1: 'Kevin van Zonneveld'
  //   example 2: base64_decode('YQ==')
  //   returns 2: 'a'
  //   example 3: base64_decode('4pyTIMOgIGxhIG1vZGU=')
  //   returns 3: '✓ à la mode'

  // decodeUTF8string()
  // Internal function to decode properly UTF8 string
  // Adapted from Solution #1 at https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
  var decodeUTF8string = function (str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(str.split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
  }

  if (typeof window !== 'undefined') {
    if (typeof window.atob !== 'undefined') {
      return decodeUTF8string(window.atob(encodedData))
    }
  } else {
    return new Buffer(encodedData, 'base64').toString('utf-8')
  }

  var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  var o1
  var o2
  var o3
  var h1
  var h2
  var h3
  var h4
  var bits
  var i = 0
  var ac = 0
  var dec = ''
  var tmpArr = []

  if (!encodedData) {
    return encodedData
  }

  encodedData += ''

  do {
    // unpack four hexets into three octets using index points in b64
    h1 = b64.indexOf(encodedData.charAt(i++))
    h2 = b64.indexOf(encodedData.charAt(i++))
    h3 = b64.indexOf(encodedData.charAt(i++))
    h4 = b64.indexOf(encodedData.charAt(i++))

    bits = h1 << 18 | h2 << 12 | h3 << 6 | h4

    o1 = bits >> 16 & 0xff
    o2 = bits >> 8 & 0xff
    o3 = bits & 0xff

    if (h3 === 64) {
      tmpArr[ac++] = String.fromCharCode(o1)
    } else if (h4 === 64) {
      tmpArr[ac++] = String.fromCharCode(o1, o2)
    } else {
      tmpArr[ac++] = String.fromCharCode(o1, o2, o3)
    }
  } while (i < encodedData.length)

  dec = tmpArr.join('')

  return decodeUTF8string(dec.replace(/\0+$/, ''))
}
//------------------------------------------------------------------------------
function base64_encode(stringToEncode) { // eslint-disable-line camelcase
  //  discuss at: http://locutus.io/php/base64_encode/
  // original by: Tyler Akins (http://rumkin.com)
  // improved by: Bayron Guevara
  // improved by: Thunder.m
  // improved by: Kevin van Zonneveld (http://kvz.io)
  // improved by: Kevin van Zonneveld (http://kvz.io)
  // improved by: Rafał Kukawski (http://blog.kukawski.pl)
  // bugfixed by: Pellentesque Malesuada
  // improved by: Indigo744
  //   example 1: base64_encode('Kevin van Zonneveld')
  //   returns 1: 'S2V2aW4gdmFuIFpvbm5ldmVsZA=='
  //   example 2: base64_encode('a')
  //   returns 2: 'YQ=='
  //   example 3: base64_encode('✓ à la mode')
  //   returns 3: '4pyTIMOgIGxhIG1vZGU='

  // encodeUTF8string()
  // Internal function to encode properly UTF8 string
  // Adapted from Solution #1 at https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
  var encodeUTF8string = function (str) {
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into the base64 encoding algorithm.
    return encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      function toSolidBytes (match, p1) {
        return String.fromCharCode('0x' + p1)
      })
  }

  if (typeof window !== 'undefined') {
    if (typeof window.btoa !== 'undefined') {
      return window.btoa(encodeUTF8string(stringToEncode))
    }
  } else {
    return new Buffer(stringToEncode).toString('base64')
  }

  var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  var o1
  var o2
  var o3
  var h1
  var h2
  var h3
  var h4
  var bits
  var i = 0
  var ac = 0
  var enc = ''
  var tmpArr = []

  if (!stringToEncode) {
    return stringToEncode
  }

  stringToEncode = encodeUTF8string(stringToEncode)

  do {
    // pack three octets into four hexets
    o1 = stringToEncode.charCodeAt(i++)
    o2 = stringToEncode.charCodeAt(i++)
    o3 = stringToEncode.charCodeAt(i++)

    bits = o1 << 16 | o2 << 8 | o3

    h1 = bits >> 18 & 0x3f
    h2 = bits >> 12 & 0x3f
    h3 = bits >> 6 & 0x3f
    h4 = bits & 0x3f

    // use hexets to index into b64, and append result to encoded string
    tmpArr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4)
  } while (i < stringToEncode.length)

  enc = tmpArr.join('')

  var r = stringToEncode.length % 3

  return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3)
}
//------------------------------------------------------------------------------
function get_browser() {

	let ua = navigator.userAgent, tem, M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];

	if( /trident/i.test(M[1]) ) {

		tem = /\brv[ :]+(\d+)/g.exec(ua) || []; 

        return { name: 'IE', version : (tem[1] || '') };

	}   

    if( M[1] === 'Chrome' ) {

		tem = ua.match(/\bOPR\/(\d+)/);

        if( tem != null )
			return { name : 'Opera', version : tem[1] };

    }   

	M = M[2]? [ M[1], M[2] ] : [ navigator.appName, navigator.appVersion, '-?' ];

	if( ( tem = ua.match(/version\/(\d+)/i)) != null )
		M.splice(1, 1, tem[1]);

	return { name : M[0], version: M[1] };

}
//------------------------------------------------------------------------------
// https://weblog.west-wind.com/posts/2014/jan/06/javascript-json-date-parsing-and-real-dates
//------------------------------------------------------------------------------
if( window.JSON && !window.JSON.dateParser ) {

	// http://stackoverflow.com/a/37563868
	/**
	 * RegExp to test a string for a ISO 8601 Date spec
	 *  YYYY
	 *  YYYY-MM
	 *  YYYY-MM-DD
	 *  YYYY-MM-DDThh:mmTZD
	 *  YYYY-MM-DDThh:mm:ssTZD
	 *  YYYY-MM-DDThh:mm:ss.sTZD
	 * @see: https://www.w3.org/TR/NOTE-datetime
	 * @type {RegExp}
	 */
	let ISO_8601 = /^\d{4}(-\d\d(-\d\d(T\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z)?)?)?)?$/i

	/**
	 * RegExp to test a string for a full ISO 8601 Date
	 * Does not do any sort of date validation, only checks if the string is according to the ISO 8601 spec.
	 *  YYYY-MM-DDThh:mm:ss
	 *  YYYY-MM-DDThh:mm:ssTZD
	 *  YYYY-MM-DDThh:mm:ss.sTZD
	 * @see: https://www.w3.org/TR/NOTE-datetime
	 * @type {RegExp}
	 */
	let ISO_8601_FULL = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i

	let reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
	//let reMsAjax = /^\/Date\((d|-|.*)\)[\/|\\]$/;
   
	JSON.dateParser = function (key, value) {

		if( typeof value === 'string' ) {

			let a = ISO_8601_FULL.exec(value);

			if( a )
				return new Date(value);

			/*let a = reISO.exec(value);

			if( a )
				return new Date(value);

			a = reMsAjax.exec(value);

			if( a ) {
				let b = a[1].split(/[-+,.]/);
				return new Date(b[0] ? +b[0] : 0 - +b[1]);
			}*/

		}

		return value;
	};

}
//------------------------------------------------------------------------------
function res() {
	let one = { dpi: 96, dpcm: 96 / 2.54, dpmm: 96 / 25.4 };
	let ie = () => {
		return Math.sqrt(screen.deviceXDPI * screen.deviceYDPI) / one.dpi;
	};
	let dppx = () => {
		// devicePixelRatio: Webkit (Chrome/Android/Safari), Opera (Presto 2.8+), FF 18+
		let dpp = Math.min(+window.devicePixelRatio, 1.5);
		return typeof window === 'undefined' ? 0 : +dpp || ie() || 0;
	};
	let dpcm = () => {
    	return dppx() * one.dpcm;
	};
	let dpmm = () => {
    	return dppx() * one.dpmm;
	};
	let dpi = () => {
		return dppx() * one.dpi;
	};

	return { 'dppx' : dppx(), 'dpi' : dpi(), 'dpcm' : dpcm(), 'dpmm' : dpmm() };
}
//------------------------------------------------------------------------------
function window_size() {
	//window.devicePixelRatio = 1;
	return [
		window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
		window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
		window.devicePixelRatio
	];
}
//------------------------------------------------------------------------------
function doFullScreen() {

	let isInFullScreen = (document.fullScreenElement && document.fullScreenElement !== null) ||    // alternative standard method  
		(document.mozFullScreen || document.webkitIsFullScreen);

	let docElm = document.documentElement;

	if( !isInFullScreen ) {

		if( docElm.requestFullscreen ) {
			docElm.requestFullscreen();
		}
		else if( docElm.mozRequestFullScreen ) {
			docElm.mozRequestFullScreen();
			//alert("Mozilla entering fullscreen!");
		}
		else if( docElm.webkitRequestFullScreen ) {
			docElm.webkitRequestFullScreen();
			//alert("Webkit entering fullscreen!");
		}
	}
}
//------------------------------------------------------------------------------
function location_search(query) {
	let q = query ? query : location.search;

	return (/^[?#]/.test(q) ? q.slice(1) : q).
    	split('&').
		reduce((params, param) => {
			let [ k, v ] = param.split('=');

			if( k.length !== 0 ) {
				k = decodeURIComponent(k.replace(/\+/g, ' '));
				v = v && v.length !== 0 ? decodeURIComponent(v.replace(/\+/g, ' ')) : true;
				params[k] = v;
			}

			return params;
		}, {});
}
//------------------------------------------------------------------------------
// http://stackoverflow.com/a/1042676
// extends 'from' object with members from 'to'. If 'to' is null, a deep clone of 'from' is returned
function extend_object(from, to = null) {

    if( from == null || typeof from != 'object' )
		return from;

    if( from.constructor != Object && from.constructor != Array )
		return from;

    if( from.constructor == Date || from.constructor == RegExp || from.constructor == Function ||
		from.constructor == String || from.constructor == Number || from.constructor == Boolean )
		return new from.constructor(from);

	to = to || new from.constructor();

    for( let name in from )
		to[name] = typeof to[name] == 'undefined' ? extend_object(from[name], null) : to[name];

    return to;

}
//------------------------------------------------------------------------------
HTMLElement.prototype.getCoords = function () { // crossbrowser version
	let elem = this;
	let box = elem.getBoundingClientRect();

	let body = document.body;
	let docEl = document.documentElement;

	let scrollTop = window.pageYOffset  || docEl.scrollTop  || body.scrollTop;
	let scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

	let clientTop = docEl.clientTop   || body.clientTop  || 0;
	let clientLeft = docEl.clientLeft || body.clientLeft || 0;

	return {
		top		: box.top    + scrollTop  - clientTop,
		left	: box.left   + scrollLeft - clientLeft,
		bottom	: box.bottom + scrollTop  - clientTop,
		right	: box.right  + scrollLeft - clientLeft,
		width	: box.width,
		height	: box.height
	};
}
//------------------------------------------------------------------------------
HTMLElement.prototype.fade_state = undefined;
//------------------------------------------------------------------------------
HTMLElement.prototype.fadein = function () {

	if( this.attributes.fadeout )
		this.removeAttribute('fadeout');

	this.fade_state = true;
	this.setAttribute('fadein', '');
	this.style.display = 'inline-block';

	return this;

};
//------------------------------------------------------------------------------
HTMLElement.prototype.fadeout = function (display = 'none') {

	if( this.attributes.fadein )
		this.removeAttribute('fadein');

	this.fade_state = false;
	this.setAttribute('fadeout', '');
	this.style.display = display;

	return this;

};
//------------------------------------------------------------------------------
HTMLElement.prototype.fade = function (v, display = 'none') {

	if( this.fade_state === v )
		return;

	if( v )
		this.fadein();
	else
		this.fadeout(display);

	return this;

};
//------------------------------------------------------------------------------
HTMLElement.prototype.display = function (v, display_values = [ 'none', 'inline-block' ] ) {

	this.style.display = display_values[v ? 1 : 0];

	return this;

};
//------------------------------------------------------------------------------
HTMLElement.prototype.blink = function (v) {

	if( this.attributes.blink )
		this.removeAttribute('blink');

	if( v )
		this.setAttribute('blink', '');

	return this;

};
//------------------------------------------------------------------------------
HTMLElement.prototype.ascend = function (path, any = false) {

	let a = path.split('/');
	let b = any ? a.length : 1;

	for( let j = 0; j < b; j++ ) {

		let p = this.parentNode;
		let i = j;

		while( i < a.length ) {

			if( !p.attributes[a[i]] )
				break;

			p = p.parentNode;
			i++;

		}

		if( i === a.length )
			return true;

	}

	return false;

};
//------------------------------------------------------------------------------
String.prototype.isEmpty = function () {
    return this.length === 0 || !this.trim();
};
//------------------------------------------------------------------------------
function htmlspecialchars(string, quoteStyle, charset, doubleEncode) {
  //       discuss at: http://locutus.io/php/htmlspecialchars/
  //      original by: Mirek Slugen
  //      improved by: Kevin van Zonneveld (http://kvz.io)
  //      bugfixed by: Nathan
  //      bugfixed by: Arno
  //      bugfixed by: Brett Zamir (http://brett-zamir.me)
  //      bugfixed by: Brett Zamir (http://brett-zamir.me)
  //       revised by: Kevin van Zonneveld (http://kvz.io)
  //         input by: Ratheous
  //         input by: Mailfaker (http://www.weedem.fr/)
  //         input by: felix
  // reimplemented by: Brett Zamir (http://brett-zamir.me)
  //           note 1: charset argument not supported
  //        example 1: htmlspecialchars("<a href='test'>Test</a>", 'ENT_QUOTES')
  //        returns 1: '&lt;a href=&#039;test&#039;&gt;Test&lt;/a&gt;'
  //        example 2: htmlspecialchars("ab\"c'd", ['ENT_NOQUOTES', 'ENT_QUOTES'])
  //        returns 2: 'ab"c&#039;d'
  //        example 3: htmlspecialchars('my "&entity;" is still here', null, null, false)
  //        returns 3: 'my &quot;&entity;&quot; is still here'

  var optTemp = 0
  var i = 0
  var noquotes = false
  if (typeof quoteStyle === 'undefined' || quoteStyle === null) {
    quoteStyle = 2
  }
  string = string || ''
  string = string.toString()

  if (doubleEncode !== false) {
    // Put this first to avoid double-encoding
    string = string.replace(/&/g, '&amp;')
  }

  string = string
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  var OPTS = {
    'ENT_NOQUOTES': 0,
    'ENT_HTML_QUOTE_SINGLE': 1,
    'ENT_HTML_QUOTE_DOUBLE': 2,
    'ENT_COMPAT': 2,
    'ENT_QUOTES': 3,
    'ENT_IGNORE': 4
  }
  if (quoteStyle === 0) {
    noquotes = true
  }
  if (typeof quoteStyle !== 'number') {
    // Allow for a single string or an array of string flags
    quoteStyle = [].concat(quoteStyle)
    for (i = 0; i < quoteStyle.length; i++) {
      // Resolve string input to bitwise e.g. 'ENT_IGNORE' becomes 4
      if (OPTS[quoteStyle[i]] === 0) {
        noquotes = true
      } else if (OPTS[quoteStyle[i]]) {
        optTemp = optTemp | OPTS[quoteStyle[i]]
      }
    }
    quoteStyle = optTemp
  }
  if (quoteStyle & OPTS.ENT_HTML_QUOTE_SINGLE) {
    string = string.replace(/'/g, '&#039;')
  }
  if (!noquotes) {
    string = string.replace(/"/g, '&quot;')
  }

  return string
}
//------------------------------------------------------------------------------
function sprintf () {
  //  discuss at: http://locutus.io/php/sprintf/
  // original by: Ash Searle (http://hexmen.com/blog/)
  // improved by: Michael White (http://getsprink.com)
  // improved by: Jack
  // improved by: Kevin van Zonneveld (http://kvz.io)
  // improved by: Kevin van Zonneveld (http://kvz.io)
  // improved by: Kevin van Zonneveld (http://kvz.io)
  // improved by: Dj
  // improved by: Allidylls
  //    input by: Paulo Freitas
  //    input by: Brett Zamir (http://brett-zamir.me)
  //   example 1: sprintf("%01.2f", 123.1)
  //   returns 1: '123.10'
  //   example 2: sprintf("[%10s]", 'monkey')
  //   returns 2: '[    monkey]'
  //   example 3: sprintf("[%'#10s]", 'monkey')
  //   returns 3: '[####monkey]'
  //   example 4: sprintf("%d", 123456789012345)
  //   returns 4: '123456789012345'
  //   example 5: sprintf('%-03s', 'E')
  //   returns 5: 'E00'

  var regex = /%%|%(\d+\$)?([\-+'#0 ]*)(\*\d+\$|\*|\d+)?(?:\.(\*\d+\$|\*|\d+))?([scboxXuideEfFgG])/g
  var a = arguments
  var i = 0
  var format = a[i++]

  var _pad = function (str, len, chr, leftJustify) {
    if (!chr) {
      chr = ' '
    }
    var padding = (str.length >= len) ? '' : new Array(1 + len - str.length >>> 0).join(chr)
    return leftJustify ? str + padding : padding + str
  }

  var justify = function (value, prefix, leftJustify, minWidth, zeroPad, customPadChar) {
    var diff = minWidth - value.length
    if (diff > 0) {
      if (leftJustify || !zeroPad) {
        value = _pad(value, minWidth, customPadChar, leftJustify)
      } else {
        value = [
          value.slice(0, prefix.length),
          _pad('', diff, '0', true),
          value.slice(prefix.length)
        ].join('')
      }
    }
    return value
  }

  var _formatBaseX = function (value, base, prefix, leftJustify, minWidth, precision, zeroPad) {
    // Note: casts negative numbers to positive ones
    var number = value >>> 0
    prefix = (prefix && number && {
      '2': '0b',
      '8': '0',
      '16': '0x'
    }[base]) || ''
    value = prefix + _pad(number.toString(base), precision || 0, '0', false)
    return justify(value, prefix, leftJustify, minWidth, zeroPad)
  }

  // _formatString()
  var _formatString = function (value, leftJustify, minWidth, precision, zeroPad, customPadChar) {
    if (precision !== null && precision !== undefined) {
      value = value.slice(0, precision)
    }
    return justify(value, '', leftJustify, minWidth, zeroPad, customPadChar)
  }

  // doFormat()
  var doFormat = function (substring, valueIndex, flags, minWidth, precision, type) {
    var number, prefix, method, textTransform, value

    if (substring === '%%') {
      return '%'
    }

    // parse flags
    var leftJustify = false
    var positivePrefix = ''
    var zeroPad = false
    var prefixBaseX = false
    var customPadChar = ' '
    var flagsl = flags.length
    var j
    for (j = 0; j < flagsl; j++) {
      switch( flags.charAt(j) ) {
        case ' ':
          positivePrefix = ' '
          break
        case '+':
          positivePrefix = '+'
          break
        case '-':
          leftJustify = true
          break
        case "'":
          customPadChar = flags.charAt(j + 1)
          break
        case '0':
          zeroPad = true
          customPadChar = '0'
          break
        case '#':
          prefixBaseX = true
          break
      }
    }

    // parameters may be null, undefined, empty-string or real valued
    // we want to ignore null, undefined and empty-string values
    if (!minWidth) {
      minWidth = 0
    } else if (minWidth === '*') {
      minWidth = +a[i++]
    } else if (minWidth.charAt(0) === '*') {
      minWidth = +a[minWidth.slice(1, -1)]
    } else {
      minWidth = +minWidth
    }

    // Note: undocumented perl feature:
    if (minWidth < 0) {
      minWidth = -minWidth
      leftJustify = true
    }

    if (!isFinite(minWidth)) {
      throw new Error('sprintf: (minimum-)width must be finite')
    }

    if (!precision) {
      precision = 'fFeE'.indexOf(type) > -1 ? 6 : (type === 'd') ? 0 : undefined
    } else if (precision === '*') {
      precision = +a[i++]
    } else if (precision.charAt(0) === '*') {
      precision = +a[precision.slice(1, -1)]
    } else {
      precision = +precision
    }

    // grab value using valueIndex if required?
    value = valueIndex ? a[valueIndex.slice(0, -1)] : a[i++]

    switch (type) {
      case 's':
        return _formatString(value + '', leftJustify, minWidth, precision, zeroPad, customPadChar)
      case 'c':
        return _formatString(String.fromCharCode(+value), leftJustify, minWidth, precision, zeroPad)
      case 'b':
        return _formatBaseX(value, 2, prefixBaseX, leftJustify, minWidth, precision, zeroPad)
      case 'o':
        return _formatBaseX(value, 8, prefixBaseX, leftJustify, minWidth, precision, zeroPad)
      case 'x':
        return _formatBaseX(value, 16, prefixBaseX, leftJustify, minWidth, precision, zeroPad)
      case 'X':
        return _formatBaseX(value, 16, prefixBaseX, leftJustify, minWidth, precision, zeroPad)
        .toUpperCase()
      case 'u':
        return _formatBaseX(value, 10, prefixBaseX, leftJustify, minWidth, precision, zeroPad)
      case 'i':
      case 'd':
        number = +value || 0
        // Plain Math.round doesn't just truncate
        number = Math.round(number - number % 1)
        prefix = number < 0 ? '-' : positivePrefix
        value = prefix + _pad(String(Math.abs(number)), precision, '0', false)
        return justify(value, prefix, leftJustify, minWidth, zeroPad)
      case 'e':
      case 'E':
      case 'f': // @todo: Should handle locales (as per setlocale)
      case 'F':
      case 'g':
      case 'G':
        number = +value
        prefix = number < 0 ? '-' : positivePrefix
        method = ['toExponential', 'toFixed', 'toPrecision']['efg'.indexOf(type.toLowerCase())]
        textTransform = ['toString', 'toUpperCase']['eEfFgG'.indexOf(type) % 2]
        value = prefix + Math.abs(number)[method](precision)
        return justify(value, prefix, leftJustify, minWidth, zeroPad)[textTransform]()
      default:
        return substring
    }
  }

  return format.replace(regex, doFormat)
}
//------------------------------------------------------------------------------
function sscanf (str, format) {
  //  discuss at: http://locutus.io/php/sscanf/
  // original by: Brett Zamir (http://brett-zamir.me)
  //   example 1: sscanf('SN/2350001', 'SN/%d')
  //   returns 1: [2350001]
  //   example 2: var myVar = {}
  //   example 2: sscanf('SN/2350001', 'SN/%d', myVar)
  //   example 2: var $result = myVar.value
  //   returns 2: 2350001
  //   example 3: sscanf("10--20", "%2$d--%1$d") // Must escape '$' in PHP, but not JS
  //   returns 3: [20, 10]

  var retArr = []
  var _NWS = /\S/
  var args = arguments
  var digit

  var _setExtraConversionSpecs = function (offset) {
    // Since a mismatched character sets us off track from future
    // legitimate finds, we just scan
    // to the end for any other conversion specifications (besides a percent literal),
    // setting them to null
    // sscanf seems to disallow all conversion specification components (of sprintf)
    // except for type specifiers
    // Do not allow % in last char. class
    // var matches = format.match(/%[+-]?([ 0]|'.)?-?\d*(\.\d+)?[bcdeufFosxX]/g);
    // Do not allow % in last char. class:
    var matches = format.slice(offset).match(/%[cdeEufgosxX]/g)
    // b, F,G give errors in PHP, but 'g', though also disallowed, doesn't
    if (matches) {
      var lgth = matches.length
      while (lgth--) {
        retArr.push(null)
      }
    }
    return _finish()
  }

  var _finish = function () {
    if (args.length === 2) {
      return retArr
    }
    for (var i = 0; i < retArr.length; ++i) {
      args[i + 2].value = retArr[i]
    }
    return i
  }

  var _addNext = function (j, regex, cb) {
    if (assign) {
      var remaining = str.slice(j)
      var check = width ? remaining.substr(0, width) : remaining
      var match = regex.exec(check)
      // @todo: Make this more readable
      var key = digit !== undefined
        ? digit
        : retArr.length
      var testNull = retArr[key] = match
          ? (cb
            ? cb.apply(null, match)
            : match[0])
          : null
      if (testNull === null) {
        throw new Error('No match in string')
      }
      return j + match[0].length
    }
    return j
  }

  if (arguments.length < 2) {
    throw new Error('Not enough arguments passed to sscanf')
  }

  // PROCESS
  for (var i = 0, j = 0; i < format.length; i++) {
    var width = 0
    var assign = true

    if (format.charAt(i) === '%') {
      if (format.charAt(i + 1) === '%') {
        if (str.charAt(j) === '%') {
          // a matched percent literal
          // skip beyond duplicated percent
          ++i
          ++j
          continue
        }
        // Format indicated a percent literal, but not actually present
        return _setExtraConversionSpecs(i + 2)
      }

      // CHARACTER FOLLOWING PERCENT IS NOT A PERCENT

      // We need 'g' set to get lastIndex
      var prePattern = new RegExp('^(?:(\\d+)\\$)?(\\*)?(\\d*)([hlL]?)', 'g')

      var preConvs = prePattern.exec(format.slice(i + 1))

      var tmpDigit = digit
      if (tmpDigit && preConvs[1] === undefined) {
        var msg = 'All groups in sscanf() must be expressed as numeric if '
        msg += 'any have already been used'
        throw new Error(msg)
      }
      digit = preConvs[1] ? parseInt(preConvs[1], 10) - 1 : undefined

      assign = !preConvs[2]
      width = parseInt(preConvs[3], 10)
      var sizeCode = preConvs[4]
      i += prePattern.lastIndex

      // @todo: Does PHP do anything with these? Seems not to matter
      if (sizeCode) {
        // This would need to be processed later
        switch (sizeCode) {
          case 'h':
          case 'l':
          case 'L':
            // Treats subsequent as short int (for d,i,n) or unsigned short int (for o,u,x)
            // Treats subsequent as long int (for d,i,n), or unsigned long int (for o,u,x);
            //    or as double (for e,f,g) instead of float or wchar_t instead of char
            // Treats subsequent as long double (for e,f,g)
            break
          default:
            throw new Error('Unexpected size specifier in sscanf()!')
        }
      }
      // PROCESS CHARACTER
      try {
        // For detailed explanations, see http://web.archive.org/web/20031128125047/http://www.uwm.edu/cgi-bin/IMT/wwwman?topic=scanf%283%29&msection=
        // Also http://www.mathworks.com/access/helpdesk/help/techdoc/ref/sscanf.html
        // p, S, C arguments in C function not available
        // DOCUMENTED UNDER SSCANF
        switch (format.charAt(i + 1)) {
          case 'F':
            // Not supported in PHP sscanf; the argument is treated as a float, and
            //  presented as a floating-point number (non-locale aware)
            // sscanf doesn't support locales, so no need for two (see %f)
            break
          case 'g':
            // Not supported in PHP sscanf; shorter of %e and %f
            // Irrelevant to input conversion
            break
          case 'G':
            // Not supported in PHP sscanf; shorter of %E and %f
            // Irrelevant to input conversion
            break
          case 'b':
            // Not supported in PHP sscanf; the argument is treated as an integer,
            // and presented as a binary number
            // Not supported - couldn't distinguish from other integers
            break
          case 'i':
            // Integer with base detection (Equivalent of 'd', but base 0 instead of 10)
            var pattern = /([+-])?(?:(?:0x([\da-fA-F]+))|(?:0([0-7]+))|(\d+))/
            j = _addNext(j, pattern, function (num, sign, hex,
            oct, dec) {
              return hex ? parseInt(num, 16) : oct ? parseInt(num, 8) : parseInt(num, 10)
            })
            break
          case 'n':
            // Number of characters processed so far
            retArr[digit !== undefined ? digit : retArr.length - 1] = j
            break
            // DOCUMENTED UNDER SPRINTF
          case 'c':
            // Get character; suppresses skipping over whitespace!
            // (but shouldn't be whitespace in format anyways, so no difference here)
            // Non-greedy match
            j = _addNext(j, new RegExp('.{1,' + (width || 1) + '}'))
            break
          case 'D':
          case 'd':
            // sscanf documented decimal number; equivalent of 'd';
            // Optionally signed decimal integer
            j = _addNext(j, /([+-])?(?:0*)(\d+)/, function (num, sign, dec) {
              // Ignores initial zeroes, unlike %i and parseInt()
              var decInt = parseInt((sign || '') + dec, 10)
              if (decInt < 0) {
                // PHP also won't allow less than -2147483648
                // integer overflow with negative
                return decInt < -2147483648 ? -2147483648 : decInt
              } else {
                // PHP also won't allow greater than -2147483647
                return decInt < 2147483647 ? decInt : 2147483647
              }
            })
            break
          case 'f':
          case 'E':
          case 'e':
            // Although sscanf doesn't support locales,
            // this is used instead of '%F'; seems to be same as %e
            // These don't discriminate here as both allow exponential float of either case
            j = _addNext(j, /([+-])?(?:0*)(\d*\.?\d*(?:[eE]?\d+)?)/, function (num, sign, dec) {
              if (dec === '.') {
                return null
              }
              // Ignores initial zeroes, unlike %i and parseFloat()
              return parseFloat((sign || '') + dec)
            })
            break
          case 'u':
            // unsigned decimal integer
            // We won't deal with integer overflows due to signs
            j = _addNext(j, /([+-])?(?:0*)(\d+)/, function (num, sign, dec) {
              // Ignores initial zeroes, unlike %i and parseInt()
              var decInt = parseInt(dec, 10)
              if (sign === '-') {
                // PHP also won't allow greater than 4294967295
                // integer overflow with negative
                return 4294967296 - decInt
              } else {
                return decInt < 4294967295 ? decInt : 4294967295
              }
            })
            break
          case 'o':
              // Octal integer // @todo: add overflows as above?
            j = _addNext(j, /([+-])?(?:0([0-7]+))/, function (num, sign, oct) {
              return parseInt(num, 8)
            })
            break
          case 's':
            // Greedy match
            j = _addNext(j, /\S+/)
            break
          case 'X':
          case 'x':
          // Same as 'x'?
            // @todo: add overflows as above?
            // Initial 0x not necessary here
            j = _addNext(j, /([+-])?(?:(?:0x)?([\da-fA-F]+))/, function (num, sign, hex) {
              return parseInt(num, 16)
            })
            break
          case '':
            // If no character left in expression
            throw new Error('Missing character after percent mark in sscanf() format argument')
          default:
            throw new Error('Unrecognized character after percent mark in sscanf() format argument')
        }
      } catch (e) {
        if (e === 'No match in string') {
          // Allow us to exit
          return _setExtraConversionSpecs(i + 2)
        }
        // Calculate skipping beyond initial percent too
      }
      ++i
    } else if (format.charAt(i) !== str.charAt(j)) {
        // @todo: Double-check i whitespace ignored in string and/or formats
      _NWS.lastIndex = 0
      if ((_NWS)
        .test(str.charAt(j)) || str.charAt(j) === '') {
        // Whitespace doesn't need to be an exact match)
        return _setExtraConversionSpecs(i + 1)
      } else {
        // Adjust strings when encounter non-matching whitespace,
        // so they align in future checks above
        // Ok to replace with j++;?
        str = str.slice(0, j) + str.slice(j + 1)
        i--
      }
    } else {
      j++
    }
  }

  // POST-PROCESSING
  return _finish()
}
//------------------------------------------------------------------------------
function round(value, precision, mode) {
  //  discuss at: http://locutus.io/php/round/
  // original by: Philip Peterson
  //  revised by: Onno Marsman (https://twitter.com/onnomarsman)
  //  revised by: T.Wild
  //  revised by: Rafal Kukawski (http://blog.kukawski.pl)
  //    input by: Greenseed
  //    input by: meo
  //    input by: William
  //    input by: Josep Sanz (http://www.ws3.es/)
  // bugfixed by: Brett Zamir (http://brett-zamir.me)
  //      note 1: Great work. Ideas for improvement:
  //      note 1: - code more compliant with developer guidelines
  //      note 1: - for implementing PHP constant arguments look at
  //      note 1: the pathinfo() function, it offers the greatest
  //      note 1: flexibility & compatibility possible
  //   example 1: round(1241757, -3)
  //   returns 1: 1242000
  //   example 2: round(3.6)
  //   returns 2: 4
  //   example 3: round(2.835, 2)
  //   returns 3: 2.84
  //   example 4: round(1.1749999999999, 2)
  //   returns 4: 1.17
  //   example 5: round(58551.799999999996, 2)
  //   returns 5: 58551.8

  var m, f, isHalf, sgn // helper variables
  // making sure precision is integer
  precision |= 0
  m = Math.pow(10, precision)
  value *= m
  // sign of the number
  sgn = (value > 0) | -(value < 0)
  isHalf = value % 1 === 0.5 * sgn
  f = Math.floor(value)

  if (isHalf) {
    switch (mode) {
      case 'PHP_ROUND_HALF_DOWN':
      // rounds .5 toward zero
        value = f + (sgn < 0)
        break
      case 'PHP_ROUND_HALF_EVEN':
      // rouds .5 towards the next even integer
        value = f + (f % 2 * sgn)
        break
      case 'PHP_ROUND_HALF_ODD':
      // rounds .5 towards the next odd integer
        value = f + !(f % 2)
        break
      default:
      // rounds .5 away from zero
        value = f + (sgn > 0)
    }
  }

  return (isHalf ? value : Math.round(value)) / m
}
//------------------------------------------------------------------------------
function sleep(ms) {

    let unixtime_ms = new Date().getTime();

    while( new Date().getTime() < unixtime_ms + ms ) {}

}
//------------------------------------------------------------------------------
function mili_time() {

	let t = new Date;

	return t.getTime();
	//return t.getUTCSeconds() * 1000 + t.getUTCMilliseconds();
	//return window.performance.timing.navigationStart + window.performance.now();

}
//------------------------------------------------------------------------------
function ellapsed_time_string(ms) {

	if( ms < 0 )
		ms = 0;

	let a		= Math.trunc(ms / 1000);
	let days	= Math.trunc(a / (60 * 60 * 24));
	let hours	= Math.trunc(a / (60 * 60)) - days * 24;
	let mins	= Math.trunc(a / 60) - days * 24 * 60 - hours * 60;
	let secs	= a - days * 24 * 60 * 60 - hours * 60 * 60 - mins * 60;
	let msecs	= ms % 1000;
	let s;

	if( days !== 0 )
		s = sprintf('%u:%02u:%02u:%02u.%03u', days, hours, mins, secs, msecs);
	else if( hours !== 0 )
		s = sprintf('%u:%02u:%02u.%03u', hours, mins, secs, msecs);
	else if( mins !== 0 )
		s = sprintf('%u:%02u.%03u', mins, secs, msecs);
	else if( secs !== 0 )
		s = sprintf('%u.%03u', secs, msecs);
	else
		s = sprintf('.%03u', msecs);

	return s;

}
//------------------------------------------------------------------------------
function distribute_proportionally(value, coefficients, precision = 2, check_zero_values = true) {

	if( coefficients.length === 0 || (check_zero_values && value == 0) || value === null )
		return undefined;

	let imax = 0, vmax = 0, sd = 0, sc = 0;
	
	for( let k = 0; k < coefficients.length; k++ ) {
		
		let number_module = coefficients[k] > 0 ? coefficients[k] : -coefficients[k];
		
		if( vmax < number_module ) {
			vmax = number_module;
			imax = k;
		}
		
		sc = sc + coefficients[k];
		
	}
	
	if( sc === 0 )
		return undefined;
	
	values = new Array(coefficients.length);
	
	for( let k = 0; k < coefficients.length; k++ ) {
		values[k] = round(value * coefficients[k] / sc, precision);
		sd = sd + values[k];
	}
	
	// Погрешности округления отнесем на коэффицент с максимальным весом
	if( sd !== value )
		values[imax] = values[imax] + value - sd;

	return values;

}
//------------------------------------------------------------------------------
function xpath_eval(path, parent = undefined, document_node = null) {

	let doc = document_node === null ? document : document_node;
	let it = doc.evaluate(path, parent ? parent : doc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
	let a = [];
	
	for( let e; e = it.iterateNext(); )
		a.push(e);

	return a;

}
//------------------------------------------------------------------------------
function xpath_eval_single(path, parent = undefined, document_node = null) {

	let a = xpath_eval(path, parent, document_node);

	if( a.length > 1 )
		throw new Error('evaluate return multiple elements');

	if( a.length == 0 )
		throw new Error('evaluate return no result');

	return a[0];

}
//------------------------------------------------------------------------------
function xpath_single(path, parent = undefined, document_node = null) {

	let doc = document_node === null ? document : document_node;
	let result = doc.evaluate(path, parent ? parent : doc, null, XPathResult.ANY_UNORDERED_NODE_TYPE, null);

	return result.singleNodeValue;

}
//------------------------------------------------------------------------------
function add_event(obj, type, fn, phase = true) {

	if( obj.addEventListener ) {

		obj.addEventListener(type, fn, phase);

	}
	else if( obj.attachEvent ) {

		obj.attachEvent('on' + type, function () {
			return fn.apply(obj, [window.event]);
		});

	}
	else {
		obj['on' + type] = fn;
	}

}
//------------------------------------------------------------------------------
/*
 * http://stackoverflow.com/questions/287903/enums-in-javascript/29074825#29074825
 * usage:
 * var KeyCodes = define_enum({	VK_CANCEL : 3 });
 *
 *				switch( event.keyCode ) {
 *					case KeyCodes.VK_UP		:
 *						grid.moveCursor_(-1, 0);
 *						break;
 *					case KeyCodes.VK_DOWN	:
 *						grid.moveCursor_(+1, 0);
 *						break; 
 * 					case KeyCodes.VK_LEFT	:
 *						grid.moveCursor_(0, -1);
 *						break;
 *					case KeyCodes.VK_RIGHT	:
 *						grid.moveCursor_(0, +1);
 *						break;
 *				};
 */
function define_enum(list) {

	for( var key in list )
		list[list[key] = list[key]] = key;

	return Object.freeze(list);
}
//------------------------------------------------------------------------------
