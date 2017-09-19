function load_tag(tag, type, url, callback) {

	let find_tag = () => {
		let s = document.getElementsByTagName(tag);

		if( s[Symbol.iterator] ) {
			for( let e of s )
				if( e.attributes.src && e.attributes.src.value === url )
					return true;
		}
		else {
			// fix: android browser: Uncaught TypeError: [Symbol.iterator] is not a function
			for( let i = 0; i < s.length; i++ ) {
				let e = s.item(i);
				if( e.attributes.src && e.attributes.src.value === url )
					return true;
			}
		}

		return false;
	};

	if( find_tag() ) {
		console.log(tag + ' already loaded:', url);

		if( typeof callback === 'function' )
			callback(false);

		return;
	}

	console.log('load ' + tag + ':', url);

	let e		= document.createElement(tag);
	e.setAttribute('rel', 'stylesheet');
	e.setAttribute('type', type);
	e.setAttribute('href', url);
	e.type		= type;
	e.src		= url;

	if( typeof callback === 'function' )
		e.onload = () => callback(true);

	document.getElementsByTagName('head')[0].appendChild(e);
}
//------------------------------------------------------------------------------
function load_script(url, callback) {
	return load_tag('script', 'text/javascript', url, callback);
}
//------------------------------------------------------------------------------
function load_css(url, callback) {
	return load_tag('link', 'text/css', url, callback);
}
//------------------------------------------------------------------------------
function core_gear_loader() {
	let qp = location_search();
	let md = new MobileDetect(window.navigator.userAgent);

	let style_id = (() => {
		let a = new Uint32Array(3);
		window.crypto.getRandomValues(a);
		return a[0].toString() + a[1].toString() + a[2].toString();
	})();

	let resizer = e => {
		let r = res();
		let desktop = !SmartPhone.isAny() && !md.mobile() && !md.tablet() && !md.phone();
		let pxr = window.devicePixelRatio || (screen.availWidth / document.documentElement.clientWidth);
		let ww = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
		let wh = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
		let portrait = screen.width <= screen.height;
		let landscape = screen.width > screen.height;
		let mww, mwh;

		if( portrait ) {
			mww = window.maxPortraitWidth = window.maxPortraitWidth === undefined || window.maxPortraitWidth < ww ? ww : window.maxPortraitWidth;
			mwh = window.maxPortraitHeight = window.maxPortraitHeight === undefined || window.maxPortraitHeight < wh ? wh : window.maxPortraitHeight;
		}

		if( landscape ) {
			mww = window.maxLandscapeWidth = window.maxLandscapeWidth === undefined || window.maxLandscapeWidth < ww ? ww : window.maxLandscapeWidth;
			mwh = window.maxLandscapeHeight = window.maxLandscapeHeight === undefined || window.maxLandscapeHeight < wh ? wh : window.maxLandscapeHeight;
		}

		let phone = SmartPhone.isAny() || md.phone();
		let tablet = md.tablet();

		let html = `
			:root {
				--dppx					: ${r.dppx}px;
				--dpi					: ${r.dpi}px;
				--dpcm					: ${r.dpcm}px;
				--dpmm					: ${r.dpmm}px;
				--desktop				: ${desktop ? 1 : 0};
				--not-desktop			: ${desktop ? 0 : 1};
				--tablet				: ${tablet ? 1 : 0};
				--not-tablet			: ${tablet ? 0 : 1};
				--smart-phone			: ${phone ? 1 : 0};
				--not-smart-phone		: ${phone ? 0 : 1};
				--window-width			: ${ww}px;
				--window-height			: ${wh}px;
				--max-window-width		: ${mww}px;
				--max-window-height		: ${mwh}px;
				--screen-pixel-ratio	: ${pxr};
				--screen-width			: ${screen.width}px;
				--screen-height			: ${screen.height}px;
				--screen-avail-width	: ${screen.availWidth}px;
				--screen-avail-height	: ${screen.availHeight}px;
				--screen-aspect-ratio	: ${screen.width / screen.height};
				--screen-portrait		: ${portrait ? 1 : 0};
				--screen-landscape		: ${landscape ? 1 : 0};
				--debug					: ${qp.dbg || qp.debug ? 1 : 0};
			}
		`;

		let style = document.getElementById(style_id);

		if( !style ) {
			style = document.createElement('style');
			style.setAttribute('id', style_id);
			let head = document.getElementsByTagName('head')[0];
			head.appendChild(style);
		}

		style.innerHTML = html;
	};

	resizer();

	add_event(window, 'resize', resizer, false);

	(qp.dct ?
    	() => load_css('css/default.css',
		() => load_css('css/load.css',
		() => load_css('css/dct.css',
		() => core())))
		:
	    () => load_css('css/default.css',
		() => load_css('css/load.css',
		() => core())))();
}
//------------------------------------------------------------------------------
function core_chain_loader() {
	      load_script('js/misc.js',
	() => load_script('js/verge.js',
	() => load_script('js/hashes.js',
	() => load_script('js/xhrs.js',
	() => load_script('js/idle.js',
	() => load_script('js/sseq.js',
	() => load_script('js/barcode.js',
	() => load_script('js/core-estimator.js',
	() => load_script('js/detect-browser.js',
	() => load_script('js/mobile-detect.js',
	() => load_script('js/core.js', core_gear_loader)))))))))));
}
//------------------------------------------------------------------------------
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
		return typeof window == 'undefined' ? 0 : +dpp || ie() || 0;
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
/*!
 * verge 1.10.2+201705300050
 * http://npm.im/verge
 * MIT Ryan Van Etten
 */

!function(root, name, make) {
  if (typeof module != 'undefined' && module['exports']) module['exports'] = make();
  else root[name] = make();
}(this, 'verge', function() {

  var xports = {}
    , win = typeof window != 'undefined' && window
    , doc = typeof document != 'undefined' && document
    , docElem = doc && doc.documentElement
    , matchMedia = win['matchMedia'] || win['msMatchMedia']
    , mq = matchMedia ? function(q) {
        return !!matchMedia.call(win, q).matches;
      } : function() {
        return false;
      }
    , viewportW = xports['viewportW'] = function() {
        var a = docElem['clientWidth'], b = win['innerWidth'];
        return a < b ? b : a;
      }
    , viewportH = xports['viewportH'] = function() {
        var a = docElem['clientHeight'], b = win['innerHeight'];
        return a < b ? b : a;
      };

  /**
   * Test if a media query is active. Like Modernizr.mq
   * @since 1.6.0
   * @return {boolean}
   */
  xports['mq'] = mq;

  /**
   * Normalized matchMedia
   * @since 1.6.0
   * @return {MediaQueryList|Object}
   */
  xports['matchMedia'] = matchMedia ? function() {
    // matchMedia must be binded to window
    return matchMedia.apply(win, arguments);
  } : function() {
    // Gracefully degrade to plain object
    return {};
  };

  /**
   * @since 1.8.0
   * @return {{width:number, height:number}}
   */
  function viewport() {
    return {'width':viewportW(), 'height':viewportH()};
  }
  xports['viewport'] = viewport;

  /**
   * Cross-browser window.scrollX
   * @since 1.0.0
   * @return {number}
   */
  xports['scrollX'] = function() {
    return win.pageXOffset || docElem.scrollLeft;
  };

  /**
   * Cross-browser window.scrollY
   * @since 1.0.0
   * @return {number}
   */
  xports['scrollY'] = function() {
    return win.pageYOffset || docElem.scrollTop;
  };

  /**
   * @param {{top:number, right:number, bottom:number, left:number}} coords
   * @param {number=} cushion adjustment
   * @return {Object}
   */
  function calibrate(coords, cushion) {
    var o = {};
    cushion = +cushion || 0;
    o['width'] = (o['right'] = coords['right'] + cushion) - (o['left'] = coords['left'] - cushion);
    o['height'] = (o['bottom'] = coords['bottom'] + cushion) - (o['top'] = coords['top'] - cushion);
    return o;
  }

  /**
   * Cross-browser element.getBoundingClientRect plus optional cushion.
   * Coords are relative to the top-left corner of the viewport.
   * @since 1.0.0
   * @param {Element|Object} el element or stack (uses first item)
   * @param {number=} cushion +/- pixel adjustment amount
   * @return {Object|boolean}
   */
  function rectangle(el, cushion) {
    el = el && !el.nodeType ? el[0] : el;
    if (!el || 1 !== el.nodeType) return false;
    return calibrate(el.getBoundingClientRect(), cushion);
  }
  xports['rectangle'] = rectangle;

  /**
   * Get the viewport aspect ratio (or the aspect ratio of an object or element)
   * @since 1.7.0
   * @param {(Element|Object)=} o optional object with width/height props or methods
   * @return {number}
   * @link http://w3.org/TR/css3-mediaqueries/#orientation
   */
  function aspect(o) {
    o = null == o ? viewport() : 1 === o.nodeType ? rectangle(o) : o;
    var h = o['height'], w = o['width'];
    h = typeof h == 'function' ? h.call(o) : h;
    w = typeof w == 'function' ? w.call(o) : w;
    return w/h;
  }
  xports['aspect'] = aspect;

  /**
   * Test if an element is in the same x-axis section as the viewport.
   * @since 1.0.0
   * @param {Element|Object} el
   * @param {number=} cushion
   * @return {boolean}
   */
  xports['inX'] = function(el, cushion) {
    var r = rectangle(el, cushion);
    return !!r && r.right >= 0 && r.left <= viewportW();
  };

  /**
   * Test if an element is in the same y-axis section as the viewport.
   * @since 1.0.0
   * @param {Element|Object} el
   * @param {number=} cushion
   * @return {boolean}
   */
  xports['inY'] = function(el, cushion) {
    var r = rectangle(el, cushion);
    return !!r && r.bottom >= 0 && r.top <= viewportH();
  };

  /**
   * Test if an element is in the viewport.
   * @since 1.0.0
   * @param {Element|Object} el
   * @param {number=} cushion
   * @return {boolean}
   */
  xports['inViewport'] = function(el, cushion) {
    // Equiv to `inX(el, cushion) && inY(el, cushion)` but just manually do both
    // to avoid calling rectangle() twice. It gzips just as small like this.
    var r = rectangle(el, cushion);
    return !!r && r.bottom >= 0 && r.right >= 0 && r.top <= viewportH() && r.left <= viewportW();
  };

  return xports;
});
/**
 * jshashes - https://github.com/h2non/jshashes
 * Released under the "New BSD" license
 *
 * Algorithms specification:
 *
 * MD5 - http://www.ietf.org/rfc/rfc1321.txt
 * RIPEMD-160 - http://homes.esat.kuleuven.be/~bosselae/ripemd160.html
 * SHA1   - http://csrc.nist.gov/publications/fips/fips180-4/fips-180-4.pdf
 * SHA256 - http://csrc.nist.gov/publications/fips/fips180-4/fips-180-4.pdf
 * SHA512 - http://csrc.nist.gov/publications/fips/fips180-4/fips-180-4.pdf
 * HMAC - http://www.ietf.org/rfc/rfc2104.txt
 */
(function() {
  var Hashes;

  function utf8Encode(str) {
    var x, y, output = '',
      i = -1,
      l;

    if (str && str.length) {
      l = str.length;
      while ((i += 1) < l) {
        /* Decode utf-16 surrogate pairs */
        x = str.charCodeAt(i);
        y = i + 1 < l ? str.charCodeAt(i + 1) : 0;
        if (0xD800 <= x && x <= 0xDBFF && 0xDC00 <= y && y <= 0xDFFF) {
          x = 0x10000 + ((x & 0x03FF) << 10) + (y & 0x03FF);
          i += 1;
        }
        /* Encode output as utf-8 */
        if (x <= 0x7F) {
          output += String.fromCharCode(x);
        } else if (x <= 0x7FF) {
          output += String.fromCharCode(0xC0 | ((x >>> 6) & 0x1F),
            0x80 | (x & 0x3F));
        } else if (x <= 0xFFFF) {
          output += String.fromCharCode(0xE0 | ((x >>> 12) & 0x0F),
            0x80 | ((x >>> 6) & 0x3F),
            0x80 | (x & 0x3F));
        } else if (x <= 0x1FFFFF) {
          output += String.fromCharCode(0xF0 | ((x >>> 18) & 0x07),
            0x80 | ((x >>> 12) & 0x3F),
            0x80 | ((x >>> 6) & 0x3F),
            0x80 | (x & 0x3F));
        }
      }
    }
    return output;
  }

  function utf8Decode(str) {
    var i, ac, c1, c2, c3, arr = [],
      l;
    i = ac = c1 = c2 = c3 = 0;

    if (str && str.length) {
      l = str.length;
      str += '';

      while (i < l) {
        c1 = str.charCodeAt(i);
        ac += 1;
        if (c1 < 128) {
          arr[ac] = String.fromCharCode(c1);
          i += 1;
        } else if (c1 > 191 && c1 < 224) {
          c2 = str.charCodeAt(i + 1);
          arr[ac] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
          i += 2;
        } else {
          c2 = str.charCodeAt(i + 1);
          c3 = str.charCodeAt(i + 2);
          arr[ac] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
          i += 3;
        }
      }
    }
    return arr.join('');
  }

  /**
   * Add integers, wrapping at 2^32. This uses 16-bit operations internally
   * to work around bugs in some JS interpreters.
   */

  function safe_add(x, y) {
    var lsw = (x & 0xFFFF) + (y & 0xFFFF),
      msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
  }

  /**
   * Bitwise rotate a 32-bit number to the left.
   */

  function bit_rol(num, cnt) {
    return (num << cnt) | (num >>> (32 - cnt));
  }

  /**
   * Convert a raw string to a hex string
   */

  function rstr2hex(input, hexcase) {
    var hex_tab = hexcase ? '0123456789ABCDEF' : '0123456789abcdef',
      output = '',
      x, i = 0,
      l = input.length;
    for (; i < l; i += 1) {
      x = input.charCodeAt(i);
      output += hex_tab.charAt((x >>> 4) & 0x0F) + hex_tab.charAt(x & 0x0F);
    }
    return output;
  }

  /**
   * Encode a string as utf-16
   */

  function str2rstr_utf16le(input) {
    var i, l = input.length,
      output = '';
    for (i = 0; i < l; i += 1) {
      output += String.fromCharCode(input.charCodeAt(i) & 0xFF, (input.charCodeAt(i) >>> 8) & 0xFF);
    }
    return output;
  }

  function str2rstr_utf16be(input) {
    var i, l = input.length,
      output = '';
    for (i = 0; i < l; i += 1) {
      output += String.fromCharCode((input.charCodeAt(i) >>> 8) & 0xFF, input.charCodeAt(i) & 0xFF);
    }
    return output;
  }

  /**
   * Convert an array of big-endian words to a string
   */

  function binb2rstr(input) {
    var i, l = input.length * 32,
      output = '';
    for (i = 0; i < l; i += 8) {
      output += String.fromCharCode((input[i >> 5] >>> (24 - i % 32)) & 0xFF);
    }
    return output;
  }

  /**
   * Convert an array of little-endian words to a string
   */

  function binl2rstr(input) {
    var i, l = input.length * 32,
      output = '';
    for (i = 0; i < l; i += 8) {
      output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xFF);
    }
    return output;
  }

  /**
   * Convert a raw string to an array of little-endian words
   * Characters >255 have their high-byte silently ignored.
   */

  function rstr2binl(input) {
    var i, l = input.length * 8,
      output = Array(input.length >> 2),
      lo = output.length;
    for (i = 0; i < lo; i += 1) {
      output[i] = 0;
    }
    for (i = 0; i < l; i += 8) {
      output[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << (i % 32);
    }
    return output;
  }

  /**
   * Convert a raw string to an array of big-endian words
   * Characters >255 have their high-byte silently ignored.
   */

  function rstr2binb(input) {
    var i, l = input.length * 8,
      output = Array(input.length >> 2),
      lo = output.length;
    for (i = 0; i < lo; i += 1) {
      output[i] = 0;
    }
    for (i = 0; i < l; i += 8) {
      output[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << (24 - i % 32);
    }
    return output;
  }

  /**
   * Convert a raw string to an arbitrary string encoding
   */

  function rstr2any(input, encoding) {
    var divisor = encoding.length,
      remainders = Array(),
      i, q, x, ld, quotient, dividend, output, full_length;

    /* Convert to an array of 16-bit big-endian values, forming the dividend */
    dividend = Array(Math.ceil(input.length / 2));
    ld = dividend.length;
    for (i = 0; i < ld; i += 1) {
      dividend[i] = (input.charCodeAt(i * 2) << 8) | input.charCodeAt(i * 2 + 1);
    }

    /**
     * Repeatedly perform a long division. The binary array forms the dividend,
     * the length of the encoding is the divisor. Once computed, the quotient
     * forms the dividend for the next step. We stop when the dividend is zerHashes.
     * All remainders are stored for later use.
     */
    while (dividend.length > 0) {
      quotient = Array();
      x = 0;
      for (i = 0; i < dividend.length; i += 1) {
        x = (x << 16) + dividend[i];
        q = Math.floor(x / divisor);
        x -= q * divisor;
        if (quotient.length > 0 || q > 0) {
          quotient[quotient.length] = q;
        }
      }
      remainders[remainders.length] = x;
      dividend = quotient;
    }

    /* Convert the remainders to the output string */
    output = '';
    for (i = remainders.length - 1; i >= 0; i--) {
      output += encoding.charAt(remainders[i]);
    }

    /* Append leading zero equivalents */
    full_length = Math.ceil(input.length * 8 / (Math.log(encoding.length) / Math.log(2)));
    for (i = output.length; i < full_length; i += 1) {
      output = encoding[0] + output;
    }
    return output;
  }

  /**
   * Convert a raw string to a base-64 string
   */

  function rstr2b64(input, b64pad) {
    var tab = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
      output = '',
      len = input.length,
      i, j, triplet;
    b64pad = b64pad || '=';
    for (i = 0; i < len; i += 3) {
      triplet = (input.charCodeAt(i) << 16) | (i + 1 < len ? input.charCodeAt(i + 1) << 8 : 0) | (i + 2 < len ? input.charCodeAt(i + 2) : 0);
      for (j = 0; j < 4; j += 1) {
        if (i * 8 + j * 6 > input.length * 8) {
          output += b64pad;
        } else {
          output += tab.charAt((triplet >>> 6 * (3 - j)) & 0x3F);
        }
      }
    }
    return output;
  }

  Hashes = {
    /**
     * @property {String} version
     * @readonly
     */
    VERSION: '1.0.5',
    /**
     * @member Hashes
     * @class Base64
     * @constructor
     */
    Base64: function() {
      // private properties
      var tab = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
        pad = '=', // default pad according with the RFC standard
        url = false, // URL encoding support @todo
        utf8 = true; // by default enable UTF-8 support encoding

      // public method for encoding
      this.encode = function(input) {
        var i, j, triplet,
          output = '',
          len = input.length;

        pad = pad || '=';
        input = (utf8) ? utf8Encode(input) : input;

        for (i = 0; i < len; i += 3) {
          triplet = (input.charCodeAt(i) << 16) | (i + 1 < len ? input.charCodeAt(i + 1) << 8 : 0) | (i + 2 < len ? input.charCodeAt(i + 2) : 0);
          for (j = 0; j < 4; j += 1) {
            if (i * 8 + j * 6 > len * 8) {
              output += pad;
            } else {
              output += tab.charAt((triplet >>> 6 * (3 - j)) & 0x3F);
            }
          }
        }
        return output;
      };

      // public method for decoding
      this.decode = function(input) {
        // var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        var i, o1, o2, o3, h1, h2, h3, h4, bits, ac,
          dec = '',
          arr = [];
        if (!input) {
          return input;
        }

        i = ac = 0;
        input = input.replace(new RegExp('\\' + pad, 'gi'), ''); // use '='
        //input += '';

        do { // unpack four hexets into three octets using index points in b64
          h1 = tab.indexOf(input.charAt(i += 1));
          h2 = tab.indexOf(input.charAt(i += 1));
          h3 = tab.indexOf(input.charAt(i += 1));
          h4 = tab.indexOf(input.charAt(i += 1));

          bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

          o1 = bits >> 16 & 0xff;
          o2 = bits >> 8 & 0xff;
          o3 = bits & 0xff;
          ac += 1;

          if (h3 === 64) {
            arr[ac] = String.fromCharCode(o1);
          } else if (h4 === 64) {
            arr[ac] = String.fromCharCode(o1, o2);
          } else {
            arr[ac] = String.fromCharCode(o1, o2, o3);
          }
        } while (i < input.length);

        dec = arr.join('');
        dec = (utf8) ? utf8Decode(dec) : dec;

        return dec;
      };

      // set custom pad string
      this.setPad = function(str) {
        pad = str || pad;
        return this;
      };
      // set custom tab string characters
      this.setTab = function(str) {
        tab = str || tab;
        return this;
      };
      this.setUTF8 = function(bool) {
        if (typeof bool === 'boolean') {
          utf8 = bool;
        }
        return this;
      };
    },

    /**
     * CRC-32 calculation
     * @member Hashes
     * @method CRC32
     * @static
     * @param {String} str Input String
     * @return {String}
     */
    CRC32: function(str) {
      var crc = 0,
        x = 0,
        y = 0,
        table, i, iTop;
      str = utf8Encode(str);

      table = [
        '00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 ',
        '79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 ',
        '84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F ',
        '63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD ',
        'A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC ',
        '51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 ',
        'B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 ',
        '06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 ',
        'E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 ',
        '12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 ',
        'D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 ',
        '33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 ',
        'CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 ',
        '9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E ',
        '7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D ',
        '806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 ',
        '60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA ',
        'AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 ',
        '5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 ',
        'B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 ',
        '05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 ',
        'F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA ',
        '11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 ',
        'D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F ',
        '30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E ',
        'C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D'
      ].join('');

      crc = crc ^ (-1);
      for (i = 0, iTop = str.length; i < iTop; i += 1) {
        y = (crc ^ str.charCodeAt(i)) & 0xFF;
        x = '0x' + table.substr(y * 9, 8);
        crc = (crc >>> 8) ^ x;
      }
      // always return a positive number (that's what >>> 0 does)
      return (crc ^ (-1)) >>> 0;
    },
    /**
     * @member Hashes
     * @class MD5
     * @constructor
     * @param {Object} [config]
     *
     * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
     * Digest Algorithm, as defined in RFC 1321.
     * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
     * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
     * See <http://pajhome.org.uk/crypt/md5> for more infHashes.
     */
    MD5: function(options) {
      /**
       * Private config properties. You may need to tweak these to be compatible with
       * the server-side, but the defaults work in most cases.
       * See {@link Hashes.MD5#method-setUpperCase} and {@link Hashes.SHA1#method-setUpperCase}
       */
      var hexcase = (options && typeof options.uppercase === 'boolean') ? options.uppercase : false, // hexadecimal output case format. false - lowercase; true - uppercase
        b64pad = (options && typeof options.pad === 'string') ? options.pda : '=', // base-64 pad character. Defaults to '=' for strict RFC compliance
        utf8 = (options && typeof options.utf8 === 'boolean') ? options.utf8 : true; // enable/disable utf8 encoding

      // privileged (public) methods
      this.hex = function(s) {
        return rstr2hex(rstr(s, utf8), hexcase);
      };
      this.b64 = function(s) {
        return rstr2b64(rstr(s), b64pad);
      };
      this.any = function(s, e) {
        return rstr2any(rstr(s, utf8), e);
      };
      this.raw = function(s) {
        return rstr(s, utf8);
      };
      this.hex_hmac = function(k, d) {
        return rstr2hex(rstr_hmac(k, d), hexcase);
      };
      this.b64_hmac = function(k, d) {
        return rstr2b64(rstr_hmac(k, d), b64pad);
      };
      this.any_hmac = function(k, d, e) {
        return rstr2any(rstr_hmac(k, d), e);
      };
      /**
       * Perform a simple self-test to see if the VM is working
       * @return {String} Hexadecimal hash sample
       */
      this.vm_test = function() {
        return hex('abc').toLowerCase() === '900150983cd24fb0d6963f7d28e17f72';
      };
      /**
       * Enable/disable uppercase hexadecimal returned string
       * @param {Boolean}
       * @return {Object} this
       */
      this.setUpperCase = function(a) {
        if (typeof a === 'boolean') {
          hexcase = a;
        }
        return this;
      };
      /**
       * Defines a base64 pad string
       * @param {String} Pad
       * @return {Object} this
       */
      this.setPad = function(a) {
        b64pad = a || b64pad;
        return this;
      };
      /**
       * Defines a base64 pad string
       * @param {Boolean}
       * @return {Object} [this]
       */
      this.setUTF8 = function(a) {
        if (typeof a === 'boolean') {
          utf8 = a;
        }
        return this;
      };

      // private methods

      /**
       * Calculate the MD5 of a raw string
       */

      function rstr(s) {
        s = (utf8) ? utf8Encode(s) : s;
        return binl2rstr(binl(rstr2binl(s), s.length * 8));
      }

      /**
       * Calculate the HMAC-MD5, of a key and some data (raw strings)
       */

      function rstr_hmac(key, data) {
        var bkey, ipad, opad, hash, i;

        key = (utf8) ? utf8Encode(key) : key;
        data = (utf8) ? utf8Encode(data) : data;
        bkey = rstr2binl(key);
        if (bkey.length > 16) {
          bkey = binl(bkey, key.length * 8);
        }

        ipad = Array(16), opad = Array(16);
        for (i = 0; i < 16; i += 1) {
          ipad[i] = bkey[i] ^ 0x36363636;
          opad[i] = bkey[i] ^ 0x5C5C5C5C;
        }
        hash = binl(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
        return binl2rstr(binl(opad.concat(hash), 512 + 128));
      }

      /**
       * Calculate the MD5 of an array of little-endian words, and a bit length.
       */

      function binl(x, len) {
        var i, olda, oldb, oldc, oldd,
          a = 1732584193,
          b = -271733879,
          c = -1732584194,
          d = 271733878;

        /* append padding */
        x[len >> 5] |= 0x80 << ((len) % 32);
        x[(((len + 64) >>> 9) << 4) + 14] = len;

        for (i = 0; i < x.length; i += 16) {
          olda = a;
          oldb = b;
          oldc = c;
          oldd = d;

          a = md5_ff(a, b, c, d, x[i + 0], 7, -680876936);
          d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
          c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
          b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
          a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
          d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
          c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
          b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
          a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
          d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
          c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
          b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
          a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
          d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
          c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
          b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);

          a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
          d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
          c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
          b = md5_gg(b, c, d, a, x[i + 0], 20, -373897302);
          a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
          d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
          c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
          b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
          a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
          d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
          c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
          b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
          a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
          d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
          c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
          b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);

          a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
          d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
          c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
          b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
          a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
          d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
          c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
          b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
          a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
          d = md5_hh(d, a, b, c, x[i + 0], 11, -358537222);
          c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
          b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
          a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
          d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
          c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
          b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);

          a = md5_ii(a, b, c, d, x[i + 0], 6, -198630844);
          d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
          c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
          b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
          a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
          d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
          c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
          b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
          a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
          d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
          c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
          b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
          a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
          d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
          c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
          b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);

          a = safe_add(a, olda);
          b = safe_add(b, oldb);
          c = safe_add(c, oldc);
          d = safe_add(d, oldd);
        }
        return Array(a, b, c, d);
      }

      /**
       * These functions implement the four basic operations the algorithm uses.
       */

      function md5_cmn(q, a, b, x, s, t) {
        return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
      }

      function md5_ff(a, b, c, d, x, s, t) {
        return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
      }

      function md5_gg(a, b, c, d, x, s, t) {
        return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
      }

      function md5_hh(a, b, c, d, x, s, t) {
        return md5_cmn(b ^ c ^ d, a, b, x, s, t);
      }

      function md5_ii(a, b, c, d, x, s, t) {
        return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
      }
    },
    /**
     * @member Hashes
     * @class Hashes.SHA1
     * @param {Object} [config]
     * @constructor
     *
     * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined in FIPS 180-1
     * Version 2.2 Copyright Paul Johnston 2000 - 2009.
     * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
     * See http://pajhome.org.uk/crypt/md5 for details.
     */
    SHA1: function(options) {
      /**
       * Private config properties. You may need to tweak these to be compatible with
       * the server-side, but the defaults work in most cases.
       * See {@link Hashes.MD5#method-setUpperCase} and {@link Hashes.SHA1#method-setUpperCase}
       */
      var hexcase = (options && typeof options.uppercase === 'boolean') ? options.uppercase : false, // hexadecimal output case format. false - lowercase; true - uppercase
        b64pad = (options && typeof options.pad === 'string') ? options.pda : '=', // base-64 pad character. Defaults to '=' for strict RFC compliance
        utf8 = (options && typeof options.utf8 === 'boolean') ? options.utf8 : true; // enable/disable utf8 encoding

      // public methods
      this.hex = function(s) {
        return rstr2hex(rstr(s, utf8), hexcase);
      };
      this.b64 = function(s) {
        return rstr2b64(rstr(s, utf8), b64pad);
      };
      this.any = function(s, e) {
        return rstr2any(rstr(s, utf8), e);
      };
      this.raw = function(s) {
        return rstr(s, utf8);
      };
      this.hex_hmac = function(k, d) {
        return rstr2hex(rstr_hmac(k, d));
      };
      this.b64_hmac = function(k, d) {
        return rstr2b64(rstr_hmac(k, d), b64pad);
      };
      this.any_hmac = function(k, d, e) {
        return rstr2any(rstr_hmac(k, d), e);
      };
      /**
       * Perform a simple self-test to see if the VM is working
       * @return {String} Hexadecimal hash sample
       * @public
       */
      this.vm_test = function() {
        return hex('abc').toLowerCase() === '900150983cd24fb0d6963f7d28e17f72';
      };
      /**
       * @description Enable/disable uppercase hexadecimal returned string
       * @param {boolean}
       * @return {Object} this
       * @public
       */
      this.setUpperCase = function(a) {
        if (typeof a === 'boolean') {
          hexcase = a;
        }
        return this;
      };
      /**
       * @description Defines a base64 pad string
       * @param {string} Pad
       * @return {Object} this
       * @public
       */
      this.setPad = function(a) {
        b64pad = a || b64pad;
        return this;
      };
      /**
       * @description Defines a base64 pad string
       * @param {boolean}
       * @return {Object} this
       * @public
       */
      this.setUTF8 = function(a) {
        if (typeof a === 'boolean') {
          utf8 = a;
        }
        return this;
      };

      // private methods

      /**
       * Calculate the SHA-512 of a raw string
       */

      function rstr(s) {
        s = (utf8) ? utf8Encode(s) : s;
        return binb2rstr(binb(rstr2binb(s), s.length * 8));
      }

      /**
       * Calculate the HMAC-SHA1 of a key and some data (raw strings)
       */

      function rstr_hmac(key, data) {
        var bkey, ipad, opad, i, hash;
        key = (utf8) ? utf8Encode(key) : key;
        data = (utf8) ? utf8Encode(data) : data;
        bkey = rstr2binb(key);

        if (bkey.length > 16) {
          bkey = binb(bkey, key.length * 8);
        }
        ipad = Array(16), opad = Array(16);
        for (i = 0; i < 16; i += 1) {
          ipad[i] = bkey[i] ^ 0x36363636;
          opad[i] = bkey[i] ^ 0x5C5C5C5C;
        }
        hash = binb(ipad.concat(rstr2binb(data)), 512 + data.length * 8);
        return binb2rstr(binb(opad.concat(hash), 512 + 160));
      }

      /**
       * Calculate the SHA-1 of an array of big-endian words, and a bit length
       */

      function binb(x, len) {
        var i, j, t, olda, oldb, oldc, oldd, olde,
          w = Array(80),
          a = 1732584193,
          b = -271733879,
          c = -1732584194,
          d = 271733878,
          e = -1009589776;

        /* append padding */
        x[len >> 5] |= 0x80 << (24 - len % 32);
        x[((len + 64 >> 9) << 4) + 15] = len;

        for (i = 0; i < x.length; i += 16) {
          olda = a,
          oldb = b;
          oldc = c;
          oldd = d;
          olde = e;

          for (j = 0; j < 80; j += 1) {
            if (j < 16) {
              w[j] = x[i + j];
            } else {
              w[j] = bit_rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
            }
            t = safe_add(safe_add(bit_rol(a, 5), sha1_ft(j, b, c, d)),
              safe_add(safe_add(e, w[j]), sha1_kt(j)));
            e = d;
            d = c;
            c = bit_rol(b, 30);
            b = a;
            a = t;
          }

          a = safe_add(a, olda);
          b = safe_add(b, oldb);
          c = safe_add(c, oldc);
          d = safe_add(d, oldd);
          e = safe_add(e, olde);
        }
        return Array(a, b, c, d, e);
      }

      /**
       * Perform the appropriate triplet combination function for the current
       * iteration
       */

      function sha1_ft(t, b, c, d) {
        if (t < 20) {
          return (b & c) | ((~b) & d);
        }
        if (t < 40) {
          return b ^ c ^ d;
        }
        if (t < 60) {
          return (b & c) | (b & d) | (c & d);
        }
        return b ^ c ^ d;
      }

      /**
       * Determine the appropriate additive constant for the current iteration
       */

      function sha1_kt(t) {
        return (t < 20) ? 1518500249 : (t < 40) ? 1859775393 :
          (t < 60) ? -1894007588 : -899497514;
      }
    },
    /**
     * @class Hashes.SHA256
     * @param {config}
     *
     * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined in FIPS 180-2
     * Version 2.2 Copyright Angel Marin, Paul Johnston 2000 - 2009.
     * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
     * See http://pajhome.org.uk/crypt/md5 for details.
     * Also http://anmar.eu.org/projects/jssha2/
     */
    SHA256: function(options) {
      /**
       * Private properties configuration variables. You may need to tweak these to be compatible with
       * the server-side, but the defaults work in most cases.
       * @see this.setUpperCase() method
       * @see this.setPad() method
       */
      var hexcase = (options && typeof options.uppercase === 'boolean') ? options.uppercase : false, // hexadecimal output case format. false - lowercase; true - uppercase  */
        b64pad = (options && typeof options.pad === 'string') ? options.pda : '=',
        /* base-64 pad character. Default '=' for strict RFC compliance   */
        utf8 = (options && typeof options.utf8 === 'boolean') ? options.utf8 : true,
        /* enable/disable utf8 encoding */
        sha256_K;

      /* privileged (public) methods */
      this.hex = function(s) {
        return rstr2hex(rstr(s, utf8));
      };
      this.b64 = function(s) {
        return rstr2b64(rstr(s, utf8), b64pad);
      };
      this.any = function(s, e) {
        return rstr2any(rstr(s, utf8), e);
      };
      this.raw = function(s) {
        return rstr(s, utf8);
      };
      this.hex_hmac = function(k, d) {
        return rstr2hex(rstr_hmac(k, d));
      };
      this.b64_hmac = function(k, d) {
        return rstr2b64(rstr_hmac(k, d), b64pad);
      };
      this.any_hmac = function(k, d, e) {
        return rstr2any(rstr_hmac(k, d), e);
      };
      /**
       * Perform a simple self-test to see if the VM is working
       * @return {String} Hexadecimal hash sample
       * @public
       */
      this.vm_test = function() {
        return hex('abc').toLowerCase() === '900150983cd24fb0d6963f7d28e17f72';
      };
      /**
       * Enable/disable uppercase hexadecimal returned string
       * @param {boolean}
       * @return {Object} this
       * @public
       */
      this.setUpperCase = function(a) {
        if (typeof a === 'boolean') {
          hexcase = a;
        }
        return this;
      };
      /**
       * @description Defines a base64 pad string
       * @param {string} Pad
       * @return {Object} this
       * @public
       */
      this.setPad = function(a) {
        b64pad = a || b64pad;
        return this;
      };
      /**
       * Defines a base64 pad string
       * @param {boolean}
       * @return {Object} this
       * @public
       */
      this.setUTF8 = function(a) {
        if (typeof a === 'boolean') {
          utf8 = a;
        }
        return this;
      };

      // private methods

      /**
       * Calculate the SHA-512 of a raw string
       */

      function rstr(s, utf8) {
        s = (utf8) ? utf8Encode(s) : s;
        return binb2rstr(binb(rstr2binb(s), s.length * 8));
      }

      /**
       * Calculate the HMAC-sha256 of a key and some data (raw strings)
       */

      function rstr_hmac(key, data) {
        key = (utf8) ? utf8Encode(key) : key;
        data = (utf8) ? utf8Encode(data) : data;
        var hash, i = 0,
          bkey = rstr2binb(key),
          ipad = Array(16),
          opad = Array(16);

        if (bkey.length > 16) {
          bkey = binb(bkey, key.length * 8);
        }

        for (; i < 16; i += 1) {
          ipad[i] = bkey[i] ^ 0x36363636;
          opad[i] = bkey[i] ^ 0x5C5C5C5C;
        }

        hash = binb(ipad.concat(rstr2binb(data)), 512 + data.length * 8);
        return binb2rstr(binb(opad.concat(hash), 512 + 256));
      }

      /*
       * Main sha256 function, with its support functions
       */

      function sha256_S(X, n) {
        return (X >>> n) | (X << (32 - n));
      }

      function sha256_R(X, n) {
        return (X >>> n);
      }

      function sha256_Ch(x, y, z) {
        return ((x & y) ^ ((~x) & z));
      }

      function sha256_Maj(x, y, z) {
        return ((x & y) ^ (x & z) ^ (y & z));
      }

      function sha256_Sigma0256(x) {
        return (sha256_S(x, 2) ^ sha256_S(x, 13) ^ sha256_S(x, 22));
      }

      function sha256_Sigma1256(x) {
        return (sha256_S(x, 6) ^ sha256_S(x, 11) ^ sha256_S(x, 25));
      }

      function sha256_Gamma0256(x) {
        return (sha256_S(x, 7) ^ sha256_S(x, 18) ^ sha256_R(x, 3));
      }

      function sha256_Gamma1256(x) {
        return (sha256_S(x, 17) ^ sha256_S(x, 19) ^ sha256_R(x, 10));
      }

      function sha256_Sigma0512(x) {
        return (sha256_S(x, 28) ^ sha256_S(x, 34) ^ sha256_S(x, 39));
      }

      function sha256_Sigma1512(x) {
        return (sha256_S(x, 14) ^ sha256_S(x, 18) ^ sha256_S(x, 41));
      }

      function sha256_Gamma0512(x) {
        return (sha256_S(x, 1) ^ sha256_S(x, 8) ^ sha256_R(x, 7));
      }

      function sha256_Gamma1512(x) {
        return (sha256_S(x, 19) ^ sha256_S(x, 61) ^ sha256_R(x, 6));
      }

      sha256_K = [
        1116352408, 1899447441, -1245643825, -373957723, 961987163, 1508970993, -1841331548, -1424204075, -670586216, 310598401, 607225278, 1426881987,
        1925078388, -2132889090, -1680079193, -1046744716, -459576895, -272742522,
        264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, -1740746414, -1473132947, -1341970488, -1084653625, -958395405, -710438585,
        113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291,
        1695183700, 1986661051, -2117940946, -1838011259, -1564481375, -1474664885, -1035236496, -949202525, -778901479, -694614492, -200395387, 275423344,
        430227734, 506948616, 659060556, 883997877, 958139571, 1322822218,
        1537002063, 1747873779, 1955562222, 2024104815, -2067236844, -1933114872, -1866530822, -1538233109, -1090935817, -965641998
      ];

      function binb(m, l) {
        var HASH = [1779033703, -1150833019, 1013904242, -1521486534,
          1359893119, -1694144372, 528734635, 1541459225
        ];
        var W = new Array(64);
        var a, b, c, d, e, f, g, h;
        var i, j, T1, T2;

        /* append padding */
        m[l >> 5] |= 0x80 << (24 - l % 32);
        m[((l + 64 >> 9) << 4) + 15] = l;

        for (i = 0; i < m.length; i += 16) {
          a = HASH[0];
          b = HASH[1];
          c = HASH[2];
          d = HASH[3];
          e = HASH[4];
          f = HASH[5];
          g = HASH[6];
          h = HASH[7];

          for (j = 0; j < 64; j += 1) {
            if (j < 16) {
              W[j] = m[j + i];
            } else {
              W[j] = safe_add(safe_add(safe_add(sha256_Gamma1256(W[j - 2]), W[j - 7]),
                sha256_Gamma0256(W[j - 15])), W[j - 16]);
            }

            T1 = safe_add(safe_add(safe_add(safe_add(h, sha256_Sigma1256(e)), sha256_Ch(e, f, g)),
              sha256_K[j]), W[j]);
            T2 = safe_add(sha256_Sigma0256(a), sha256_Maj(a, b, c));
            h = g;
            g = f;
            f = e;
            e = safe_add(d, T1);
            d = c;
            c = b;
            b = a;
            a = safe_add(T1, T2);
          }

          HASH[0] = safe_add(a, HASH[0]);
          HASH[1] = safe_add(b, HASH[1]);
          HASH[2] = safe_add(c, HASH[2]);
          HASH[3] = safe_add(d, HASH[3]);
          HASH[4] = safe_add(e, HASH[4]);
          HASH[5] = safe_add(f, HASH[5]);
          HASH[6] = safe_add(g, HASH[6]);
          HASH[7] = safe_add(h, HASH[7]);
        }
        return HASH;
      }

    },

    /**
     * @class Hashes.SHA512
     * @param {config}
     *
     * A JavaScript implementation of the Secure Hash Algorithm, SHA-512, as defined in FIPS 180-2
     * Version 2.2 Copyright Anonymous Contributor, Paul Johnston 2000 - 2009.
     * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
     * See http://pajhome.org.uk/crypt/md5 for details.
     */
    SHA512: function(options) {
      /**
       * Private properties configuration variables. You may need to tweak these to be compatible with
       * the server-side, but the defaults work in most cases.
       * @see this.setUpperCase() method
       * @see this.setPad() method
       */
      var hexcase = (options && typeof options.uppercase === 'boolean') ? options.uppercase : false,
        /* hexadecimal output case format. false - lowercase; true - uppercase  */
        b64pad = (options && typeof options.pad === 'string') ? options.pda : '=',
        /* base-64 pad character. Default '=' for strict RFC compliance   */
        utf8 = (options && typeof options.utf8 === 'boolean') ? options.utf8 : true,
        /* enable/disable utf8 encoding */
        sha512_k;

      /* privileged (public) methods */
      this.hex = function(s) {
        return rstr2hex(rstr(s));
      };
      this.b64 = function(s) {
        return rstr2b64(rstr(s), b64pad);
      };
      this.any = function(s, e) {
        return rstr2any(rstr(s), e);
      };
      this.raw = function(s) {
        return rstr(s, utf8);
      };
      this.hex_hmac = function(k, d) {
        return rstr2hex(rstr_hmac(k, d));
      };
      this.b64_hmac = function(k, d) {
        return rstr2b64(rstr_hmac(k, d), b64pad);
      };
      this.any_hmac = function(k, d, e) {
        return rstr2any(rstr_hmac(k, d), e);
      };
      /**
       * Perform a simple self-test to see if the VM is working
       * @return {String} Hexadecimal hash sample
       * @public
       */
      this.vm_test = function() {
        return hex('abc').toLowerCase() === '900150983cd24fb0d6963f7d28e17f72';
      };
      /**
       * @description Enable/disable uppercase hexadecimal returned string
       * @param {boolean}
       * @return {Object} this
       * @public
       */
      this.setUpperCase = function(a) {
        if (typeof a === 'boolean') {
          hexcase = a;
        }
        return this;
      };
      /**
       * @description Defines a base64 pad string
       * @param {string} Pad
       * @return {Object} this
       * @public
       */
      this.setPad = function(a) {
        b64pad = a || b64pad;
        return this;
      };
      /**
       * @description Defines a base64 pad string
       * @param {boolean}
       * @return {Object} this
       * @public
       */
      this.setUTF8 = function(a) {
        if (typeof a === 'boolean') {
          utf8 = a;
        }
        return this;
      };

      /* private methods */

      /**
       * Calculate the SHA-512 of a raw string
       */

      function rstr(s) {
        s = (utf8) ? utf8Encode(s) : s;
        return binb2rstr(binb(rstr2binb(s), s.length * 8));
      }
      /*
       * Calculate the HMAC-SHA-512 of a key and some data (raw strings)
       */

      function rstr_hmac(key, data) {
        key = (utf8) ? utf8Encode(key) : key;
        data = (utf8) ? utf8Encode(data) : data;

        var hash, i = 0,
          bkey = rstr2binb(key),
          ipad = Array(32),
          opad = Array(32);

        if (bkey.length > 32) {
          bkey = binb(bkey, key.length * 8);
        }

        for (; i < 32; i += 1) {
          ipad[i] = bkey[i] ^ 0x36363636;
          opad[i] = bkey[i] ^ 0x5C5C5C5C;
        }

        hash = binb(ipad.concat(rstr2binb(data)), 1024 + data.length * 8);
        return binb2rstr(binb(opad.concat(hash), 1024 + 512));
      }

      /**
       * Calculate the SHA-512 of an array of big-endian dwords, and a bit length
       */

      function binb(x, len) {
        var j, i, l,
          W = new Array(80),
          hash = new Array(16),
          //Initial hash values
          H = [
            new int64(0x6a09e667, -205731576),
            new int64(-1150833019, -2067093701),
            new int64(0x3c6ef372, -23791573),
            new int64(-1521486534, 0x5f1d36f1),
            new int64(0x510e527f, -1377402159),
            new int64(-1694144372, 0x2b3e6c1f),
            new int64(0x1f83d9ab, -79577749),
            new int64(0x5be0cd19, 0x137e2179)
          ],
          T1 = new int64(0, 0),
          T2 = new int64(0, 0),
          a = new int64(0, 0),
          b = new int64(0, 0),
          c = new int64(0, 0),
          d = new int64(0, 0),
          e = new int64(0, 0),
          f = new int64(0, 0),
          g = new int64(0, 0),
          h = new int64(0, 0),
          //Temporary variables not specified by the document
          s0 = new int64(0, 0),
          s1 = new int64(0, 0),
          Ch = new int64(0, 0),
          Maj = new int64(0, 0),
          r1 = new int64(0, 0),
          r2 = new int64(0, 0),
          r3 = new int64(0, 0);

        if (sha512_k === undefined) {
          //SHA512 constants
          sha512_k = [
            new int64(0x428a2f98, -685199838), new int64(0x71374491, 0x23ef65cd),
            new int64(-1245643825, -330482897), new int64(-373957723, -2121671748),
            new int64(0x3956c25b, -213338824), new int64(0x59f111f1, -1241133031),
            new int64(-1841331548, -1357295717), new int64(-1424204075, -630357736),
            new int64(-670586216, -1560083902), new int64(0x12835b01, 0x45706fbe),
            new int64(0x243185be, 0x4ee4b28c), new int64(0x550c7dc3, -704662302),
            new int64(0x72be5d74, -226784913), new int64(-2132889090, 0x3b1696b1),
            new int64(-1680079193, 0x25c71235), new int64(-1046744716, -815192428),
            new int64(-459576895, -1628353838), new int64(-272742522, 0x384f25e3),
            new int64(0xfc19dc6, -1953704523), new int64(0x240ca1cc, 0x77ac9c65),
            new int64(0x2de92c6f, 0x592b0275), new int64(0x4a7484aa, 0x6ea6e483),
            new int64(0x5cb0a9dc, -1119749164), new int64(0x76f988da, -2096016459),
            new int64(-1740746414, -295247957), new int64(-1473132947, 0x2db43210),
            new int64(-1341970488, -1728372417), new int64(-1084653625, -1091629340),
            new int64(-958395405, 0x3da88fc2), new int64(-710438585, -1828018395),
            new int64(0x6ca6351, -536640913), new int64(0x14292967, 0xa0e6e70),
            new int64(0x27b70a85, 0x46d22ffc), new int64(0x2e1b2138, 0x5c26c926),
            new int64(0x4d2c6dfc, 0x5ac42aed), new int64(0x53380d13, -1651133473),
            new int64(0x650a7354, -1951439906), new int64(0x766a0abb, 0x3c77b2a8),
            new int64(-2117940946, 0x47edaee6), new int64(-1838011259, 0x1482353b),
            new int64(-1564481375, 0x4cf10364), new int64(-1474664885, -1136513023),
            new int64(-1035236496, -789014639), new int64(-949202525, 0x654be30),
            new int64(-778901479, -688958952), new int64(-694614492, 0x5565a910),
            new int64(-200395387, 0x5771202a), new int64(0x106aa070, 0x32bbd1b8),
            new int64(0x19a4c116, -1194143544), new int64(0x1e376c08, 0x5141ab53),
            new int64(0x2748774c, -544281703), new int64(0x34b0bcb5, -509917016),
            new int64(0x391c0cb3, -976659869), new int64(0x4ed8aa4a, -482243893),
            new int64(0x5b9cca4f, 0x7763e373), new int64(0x682e6ff3, -692930397),
            new int64(0x748f82ee, 0x5defb2fc), new int64(0x78a5636f, 0x43172f60),
            new int64(-2067236844, -1578062990), new int64(-1933114872, 0x1a6439ec),
            new int64(-1866530822, 0x23631e28), new int64(-1538233109, -561857047),
            new int64(-1090935817, -1295615723), new int64(-965641998, -479046869),
            new int64(-903397682, -366583396), new int64(-779700025, 0x21c0c207),
            new int64(-354779690, -840897762), new int64(-176337025, -294727304),
            new int64(0x6f067aa, 0x72176fba), new int64(0xa637dc5, -1563912026),
            new int64(0x113f9804, -1090974290), new int64(0x1b710b35, 0x131c471b),
            new int64(0x28db77f5, 0x23047d84), new int64(0x32caab7b, 0x40c72493),
            new int64(0x3c9ebe0a, 0x15c9bebc), new int64(0x431d67c4, -1676669620),
            new int64(0x4cc5d4be, -885112138), new int64(0x597f299c, -60457430),
            new int64(0x5fcb6fab, 0x3ad6faec), new int64(0x6c44198c, 0x4a475817)
          ];
        }

        for (i = 0; i < 80; i += 1) {
          W[i] = new int64(0, 0);
        }

        // append padding to the source string. The format is described in the FIPS.
        x[len >> 5] |= 0x80 << (24 - (len & 0x1f));
        x[((len + 128 >> 10) << 5) + 31] = len;
        l = x.length;
        for (i = 0; i < l; i += 32) { //32 dwords is the block size
          int64copy(a, H[0]);
          int64copy(b, H[1]);
          int64copy(c, H[2]);
          int64copy(d, H[3]);
          int64copy(e, H[4]);
          int64copy(f, H[5]);
          int64copy(g, H[6]);
          int64copy(h, H[7]);

          for (j = 0; j < 16; j += 1) {
            W[j].h = x[i + 2 * j];
            W[j].l = x[i + 2 * j + 1];
          }

          for (j = 16; j < 80; j += 1) {
            //sigma1
            int64rrot(r1, W[j - 2], 19);
            int64revrrot(r2, W[j - 2], 29);
            int64shr(r3, W[j - 2], 6);
            s1.l = r1.l ^ r2.l ^ r3.l;
            s1.h = r1.h ^ r2.h ^ r3.h;
            //sigma0
            int64rrot(r1, W[j - 15], 1);
            int64rrot(r2, W[j - 15], 8);
            int64shr(r3, W[j - 15], 7);
            s0.l = r1.l ^ r2.l ^ r3.l;
            s0.h = r1.h ^ r2.h ^ r3.h;

            int64add4(W[j], s1, W[j - 7], s0, W[j - 16]);
          }

          for (j = 0; j < 80; j += 1) {
            //Ch
            Ch.l = (e.l & f.l) ^ (~e.l & g.l);
            Ch.h = (e.h & f.h) ^ (~e.h & g.h);

            //Sigma1
            int64rrot(r1, e, 14);
            int64rrot(r2, e, 18);
            int64revrrot(r3, e, 9);
            s1.l = r1.l ^ r2.l ^ r3.l;
            s1.h = r1.h ^ r2.h ^ r3.h;

            //Sigma0
            int64rrot(r1, a, 28);
            int64revrrot(r2, a, 2);
            int64revrrot(r3, a, 7);
            s0.l = r1.l ^ r2.l ^ r3.l;
            s0.h = r1.h ^ r2.h ^ r3.h;

            //Maj
            Maj.l = (a.l & b.l) ^ (a.l & c.l) ^ (b.l & c.l);
            Maj.h = (a.h & b.h) ^ (a.h & c.h) ^ (b.h & c.h);

            int64add5(T1, h, s1, Ch, sha512_k[j], W[j]);
            int64add(T2, s0, Maj);

            int64copy(h, g);
            int64copy(g, f);
            int64copy(f, e);
            int64add(e, d, T1);
            int64copy(d, c);
            int64copy(c, b);
            int64copy(b, a);
            int64add(a, T1, T2);
          }
          int64add(H[0], H[0], a);
          int64add(H[1], H[1], b);
          int64add(H[2], H[2], c);
          int64add(H[3], H[3], d);
          int64add(H[4], H[4], e);
          int64add(H[5], H[5], f);
          int64add(H[6], H[6], g);
          int64add(H[7], H[7], h);
        }

        //represent the hash as an array of 32-bit dwords
        for (i = 0; i < 8; i += 1) {
          hash[2 * i] = H[i].h;
          hash[2 * i + 1] = H[i].l;
        }
        return hash;
      }

      //A constructor for 64-bit numbers

      function int64(h, l) {
        this.h = h;
        this.l = l;
        //this.toString = int64toString;
      }

      //Copies src into dst, assuming both are 64-bit numbers

      function int64copy(dst, src) {
        dst.h = src.h;
        dst.l = src.l;
      }

      //Right-rotates a 64-bit number by shift
      //Won't handle cases of shift>=32
      //The function revrrot() is for that

      function int64rrot(dst, x, shift) {
        dst.l = (x.l >>> shift) | (x.h << (32 - shift));
        dst.h = (x.h >>> shift) | (x.l << (32 - shift));
      }

      //Reverses the dwords of the source and then rotates right by shift.
      //This is equivalent to rotation by 32+shift

      function int64revrrot(dst, x, shift) {
        dst.l = (x.h >>> shift) | (x.l << (32 - shift));
        dst.h = (x.l >>> shift) | (x.h << (32 - shift));
      }

      //Bitwise-shifts right a 64-bit number by shift
      //Won't handle shift>=32, but it's never needed in SHA512

      function int64shr(dst, x, shift) {
        dst.l = (x.l >>> shift) | (x.h << (32 - shift));
        dst.h = (x.h >>> shift);
      }

      //Adds two 64-bit numbers
      //Like the original implementation, does not rely on 32-bit operations

      function int64add(dst, x, y) {
        var w0 = (x.l & 0xffff) + (y.l & 0xffff);
        var w1 = (x.l >>> 16) + (y.l >>> 16) + (w0 >>> 16);
        var w2 = (x.h & 0xffff) + (y.h & 0xffff) + (w1 >>> 16);
        var w3 = (x.h >>> 16) + (y.h >>> 16) + (w2 >>> 16);
        dst.l = (w0 & 0xffff) | (w1 << 16);
        dst.h = (w2 & 0xffff) | (w3 << 16);
      }

      //Same, except with 4 addends. Works faster than adding them one by one.

      function int64add4(dst, a, b, c, d) {
        var w0 = (a.l & 0xffff) + (b.l & 0xffff) + (c.l & 0xffff) + (d.l & 0xffff);
        var w1 = (a.l >>> 16) + (b.l >>> 16) + (c.l >>> 16) + (d.l >>> 16) + (w0 >>> 16);
        var w2 = (a.h & 0xffff) + (b.h & 0xffff) + (c.h & 0xffff) + (d.h & 0xffff) + (w1 >>> 16);
        var w3 = (a.h >>> 16) + (b.h >>> 16) + (c.h >>> 16) + (d.h >>> 16) + (w2 >>> 16);
        dst.l = (w0 & 0xffff) | (w1 << 16);
        dst.h = (w2 & 0xffff) | (w3 << 16);
      }

      //Same, except with 5 addends

      function int64add5(dst, a, b, c, d, e) {
        var w0 = (a.l & 0xffff) + (b.l & 0xffff) + (c.l & 0xffff) + (d.l & 0xffff) + (e.l & 0xffff),
          w1 = (a.l >>> 16) + (b.l >>> 16) + (c.l >>> 16) + (d.l >>> 16) + (e.l >>> 16) + (w0 >>> 16),
          w2 = (a.h & 0xffff) + (b.h & 0xffff) + (c.h & 0xffff) + (d.h & 0xffff) + (e.h & 0xffff) + (w1 >>> 16),
          w3 = (a.h >>> 16) + (b.h >>> 16) + (c.h >>> 16) + (d.h >>> 16) + (e.h >>> 16) + (w2 >>> 16);
        dst.l = (w0 & 0xffff) | (w1 << 16);
        dst.h = (w2 & 0xffff) | (w3 << 16);
      }
    },
    /**
     * @class Hashes.RMD160
     * @constructor
     * @param {Object} [config]
     *
     * A JavaScript implementation of the RIPEMD-160 Algorithm
     * Version 2.2 Copyright Jeremy Lin, Paul Johnston 2000 - 2009.
     * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
     * See http://pajhome.org.uk/crypt/md5 for details.
     * Also http://www.ocf.berkeley.edu/~jjlin/jsotp/
     */
    RMD160: function(options) {
      /**
       * Private properties configuration variables. You may need to tweak these to be compatible with
       * the server-side, but the defaults work in most cases.
       * @see this.setUpperCase() method
       * @see this.setPad() method
       */
      var hexcase = (options && typeof options.uppercase === 'boolean') ? options.uppercase : false,
        /* hexadecimal output case format. false - lowercase; true - uppercase  */
        b64pad = (options && typeof options.pad === 'string') ? options.pda : '=',
        /* base-64 pad character. Default '=' for strict RFC compliance   */
        utf8 = (options && typeof options.utf8 === 'boolean') ? options.utf8 : true,
        /* enable/disable utf8 encoding */
        rmd160_r1 = [
          0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
          7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
          3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
          1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
          4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13
        ],
        rmd160_r2 = [
          5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
          6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
          15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
          8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
          12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11
        ],
        rmd160_s1 = [
          11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
          7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
          11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
          11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
          9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6
        ],
        rmd160_s2 = [
          8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
          9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
          9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
          15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
          8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11
        ];

      /* privileged (public) methods */
      this.hex = function(s) {
        return rstr2hex(rstr(s, utf8));
      };
      this.b64 = function(s) {
        return rstr2b64(rstr(s, utf8), b64pad);
      };
      this.any = function(s, e) {
        return rstr2any(rstr(s, utf8), e);
      };
      this.raw = function(s) {
        return rstr(s, utf8);
      };
      this.hex_hmac = function(k, d) {
        return rstr2hex(rstr_hmac(k, d));
      };
      this.b64_hmac = function(k, d) {
        return rstr2b64(rstr_hmac(k, d), b64pad);
      };
      this.any_hmac = function(k, d, e) {
        return rstr2any(rstr_hmac(k, d), e);
      };
      /**
       * Perform a simple self-test to see if the VM is working
       * @return {String} Hexadecimal hash sample
       * @public
       */
      this.vm_test = function() {
        return hex('abc').toLowerCase() === '900150983cd24fb0d6963f7d28e17f72';
      };
      /**
       * @description Enable/disable uppercase hexadecimal returned string
       * @param {boolean}
       * @return {Object} this
       * @public
       */
      this.setUpperCase = function(a) {
        if (typeof a === 'boolean') {
          hexcase = a;
        }
        return this;
      };
      /**
       * @description Defines a base64 pad string
       * @param {string} Pad
       * @return {Object} this
       * @public
       */
      this.setPad = function(a) {
        if (typeof a !== 'undefined') {
          b64pad = a;
        }
        return this;
      };
      /**
       * @description Defines a base64 pad string
       * @param {boolean}
       * @return {Object} this
       * @public
       */
      this.setUTF8 = function(a) {
        if (typeof a === 'boolean') {
          utf8 = a;
        }
        return this;
      };

      /* private methods */

      /**
       * Calculate the rmd160 of a raw string
       */

      function rstr(s) {
        s = (utf8) ? utf8Encode(s) : s;
        return binl2rstr(binl(rstr2binl(s), s.length * 8));
      }

      /**
       * Calculate the HMAC-rmd160 of a key and some data (raw strings)
       */

      function rstr_hmac(key, data) {
        key = (utf8) ? utf8Encode(key) : key;
        data = (utf8) ? utf8Encode(data) : data;
        var i, hash,
          bkey = rstr2binl(key),
          ipad = Array(16),
          opad = Array(16);

        if (bkey.length > 16) {
          bkey = binl(bkey, key.length * 8);
        }

        for (i = 0; i < 16; i += 1) {
          ipad[i] = bkey[i] ^ 0x36363636;
          opad[i] = bkey[i] ^ 0x5C5C5C5C;
        }
        hash = binl(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
        return binl2rstr(binl(opad.concat(hash), 512 + 160));
      }

      /**
       * Convert an array of little-endian words to a string
       */

      function binl2rstr(input) {
        var i, output = '',
          l = input.length * 32;
        for (i = 0; i < l; i += 8) {
          output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xFF);
        }
        return output;
      }

      /**
       * Calculate the RIPE-MD160 of an array of little-endian words, and a bit length.
       */

      function binl(x, len) {
        var T, j, i, l,
          h0 = 0x67452301,
          h1 = 0xefcdab89,
          h2 = 0x98badcfe,
          h3 = 0x10325476,
          h4 = 0xc3d2e1f0,
          A1, B1, C1, D1, E1,
          A2, B2, C2, D2, E2;

        /* append padding */
        x[len >> 5] |= 0x80 << (len % 32);
        x[(((len + 64) >>> 9) << 4) + 14] = len;
        l = x.length;

        for (i = 0; i < l; i += 16) {
          A1 = A2 = h0;
          B1 = B2 = h1;
          C1 = C2 = h2;
          D1 = D2 = h3;
          E1 = E2 = h4;
          for (j = 0; j <= 79; j += 1) {
            T = safe_add(A1, rmd160_f(j, B1, C1, D1));
            T = safe_add(T, x[i + rmd160_r1[j]]);
            T = safe_add(T, rmd160_K1(j));
            T = safe_add(bit_rol(T, rmd160_s1[j]), E1);
            A1 = E1;
            E1 = D1;
            D1 = bit_rol(C1, 10);
            C1 = B1;
            B1 = T;
            T = safe_add(A2, rmd160_f(79 - j, B2, C2, D2));
            T = safe_add(T, x[i + rmd160_r2[j]]);
            T = safe_add(T, rmd160_K2(j));
            T = safe_add(bit_rol(T, rmd160_s2[j]), E2);
            A2 = E2;
            E2 = D2;
            D2 = bit_rol(C2, 10);
            C2 = B2;
            B2 = T;
          }

          T = safe_add(h1, safe_add(C1, D2));
          h1 = safe_add(h2, safe_add(D1, E2));
          h2 = safe_add(h3, safe_add(E1, A2));
          h3 = safe_add(h4, safe_add(A1, B2));
          h4 = safe_add(h0, safe_add(B1, C2));
          h0 = T;
        }
        return [h0, h1, h2, h3, h4];
      }

      // specific algorithm methods

      function rmd160_f(j, x, y, z) {
        return (0 <= j && j <= 15) ? (x ^ y ^ z) :
          (16 <= j && j <= 31) ? (x & y) | (~x & z) :
          (32 <= j && j <= 47) ? (x | ~y) ^ z :
          (48 <= j && j <= 63) ? (x & z) | (y & ~z) :
          (64 <= j && j <= 79) ? x ^ (y | ~z) :
          'rmd160_f: j out of range';
      }

      function rmd160_K1(j) {
        return (0 <= j && j <= 15) ? 0x00000000 :
          (16 <= j && j <= 31) ? 0x5a827999 :
          (32 <= j && j <= 47) ? 0x6ed9eba1 :
          (48 <= j && j <= 63) ? 0x8f1bbcdc :
          (64 <= j && j <= 79) ? 0xa953fd4e :
          'rmd160_K1: j out of range';
      }

      function rmd160_K2(j) {
        return (0 <= j && j <= 15) ? 0x50a28be6 :
          (16 <= j && j <= 31) ? 0x5c4dd124 :
          (32 <= j && j <= 47) ? 0x6d703ef3 :
          (48 <= j && j <= 63) ? 0x7a6d76e9 :
          (64 <= j && j <= 79) ? 0x00000000 :
          'rmd160_K2: j out of range';
      }
    }
  };

  // exposes Hashes
  (function(window, undefined) {
    var freeExports = false;
    if (typeof exports === 'object') {
      freeExports = exports;
      if (exports && typeof global === 'object' && global && global === global.global) {
        window = global;
      }
    }

    if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
      // define as an anonymous module, so, through path mapping, it can be aliased
      define(function() {
        return Hashes;
      });
    } else if (freeExports) {
      // in Node.js or RingoJS v0.8.0+
      if (typeof module === 'object' && module && module.exports === freeExports) {
        module.exports = Hashes;
      }
      // in Narwhal or RingoJS v0.7.0-
      else {
        freeExports.Hashes = Hashes;
      }
    } else {
      // in a browser or Rhino
      window.Hashes = Hashes;
    }
  }(this));
}()); // IIFE
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class XhrDeferredException {

	this(message) {

		this.message = message;
		this.name = "Xhr deferred exception";

	}

};
//------------------------------------------------------------------------------
function post_json(obj, path, data) {

	let response, request = JSON.stringify(data, null, '\t');

	if( !obj.deferred_xhrs_ )
		obj.deferred_xhrs_ = {};

	let MD5 = new Hashes.MD5;
	let hash = MD5.hex(path + "\n\n" + request);
	let xhr = obj.deferred_xhrs_[hash];

	if( xhr ) {

		//obj.deferred_xhrs_[hash] = undefined;
		//delete obj.deferred_xhrs_[hash];
		//let clear = () => {
		//	delete obj.deferred_xhrs_[hash];
		//
		//	if( Object.getOwnPropertyNames(obj.deferred_xhrs_).length === 0 )
		//		delete obj.deferred_xhrs_;
		//};

		if( xhr.status !== 200 ) {
		//	clear();
			throw new Error(xhr.status.toString() + ' ' + xhr.statusText + "\n" + xhr.responseText);
		}

		response = JSON.parse(xhr.responseText, JSON.dateParser);
		//clear();

	}
	else {

		xhr = new XMLHttpRequest;
		xhr.open('POST', path, true);
		xhr.timeout = 180000;
		xhr.setRequestHeader('Content-Type'		, 'application/json; charset=utf-8');
		xhr.setRequestHeader('If-Modified-Since', 'Sat, 1 Jan 2000 00:00:00 GMT');
		xhr.setRequestHeader('Cache-Control'	, 'no-store, no-cache, must-revalidate, max-age=0');

		xhr.deferred_object_ = obj.deferred_object_;

		xhr.onreadystatechange = function () {
			if( this.readyState === XMLHttpRequest.DONE )
				if( obj.deferred_xhrs_handler )
					obj.deferred_xhrs_handler(xhr.deferred_object_);

		};

		obj.deferred_xhrs_[hash] = xhr;
		xhr.send(request);

		throw new XhrDeferredException;

	}

	return response;

}
//------------------------------------------------------------------------------
function post_json_async(path, data, success, error) {

	let xhr = new XMLHttpRequest;

	xhr.open('POST', path, true);
	xhr.timeout = 180000;
	xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
	xhr.setRequestHeader('If-Modified-Since', 'Sat, 1 Jan 2000 00:00:00 GMT');
	xhr.setRequestHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

	xhr.onreadystatechange = function() {

		if( this.readyState === XMLHttpRequest.DONE ) {
			if( this.status === 200 ) {

				if( success )
					success(JSON.parse(this.responseText, JSON.dateParser));

			}
			else if( error ) {

				error(xhr.status.toString() + ' ' + xhr.statusText + "\n" + xhr.responseText, this);

			}
			else {

				console.log(xhr.status.toString() + ' ' + xhr.statusText + "\n" + xhr.responseText);

			}

		}

	};

	xhr.send(JSON.stringify(data, null, '\t'));

}
//------------------------------------------------------------------------------
function post_json_sync(path, data) {

	let xhr = new XMLHttpRequest;
	let response = undefined;
	let load_indicator = undefined;
	let timer_handle = undefined;

	try {

		load_indicator = xpath_single('html/body/div[@class=\'cssload-container\']');
		timer_handle = undefined;

		let popup = function () {
			console.log('tadam');
			load_indicator.style.display = 'inline-block';
		}

		if( load_indicator ) {

			load_indicator.style.display = 'none';
			timer_handle = setTimeout(popup, 10);

		}

		xhr.open('POST', path, false);
		xhr.setRequestHeader('Content-Type'		, 'application/json; charset=utf-8');
		xhr.setRequestHeader('If-Modified-Since', 'Sat, 1 Jan 2000 00:00:00 GMT');
		xhr.setRequestHeader('Cache-Control'	, 'no-store, no-cache, must-revalidate, max-age=0');
		xhr.send(JSON.stringify(data, null, '\t'));

		if( xhr.status !== 200 )
			throw new Error(xhr.status.toString() + ' ' + xhr.statusText + "\n" + xhr.responseText);

		response = JSON.parse(xhr.responseText, JSON.dateParser);

	}
	finally {

		if( timer_handle )
			clearTimeout(timer_handle);

		if( load_indicator )
			load_indicator.style.display = 'none';

	}

	return response;

}
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class Idle {

	get events() {

		return [
			'click',
			'mousemove',
			'mouseenter',
			'keydown',
			'touchstart',
			'touchmove',
			'scroll',
			'mousewheel'
		];

	}

	get away() {
		return this.away_;
	}

	set away(v) {
		this.away_ = v;
	}

	get back() {
		return this.back_;
	}

	set back(v) {
		this.back_ = v;
	}

	get timeout() {
		return this.timeout_;
	}

	set timeout(v) {

		if( !Number.isInteger(v) )
			v = Number.parseInt(v);

		if( Number.isFinite(v) ) {

			if( !Number.isInteger(v) )
				v = Math.trunc(v);

			this.timeout_ = v;

		}

	}

	constructor(params) {

		this.activity_handler_call_	= () => this.activity_handler();
		this.timeout_handler_call_	= () => this.timeout_handler();

		this.oneshot_ = false;
		this.retry_ = false;
		this.timeout_ = 3000;

		if( params ) {

			if( params.oneshot !== undefined )
				this.oneshot_ = params.oneshot;

			if( params.retry !== undefined )
				this.retry_ = params.retry;

			if( params.away !== undefined )
				this.away_ = params.away;

			if( params.back !== undefined )
				this.back_ = params.back;

			if( params.timeout !== undefined )
				this.timeout = params.timeout;

			if( params.start !== undefined )
				this.start();

		}

	}

	setup_away_timer(timeout) {

		this.away_time_ = 0;

		if( this.away_timer_ )
			clearTimeout(this.away_timer_);

		this.away_timer_ = setTimeout(this.timeout_handler_call_, timeout);

	}

	activity_handler() {

		let t = mili_time();
		this.last_activity_time_ = t;

		if( this.away_time_ > 0 ) {

			// back after away
			if( this.back_ )
				this.back_();

			this.setup_away_timer(this.timeout_);

		}

	}

	timeout_handler() {

		let t = mili_time();
		let a = t - this.last_activity_time_;

		if( a >= this.timeout_ ) {

			// away timeout
			this.away_time_ = t;

			if( this.away_ )
				this.away_();

			if( this.oneshot_ ) {

				this.stop();

			}
			else if( this.retry_ ) {

				this.setup_away_timer(this.timeout_);

			}

		}
		else {

			// activity detected, restart timer on remainder of timeout
			this.setup_away_timer(this.timeout_ - a);

		}

	}

	start(timeout) {

		this.last_activity_time_ = 0;

		for( let event of this.events )
			window.addEventListener(event, this.activity_handler_call_, true);

		if( timeout )
			this.timeout = timeout;

		this.setup_away_timer(this.timeout_);

	}

	stop() {

		for( let event of this.events )
			window.removeEventListener(event, this.activity_handler_call_);

		clearTimeout(this.away_timer_);
		this.away_timer_ = undefined;

		this.away_time_ = 0;

	}

}
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class ServerSentEvents {

/*
	// https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
	// http://www.html5rocks.com/en/tutorials/eventsource/basics/
	// http://stackoverflow.com/questions/9070995/html5-server-sent-events-prototyping-ambiguous-error-and-repeated-polling
	// http://stackoverflow.com/questions/14202191/broadcasting-messages-with-server-sent-events
	// SSE Server-Side Events

	msg_source.addEventListener('ping', function (e) {
		//let newElement = document.createElement("li");
  		let obj = JSON.parse(e.data, JSON.dateParser);
  		//newElement.innerHTML = "ping at " + obj.time;
		//eventList.appendChild(newElement);
		Render.debug(8, 'ping at ' + obj.time);
	}, false);

*/

	constructor(params) {

		this.start_ = function () {

			try {

				this.msg_source_ = new EventSource(this.url_);
				this.msg_source_.onmessage	= e => this.message_(e);
				this.msg_source_.onerror	= e => this.error_(e);

			}
			catch( e ) {

				console.log(e);
				this.sseq_timer_ = setTimeout(this.start_, 100);

			}

		};

		this.stop_ = function () {

			if( this.msg_source_ ) {

				this.msg_source_.close();
				this.msg_source_ = undefined;

			}

		};

		this.onerror_restart_ = true;

		if( params ) {

			if( params.url !== undefined )
				this.url_ = params.url;

			if( params.onerror_restart !== undefined )
				this.onerror_restart_ = params.onerror_restart;

			if( params.start !== undefined )
				this.start_ = params.start;

			if( this.start_ !== undefined )
				this.start();

		}

	}

	message_(e) {

		if( this.message )
			return this.message(e);

  		//let new_element = document.createElement('li');
		//new_element.innerHTML = 'message: ' + e.data;
		//eventList.appendChild(new_element);

		console.log('message: ' + e.data + ', last-event-id: ' + e.lastEventId);

		switch( this.msg_source_.readyState ) {
			case EventSource.CONNECTING	:
				// do something
				break;
			case EventSource.OPEN		:
				// do something
				break;
			case EventSource.CLOSED		:
				// do something
				break;
			default						:
				// this never happens
				break;
		}

	}

	error_(e) {

		//console.log('EventSource failed.', e);
		if( this.onerror_restart_ ) {

			this.stop_();
			this.start_();

		}

		if( this.error )
			return this.error(e);

	};

	start() {

		this.start_();

	}

	stop() {

		this.stop_();

	}

}
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
/*
 * This file is part of HTML Barcode SDK.
 *
 *
 * ConnectCode provides its HTML Barcode SDK under a dual license model designed 
 * to meet the development and distribution needs of both commercial application 
 * distributors and open source projects.
 *
 * For open source projects, please see the GNU GPL notice below. 
 *
 * For Commercial Application Distributors (OEMs, ISVs and VARs), 
 * please see <http://www.barcoderesource.com/duallicense.shtml> for more information.
 *
 *
 *
 *
 * GNU GPL v3.0 License 
 *
 * HTML Barcode SDK is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * HTML Barcode SDK is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Foobar.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Source: http://www.barcoderesource.com/opensource/ean13/csshtmlEAN13Barcode.html
 * Modified 25.08.2016: Guram Duka guram.duka@gmail.com
 */
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class barcode_ean13_render {

	to_cm(v) {

		return this.units_ === 'in' ? v * 2.54 : v;

	}

	to_in(v) {

		return this.units_ === 'in' ? v : v / 2.54;

	}

	check_params() {

		if( this.text_location_ != 'bottom' && this.text_location_ != 'top' )
			this.text_location_ = 'bottom';

		if( this.text_alignment_ != 'center' && this.text_alignment != 'left' && this.text_alignment != 'right' )
			this.text_alignment_ = 'center';

		if( this.units_ != 'in' && this.units_ != 'cm' )
			this.units_ = 'cm';

		if( this.height_ <= 0 || this.to_cm(this.height_) > 38.1 )
			this.height_ = 2.54;

		if( this.width_ <= 0 || this.to_cm(this.width_) > 38.1 )
			this.width_ = 6.35;

		if( this.min_bar_width_ < 0 || this.to_cm(this.min_bar_width_) > 5.08 )
			this.min_bar_width_ = 0;

		if( this.human_readable_ !== true && this.human_readable_ !== false )
			this.human_readable_ = true;

		if( this.mode_ !== 'html' && this.mode_ !== 'text' )
			this.mode_ = 'html';

	}

	constructor(params) {

		// set default parameters values
		this.human_readable_	= true;
		this.units_				= 'cm';
		this.min_bar_width_		= 0;
		this.width_				= 6.35;
		this.height_			= 2.54;
		this.text_location_		= 'bottom';
		this.text_alignment_	= 'center';
		this.text_style_		= '';
		this.color_				= 'black';
		this.background_		= 'white';
		this.mode_				= 'html';
		this.attributes_		= '';

		if( params ) {

			if( params.human_readable !== undefined )
				this.human_readable_ = params.human_readable;

			if( params.units !== undefined )
				this.units_ = params.units;

			if( params.min_bar_width !== undefined )
				this.min_bar_width_ = params.min_bar_width;

			if( params.width !== undefined )
				this.width_ = params.width;

			if( params.height !== undefined )
				this.height_ = params.height;

			if( params.text_location !== undefined )
				this.text_location_ = params.text_location;

			if( params.text_alignment !== undefined )
				this.text_alignment_ = params.text_alignment;

			if( params.text_style !== undefined )
				this.text_style_ = params.text_style;

			if( params.text_style !== undefined )
				this.text_style_ = params.text_style;

			if( params.color !== undefined )
				this.color_ = params.color;

			if( params.background !== undefined )
				this.background_ = params.background;

			if( params.mode !== undefined )
				this.mode_ = params.mode;

			if( params.attributes !== undefined )
				this.attributes_ = params.attributes;

		}

		this.check_params();

	}

	filter_input(data) {

		let result = '';

		for( let i = 0; i < data.length; i++ )
			if( data.charCodeAt(i) >= 48 && data.charCodeAt(i) <= 57 )
				result += data.substr(i, 1);

		return result;

	}

	generate_check_digit(data) {

		let sum = 0;
               
		for( let i = data.length - 1; i >= 0 ; i-- ) {
                 
			let barcode_value = data.charCodeAt(i) - 48;

			sum += (i % 2) === 0 ? barcode_value : barcode_value * 3;

		}
               
		let result = sum % 10;

		if( result !== 0 )
			result = 10 - result;
                 
		return String.fromCharCode(result + 48);

	}

	html_escape(data) {

		let result = '';

		for( let i = 0; i < data.length; i++ )
			result += '&#' + data.charCodeAt(i).toString() + ';';

		return result;

	}

	html_decode(str) {

		let ta = document.createElement('textarea');

		ta.innerHTML = str.replace(/</g, '&lt;').replace(/>/g, '&gt;');

		return ta.value;

	}

	connect_code_encode(data, hr) {

		let parity_map = this.parity_map_;
		let filtered_data = this.filter_input(data);
                   
		if( filtered_data.length > 12 )
			filtered_data = filtered_data.substr(0, 12);
               
		if( filtered_data.length < 12 )
			for( let i = 12 - filtered_data.length; i > 0; i-- )
				filtered_data = '0' + filtered_data;
               
		filtered_data += this.generate_check_digit(filtered_data);

		let parity_bit = 0;
		let first_digit = 0;
		let transform_data_left = '';

		for( let i = 0; i < 7; i++ ) {

			if( i === 0 ) {

				first_digit = filtered_data.charCodeAt(i) - 48; 

			}
			else {

				parity_bit = parity_map[first_digit][i - 1];

				if( parity_bit === 0 )
					transform_data_left += filtered_data.substr(i, 1);
				else
					transform_data_left += String.fromCharCode(filtered_data.charCodeAt(i) + 49 + 14);

			}

		}
                   
		let result = '';
		let transform_data_right = '';
		let transform_char = '';

		for( let i = 7; i < 13; i++ ) {

			transform_char = String.fromCharCode(filtered_data.charCodeAt(i) + 49);
			transform_data_right += transform_char;

		}
                   
		if( hr !== 0 ) {

			result = String.fromCharCode(first_digit + '!'.charCodeAt(0)) + '[' + transform_data_left + '-' + transform_data_right + ']';

		}
		else {

			result = '[' + transform_data_left + '-' + transform_data_right + ']';

		}

		return this.html_decode(this.html_escape(result));

	}

	encode(data) {

		let font_output = this.connect_code_encode(data, 0);
		let output = '';

		for( let i = 0; i < font_output.length; i++ ) {

			let c = font_output.substr(i, 1).charCodeAt(0);

			output += c < this.pattern_.length ? this.pattern_[c] : '';

		}

		return output;

	}

	get_human_text(data) {

		let filtered_data = this.filter_input(data);
                                  
		if( filtered_data.length > 12 )
			filtered_data = filtered_data.substr(0, 12);
               
		if( filtered_data.length < 12 )
			for( let i = 12 - filtered_data.length; i > 0; i-- )
				filtered_data = '0' + filtered_data;

		filtered_data += this.generate_check_digit(filtered_data);

		return this.html_decode(this.html_escape(filtered_data));

	}

	draw_barcode(data) {

		let encoded_data = this.encode(data);
		let thin_length = 0;
		let thick_length = 0.0;
		let increment_width = 0.0;
		let swing = 1;
		let result = '';
		let bar_width = 0;
		let width = this.width_;
		let thick_width = 0.0;
		let svg;

		let encoded_length = encoded_data.length;
		let total_length = encoded_length;
	
		if( this.min_bar_width_ > 0 ) {

			bar_width = this.min_bar_width_.toFixed(2);
			width = bar_width * total_length;

		}
		else {

			bar_width = (width / total_length).toFixed(2);

		}

		let get_human_span = function (obj, data) {

			let s = obj.get_human_text(data);

			let font_size = 1.141;
			let text_top  = 0.870;

			let k = width / 6.35;

			font_size *= k;
			text_top  *= k;

			if( obj.text_location_ === 'bottom' )
				text_top = -text_top;

			let font_style = `font-family: arial; font-size: ${font_size}em; font-weight: normal; font-style: normal; font-stretch: normal`;

			let human_readable_text = '';
			let space = `<font style="${font_style}; width: auto; height: auto; background: transparent">&nbsp;&nbsp;</font>`;
			let digit = `<font style="${font_style}; width: auto; height: auto; background: ${obj.background_}">`;

			human_readable_text += `${digit}${s.substr(0, 1)}</font>`;
			human_readable_text += `${space}${space}`;
			human_readable_text += `${digit}${s.substr(1, 6)}</font>`;
			human_readable_text += `${space}${space}`;
			human_readable_text += `${digit}${s.substr(7, 6)}</font>`;
			human_readable_text += `${space}${space}`;

			let human_text_style = `z-index: 200; position: relative; top: ${text_top}em; width: auto; height: auto; ${font_style}; background: transparent; ${obj.text_style_}`;

			return `<span human_readable_text style="${human_text_style}">${human_readable_text}</span><br />`;

		}

		if( this.mode_ === 'html' ) {

			let attributes = `barcode="${data}"`;

			if( this.attributes_.length !== 0 && this.attributes_.trim() )
				attributes += ' ' + this.attributes_.trim();

			if( this.text_alignment_ === 'center' )
				result = `<div ${attributes} style="text-align: center">`;
			else if( this.text_alignment_ === 'left' )
				result = `<div ${attributes} style="text-align: left">`;
			else if( this.text_alignment_ === 'right' )
				result = `<div ${attributes} style="text-align: right">`;

			let human_span = '';

			if( this.human_readable_ === true && this.text_location_ === 'top' )
				human_span = `${get_human_span(this, data)}<br />`;

			result += human_span;

		}
			  
		let master_style = 'display: inline-block; width: auto; z-index: 100; background: transparent';

		for( let i = 0; i < encoded_data.length; i++ ) {

			let brush = encoded_data.substr(i, 1) === 'b' ? this.color_ : this.background_;

			if( this.mode_ === 'html' )
				result += `<span vbar style="border-left: ${bar_width}${this.units_} solid ${brush}; height: ${this.height_}${this.units_}; ${master_style}"></span>`;

			increment_width += bar_width;
				
		}

		if( this.mode_ === 'html' ) {

			let human_span = '';

			if( this.human_readable_ === true && this.text_location_ === 'bottom' )
				human_span = `<br />${get_human_span(this, data)}`;

			result += human_span + '</div>';

		}
		
		return result;	

	}

}
//------------------------------------------------------------------------------
barcode_ean13_render.prototype.parity_map_ = [

	[ 0, 0, 0, 0, 0, 0 ],
	[ 0, 0, 1, 0, 1, 1 ],
	[ 0, 0, 1, 1, 0, 1 ],
	[ 0, 0, 1, 1, 1, 0 ],
	[ 0, 1, 0, 0, 1, 1 ],
	[ 0, 1, 1, 0, 0, 1 ],
	[ 0, 1, 1, 1, 0, 0 ],
	[ 0, 1, 0, 1, 0, 1 ],
	[ 0, 1, 0, 1, 1, 0 ],
	[ 0, 1, 1, 0, 1, 0 ]

];
//------------------------------------------------------------------------------
barcode_ean13_render.prototype.pattern_ = function () {

	let a = new Array(121);

	for( let i = 0; i < a.length; i++ )
		a[i] = '';

	a[ 45] = 'wbwbw';
	a[ 48] = 'wwwbbwb';
	a[ 49] = 'wwbbwwb';
	a[ 50] = 'wwbwwbb';
	a[ 51] = 'wbbbbwb';
	a[ 52] = 'wbwwwbb';
	a[ 53] = 'wbbwwwb';
	a[ 54] = 'wbwbbbb';
	a[ 55] = 'wbbbwbb';
	a[ 56] = 'wbbwbbb';
	a[ 57] = 'wwwbwbb';
	a[111] = 'wbwwbbb';
	a[112] = 'wbbwwbb';
	a[113] = 'wwbbwbb';
	a[114] = 'wbwwwwb';
	a[115] = 'wwbbbwb';
	a[116] = 'wbbbwwb';
	a[117] = 'wwwwbwb';
	a[118] = 'wwbwwwb';
	a[119] = 'wwwbwwb';
	a[120] = 'wwbwbbb';
	a[ 97] = 'bbbwwbw';
	a[ 98] = 'bbwwbbw';
	a[ 99] = 'bbwbbww';
	a[100] = 'bwwwwbw';
	a[101] = 'bwbbbww';
	a[102] = 'bwwbbbw';
	a[103] = 'bwbwwww';
	a[104] = 'bwwwbww';
	a[105] = 'bwwbwww';
	a[106] = 'bbbwbww';
	a[ 91] = 'bwb';
	a[ 93] = 'bwb';

	return a;

} ();
//------------------------------------------------------------------------------
/*
 * Core Estimator
 * CPU core estimation timing attack using web workers
 * A polyfill for navigator.hardwareConcurrency
 * 2014-05-27
 * 
 * Copyright ΩF:∅ Working Group contributors
 * License: MIT
 *   See LICENSE.md
 */

/*! @source https://github.com/oftn/core-estimator/blob/master/core-estimator.js */

"use strict";

(function(view) {
	// Configuration (default: medium accuracy)
	var SAMPLES = 20;
	var WORKLOAD = 0x400000;
	// A workload of 0x2000000 with 15-20 samples should give you medium-high accuracy
	// at 6-8x the default runtime. Not suggested in production webapps!

	var dom_implemented = navigator.hardwareConcurrency;
	var doc = document;

	// Get the path of the currently running script
	var path = (doc.currentScript || doc.scripts[doc.scripts.length-1]).src
		.replace(/\/[^\/]+$/, "/");

	// Use PNaCl in Chrome
	if (!dom_implemented && navigator.mimeTypes["application/x-pnacl"]) {
		var HTML = "http://www.w3.org/1999/xhtml";
		var log_error = console.error.bind(console);
		var calls = [];

		var on_message = function(event) {
			var cores = navigator.hardwareConcurrency = event.data;
			var call;

			navigator.getHardwareConcurrency = function(callback, options) {
				callback(cores);
				if (options && options.progress) {
					options.progress(cores, cores, cores);
				}
			};

			while (call = calls.shift()) {
				navigator.getHardwareConcurrency(call[0], call[1]);
			}

			// Cleanup
			listener_div.removeEventListener("load", on_load, true);
			listener_div.removeEventListener("message", on_message, true);
			listener_div.removeEventListener("error", log_error, true);
			listener_div.removeEventListener("crash", log_error, true);
			doc.documentElement.removeChild(listener_div);
		};

		var on_load = function() {
			embed.postMessage(0);
		};

		navigator.getHardwareConcurrency = function(callback, options) {
			calls.push([callback, options]);
		};

		var listener_div = doc.createElementNS(HTML, "div");
		listener_div.addEventListener("load", on_load, true);
		listener_div.addEventListener("message", on_message, true);
		listener_div.addEventListener("error", log_error, true);
		listener_div.addEventListener("crash", log_error, true);

		var embed = doc.createElementNS(HTML, "embed");
		embed.setAttribute("path", path + "nacl_module/pnacl/Release");
		embed.setAttribute("src", path + "nacl_module/pnacl/Release/cores.nmf");
		embed.setAttribute("type", "application/x-pnacl");

		listener_div.appendChild(embed);
		doc.documentElement.appendChild(listener_div);

		return;
	}

	// Set up performance testing function
	var performance = view.performance || Date;
	if (!performance.now) {
		if (performance.webkitNow) {
			performance.now = performance.webkitNow;
		} else {
			performance.now = function() { return +new Date; };
		}
	}

	// Path to workload.js is derived from the path of the running script.
	var workload = path + "workload.js";

	var previously_run = false;

	// Set navigator.hardwareConcurrency to a sane value before getHardwareConcurrency is ever run
	if (!dom_implemented) {
		/** @expose */ navigator.hardwareConcurrency = 1;
		if (typeof Worker === "undefined") {
			// Web workers not supported, effectively single-core
			dom_implemented = true;
		}
	}

	/**
	 * navigator.getHardwareConcurrency(callback)
	 *
	 * Performs the statistical test to determine the correct number of cores
	 * and calls its callback with the core number as its argument.
	 *
	 * @expose
	 **/
	navigator.getHardwareConcurrency = function(callback, options) {
		options = options || {};
		if (!('use_cache' in options)) {
			options.use_cache = true;
		}

		// If we already have an answer, return early.
		if (dom_implemented || (options.use_cache && previously_run)) {
			callback(navigator.hardwareConcurrency);
			return;
		}

		doc.documentElement.style.cursor = "progress";

		var workers = []; // An array of workers ready to run the payload

		var worker_size = 1;
		var control;
		var controldata = [];

		iterate(function(worker_size, report) {

			measure(workers, worker_size, SAMPLES, function(data) {

				if (worker_size === 1) {
					Array.prototype.push.apply(controldata, data);
					control = analyse(controldata);

					report(true);
				} else {
					var group = analyse(data);

					var gv_gs = group.uvariance / group.size;
					var cv_cs = control.uvariance / control.size;
					var tscore = (group.mean - control.mean) / Math.sqrt(gv_gs + cv_cs);
					var freedom = Math.pow(gv_gs + cv_cs, 2) /
						(Math.pow(group.uvariance, 2) / (Math.pow(group.size, 2) * (group.size - 1) ) +
						Math.pow(control.uvariance, 2) / (Math.pow(control.size, 2) * (control.size - 1))); // don't ask

					report(accept(tscore, freedom));
				}
			});

		}, function(cores) {

			// Terminate our workers, we don't need them anymore.
			for (var i = 0, len = workers.length; i < len; i++) {
				workers[i].terminate();
			}

			// We found an estimate
			doc.documentElement.style.cursor = "";
			navigator.hardwareConcurrency = cores;
			previously_run = true;
			callback(cores);

		}, options.progress);
	}

	/**
	 * measure()
	 *
	 * Given a set of workers and a sample size,
	 * it calls back with an array of times it took
	 * to run all the workers simultaneously.
	 *
	 **/
	function measure(workers, worker_size, sample_size, callback) {
		var samples = [];

		// Guarantee that we have enough workers
		for (var i = workers.length; i < worker_size; i++) {
			workers.push(new Worker(workload));
		}

		loop(function(_repeat) {
			var begin, left = worker_size; // Number of workers we are waiting to finish

			// When a worker completes
			for (var i = 0; i < worker_size; i++) {
				workers[i].onmessage = function() {
					left--;
					if (!left) {
						sample_size--;
						samples.push(performance.now() - begin);
						if (sample_size) {
							_repeat();
						} else {
							callback(samples);
						}
					}
				}
			}

			// Kick-off our workers and start the clock
			for (var i = 0; i < worker_size; i++) {
				workers[i].postMessage(WORKLOAD);
			}
			begin = performance.now();
		});
	}

	function loop(body) {
		(function next() {
			body(next);
		}());
	}


	/**
	 * iterate(test, answer, progress)
	 *
	 * Given a test function and a callback,
	 * it will conduct a binary search to find the highest value
	 * which the test function returns as passing.
	 *
	 * Optionally takes a callback to report the state of the iterator.
	 *
	 **/
	function iterate(test, answer, progress) {
		// Let S be the set of possible core numbers on this machine.
		// S = {x \in N | x != 0 }.

		var min = 1, max = 1/0;

		// Find an upper bound (max - 1) on S by testing powers of two.
		// During these tests, we also come across a lower bound (min).
		(function repeat(cores) {

			if (progress) {
				progress(min, max, cores);
			}
			test(1, function() {
				test(cores, function(pass) {
					if (pass) {
						min = cores;

						// Repeat the test with double the cores.
						repeat(2 * cores);
					} else {
						max = cores;

						// * If S has one element, we found the number
						// * S has one element iff max - min = 1.
						// * Given max = min * 2 in invariant of this test,
						//       S has one element iff min = 1.
						if (min === 1) {
							return answer(min);
						}

						// We have finally found our upper bound; search space.
						search(min * 3 / 2, min / 4);
					}
				});
			});
		}(2));

		function search(center, pivot) {

			if (progress) {
				progress(min, max, center);
			}

			test(1, function() {
				test(center, function(pass) {
					if (pass) {
						min = center;
						center += pivot;
					} else {
						max = center;
						center -= pivot;
					}
					if (max - min === 1) {
						return answer(min);
					}
					if (!pivot) {
						// This means we haven't found an answer.
						// Oh well. Answer with the upper bound.
						return answer(max - 1);
					}
					search(center, pivot >> 1);
				});
			});
		}
	}

	/**
	 * analyse(array)
	 *
	 * Given an array of values, it returns a set of statistics.
	 *
	 **/
	function analyse(data) {
		// If we have no values, return null.
		var len = data.length;
		if (!len) {
			return null;
		}

		// Iterate through data, gathering information.
		var min = 1/0, max = -1/0;
		var sum = 0;
		var sum_squared_datum = 0;
		for (var i = 0; i < len; i++) {
			var datum = data[i];
			if (datum < min) min = datum;
			if (datum > max) max = datum;
			sum += datum;
			sum_squared_datum += Math.pow(datum, 2);
		}

		// Calculate statistics from information.
		var mean = sum / len;
		var mean_squared = Math.pow(mean, 2);
		var variance = 0;
		var unbiased_variance = 0;

		if (len > 1) {
			variance = sum_squared_datum / len - mean_squared;
			unbiased_variance = (sum_squared_datum - len * mean_squared) / (len - 1);
		}

		// Store statistics into object
		var stats = {
			size: len,
			//min: min,
			//max: max,
			mean: mean,
			//variance: variance,
			uvariance: unbiased_variance
		};

		return stats;
	};

	/**
	 * accept(tscore, freedom)
	 *
	 * Given a t-score and the number of degrees of freedom,
	 * return a boolean indicating whether the tscore is less than the
	 * critical value found in the t-table.
	 *
	 **/
	
	// This object is created from a t-table given a one-sided test and a 99.5% confidence.
	/** @const */ var table = {1: 63.66, 2: 9.925, 3: 5.841, 4: 4.604, 5: 4.032, 6: 3.707, 7: 3.499, 8: 3.355, 9: 3.25, 10: 3.169, 11: 3.106, 12: 3.055, 13: 3.012, 14: 2.977, 15: 2.947, 16: 2.921, 17: 2.898, 18: 2.878, 19: 2.861, 20: 2.845, 21: 2.831, 22: 2.819, 23: 2.807, 24: 2.797, 25: 2.787, 26: 2.779, 27: 2.771, 28: 2.763, 29: 2.756, 30: 2.75, 32: 2.738, 34: 2.728, 36: 2.719, 38: 2.712, 40: 2.704, 42: 2.698, 44: 2.692, 46: 2.687, 48: 2.682, 50: 2.678, 55: 2.668, 60: 2.66, 65: 2.654, 70: 2.648, 80: 2.639, 100: 2.626, 150: 2.609, 200: 2.601};

	function accept(tscore, freedom) {
		var keys = Object.keys(table);

		var key_low = keys.reduce(function(p, c) { if(freedom < c) return p; return c; });
		var key_high = keys.reduce(function(p, c) { if(freedom > c) return p; return c; });

		var span = key_high - key_low;
		var critical = linear(table[key_low], table[key_high], (freedom - key_low) / span);

		return tscore < critical;
	}

	function linear(a, b, t) { return a + (b - a) * t; }
}(self));
/**
 * 
 * @auther SM@K<smali.kazmi@hotmail.com>
 * @description website: smak.pk
 */

(function() {
    var root = this;

    var SmartPhone = function(obj) {
        if (obj instanceof SmartPhone)
            return obj;
        if (!(this instanceof SmartPhone))
            return new SmartPhone(obj);
        this._wrapped = obj;
    };

    SmartPhone.userAgent = null;
    SmartPhone.getUserAgent = function() {
        return this.userAgent;
    };

    SmartPhone.setUserAgent = function(userAgent) {
        this.userAgent = userAgent;
    };

    SmartPhone.isAndroid = function() {
		return this.getUserAgent().match(/Android/i)
    };

    SmartPhone.isBlackBerry = function() {
        return this.getUserAgent().match(/BlackBerry/i);
    };

    SmartPhone.isBlackBerryPlayBook = function() {
        return this.getUserAgent().match(/PlayBook/i);
    };

    SmartPhone.isBlackBerry10 = function() {
        return this.getUserAgent().match(/BB10/i);
    };

    SmartPhone.isIOS = function() {
        return this.isIPhone() || this.isIPad() || this.isIPod();
    };

    SmartPhone.isIPhone = function() {
        return this.getUserAgent().match(/iPhone/i);
    };
    
    SmartPhone.isIPad = function() {
        return this.getUserAgent().match(/iPad/i);
    };
    
    SmartPhone.isIPod = function() {
        return this.getUserAgent().match(/iPod/i);
    };
    
    SmartPhone.isOpera = function() {
        return this.getUserAgent().match(/Opera Mini/i);
    };
    
    SmartPhone.isWindows = function() {
        return this.isWindowsDesktop() || this.isWindowsMobile();
    };
    
    SmartPhone.isWindowsMobile = function() {
        return this.getUserAgent().match(/IEMobile/i);
    };
    
    SmartPhone.isWindowsDesktop = function() {
        return this.getUserAgent().match(/WPDesktop/i);
    };

    SmartPhone.isFireFox = function() {
		var ua = this.getUserAgent();
        return ua.match(/Firefox/i)
			&& (ua.match(/Mobile/i)
				|| ua.match(/Tablet/i)
				|| ua.match(/TV;/i));
    };

    SmartPhone.isNexus = function() {
        return this.getUserAgent().match(/Nexus/i);   
    };

    SmartPhone.isKindleFire = function() {
        return this.getUserAgent().match(/Kindle Fire/i);
    };

    SmartPhone.isPalm = function() {
        return this.getUserAgent().match(/PalmSource|Palm/i);
    };
    
    SmartPhone.isAny = function() {
		if( window.navigator.maxTouchPoints || 'ontouchstart' in document )
			return true;

        var foundAny = false;
        var getAllMethods = Object.getOwnPropertyNames(SmartPhone).filter(function(property) {
            return typeof SmartPhone[property] == 'function';
        });

        for (var index in getAllMethods) {
            if (getAllMethods[index] === 'setUserAgent' || getAllMethods[index] === 'getUserAgent' ||
                    getAllMethods[index] === 'isAny' || getAllMethods[index] === 'isWindows' ||
                    getAllMethods[index] === 'isIOS') {
                continue;
            }
            if (SmartPhone[getAllMethods[index]]()) {
                foundAny = true;
                break;
            }
        }
        return foundAny;
    };
    
    if(typeof window === 'function' || typeof window === 'object') {
        SmartPhone.setUserAgent(navigator.userAgent);
    } 
    
    if (typeof exports !== 'undefined') {
        
        var middleware = function(isMiddleware) {

            isMiddleware = isMiddleware === (void 0)  ? true : isMiddleware;

            if(isMiddleware) {
                return function(req, res, next) {
                    
                    var userAgent = req.headers['user-agent'] || '';
                    SmartPhone.setUserAgent(userAgent);
                    req.SmartPhone = SmartPhone;
                    
                    if ('function' === typeof res.locals) {
                        res.locals({SmartPhone: SmartPhone});
                    } else {
                        res.locals.SmartPhone = SmartPhone;
                    }
                    
                    next();
                };
            } else {
                return SmartPhone;
            }

        };
        
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = middleware;
        }
        exports = middleware;
    } else {
        root.SmartPhone = SmartPhone;
    }

}.call(this));
//------------------------------------------------------------------------------
let null_uuid = '00000000-0000-0000-0000-000000000000';
let manager = null;
let msg_source = null;
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class HtmlPageState {

	get paging_state_template() {

		return {
			pgno_					: 0,
			pages_ 					: 0,
			page_size_				: 0,
			order_					: 1,
			direction_				: 0,
			selections_				: false,
			selections_state_		: [],
			selections_checked_		: false,
			select_by_car_			: false,
			select_by_car_state_	: {},
			select_by_car_checked_	: false
		};

	}

	constructor() {

		// paging

		this.directions_	= [ 'asc', 'desc' ];

		this.orders_		= [
			{
				name		: 'code',
				display		: 'Код',
				ico			: {
					asc		: 'assets/sorting/sort_number_column.ico',
					desc	: 'assets/sorting/sort_number_column.ico'
				},
				order_icons : {
					asc		: 'assets/sorting/sort_number.ico',
					desc	: 'assets/sorting/sort_number_descending.ico'
				}
			},
			{
				name		: 'name',
				display		: 'Наименование',
				ico			: {
					asc		: 'assets/sorting/sort_alphabel_column.ico',
					desc	: 'assets/sorting/sort_alphabel_column.ico'
				},
				order_icons : {
					asc		: 'assets/sorting/sort_asc_az.ico',
					desc	: 'assets/sorting/sort_desc_az.ico'
				}
			},
			{
				name		: 'price',
				display		: 'Цена',
				ico			: {
					asc		: 'assets/sorting/sort_price.ico',
					desc	: 'assets/sorting/sort_price_descending.ico'
				},
				order_icons : {
					asc		: 'assets/sorting/sort_ascending.ico',
					desc	: 'assets/sorting/sort_descending.ico'
				}
			}/*,
			{
				name		: 'remainder',
				display		: 'Остаток',
				ico			: {
					asc		: 'assets/sorting/sort_quantity.ico',
					desc	: 'assets/sorting/sort_quantity_descending.ico'
				},
				order_icons : {
					asc		: 'assets/sorting/sort_ascending.ico',
					desc	: 'assets/sorting/sort_descending.ico'
				}
			}*/
		];

		this.page_state_	= {
			category_					: null_uuid,
			paging_state_by_category_	: { [null_uuid] : this.paging_state_template },
			product_					: null_uuid,
			cart_edit_					: false,
			cart_pgno_					: 0,
			cart_						: [],
			cart_by_uuid_				: {},
			cart_page_size_				: 0,
			cart_pages_					: 0,
			alert_						: false,
			large_img_view_				: false,
			search_panel_				: false,
			vk_							: false,
			fts_filter_					: ''
		};

		// render
		this.start_ 		= mili_time();
		this.ellapsed_		= 0;

	}

	post_json(path, data) {
		let response, request = JSON.stringify(data, null, '\t');
		let object = this;
		let current_event = object.current_event_;

		if( !current_event.deferred_xhrs_ )
			current_event.deferred_xhrs_ = {};

		if( !this.md5_ )
			this.md5_ = new Hashes.MD5;

		let hash = this.md5_.hex(path + "\n\n" + request);
		let xhr = current_event.deferred_xhrs_[hash];

		if( xhr ) {
			if( xhr.status !== 200 ) {
				let status = xhr.status;
				let statusText = xhr.statusText;
				let responseText = xhr.responseText;
				throw new Error(status.toString() + ' ' + statusText + "\n" + responseText);
			}

			response = JSON.parse(xhr.responseText, JSON.dateParser);
		}
		else {
			let xhr = new XMLHttpRequest;
			xhr.timeout = 180000;
			xhr.open('PUT', path, true);
			xhr.setRequestHeader('Content-Type'		, 'application/json; charset=utf-8');
			xhr.setRequestHeader('If-Modified-Since'	, 'Sat, 1 Jan 2000 00:00:00 GMT');
			xhr.setRequestHeader('Cache-Control'		, 'no-store, no-cache, must-revalidate, max-age=0');

			xhr.onreadystatechange = () => {
				if( xhr.readyState === XMLHttpRequest.DONE && xhr.status !== 0 )
					object.events_handler(current_event);
			};

			current_event.deferred_xhrs_[hash] = xhr;

			xhr.send(request);

			throw new XhrDeferredException;
		}

		return response;
	}
}
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class Render {

	get state() {
    	return this.state_;
	}

	set state(s) {
    	this.state_ = s;
	}

	constructor() {

		this.state_ = null;

		this.get_remainder = function (product) {

			if( product.remainder == 0 )
				return '-';

			let n = Math.trunc(product.remainder) != product.remainder;
			let f = n ? '%.3f' : '%d';
			let s = sprintf(f, product.remainder);

			while( n && s.endsWith('0') )
				s = s.substr(0, s.length - 1);

			return s;

		};

		this.get_reserve = function (product) {

			let n = Math.trunc(product.reserve) != product.reserve;
			let f = n ? '%.3f' : '%d';
			let s = sprintf(f, product.reserve);

			while( n && s.endsWith('0') )
				s = s.substr(0, s.length - 1);

			return product.reserve != 0 ? '&nbsp;(' + s + ')' : '';

		};

	}

	static debug(level, s = null) {

		let p = xpath_single('html/body/div[@debug]/div[@debug=\'' + level + '\']');

		if( p ) {
			p.innerHTML = s;
			p.style.display = s !== null ? 'inline-block' : 'none';
		}

	}

	debug_ellapsed(level, prefix = '') {

		let state = this.state_;
		let finish = mili_time();
		let ellapsed = (finish - state.start_) + state.ellapsed_;

		Render.debug(level, prefix + '<font>' + ellapsed_time_string(ellapsed) + '</font>');

	}

	static hide_cursor() {

		// hide cursor
		/*let cr = touch ? 'none' : 'pointer';

		if( touch )
			xpath_eval_single('html/body').style.cursor = cr;

		for( let a of xpath_eval('//div[@btn or @btc]') )
			a.style.cursor = cr;

		for( let a of xpath_eval('//div[@pitem]/div[@pimg]') )
			a.style.cursor = cr;
		*/
	}

	assemble_page(new_page_state, data) {

		let state = this.state_;
		let new_paging_state = new_page_state.paging_state_by_category_[new_page_state.category_];
		let element = xpath_eval_single('html/body/div[@plist]/div[@ptable]');

		if( element.innerHTML.isEmpty() ) {

			// create products page list and install events
			let html = '';

			for( let i = 0; i < new_paging_state.page_size_; i++ )
				html +=
					'<div pitem="' + i + '">'
					+ '<div pimg></div>'
					+ '<p pname></p>'
					+ '<p pprice></p>'
					+ '<p pquantity></p>'
					+ '<div btn buy>'
					+ '<img btn_ico src="assets/cart/cart_put.ico">'
					//+ '<span btn_txt>КУПИТЬ</span>'
					+ '</div>'
					+ '</div>';
				;

			element.innerHTML = html.replace(/(?:[\r\n\t])/g, '');

			state.setup_events(xpath_eval('div[@pitem]/div[@pimg]', element));
			state.setup_events(xpath_eval('div[@pitem]/div[@btn]', element));

		}

		let products = data.products;
		let style = {};

		let item_width = 99.0 / new_paging_state.page_size_;

		if( new_paging_state.item_width_ !== item_width ) {
			style.width = sprintf('%.5f', item_width) + '%';
			new_paging_state.item_width_ = item_width;
		}

		let items = xpath_eval('div[@pitem]', element);

		for( let a of items ) {

			let i = parseInt(a.attributes.pitem.value, 10);
			let uuid = '', name = '', img_uuid = '', img_url = '', price = '', quantity = '';

			if( i < products.length ) {

				let product = products[i];

				uuid		= product.uuid;
				name		= product.name + ' [' + product.code + ']';
				img_uuid 	= product.img;
				img_url 	= product.img_url;
				price		= product.price + '&nbsp;<i rouble>&psi;</i>';//₽';
				quantity	= this.get_remainder(product) + this.get_reserve(product);

				style.visibility = 'visible';

				a.setAttribute('uuid'		, uuid);
				a.setAttribute('price'		, product.price);
				a.setAttribute('remainder'	, product.remainder);
				a.setAttribute('reserve'	, product.reserve);

			}
			else {

				style.visibility = 'hidden';

				a.removeAttribute('uuid');
				a.removeAttribute('remainder');
				a.removeAttribute('reserve');
			}

			let img = xpath_eval_single('div[@pimg]', a);
			img.setAttribute('uuid', img_uuid);
			img.style.backgroundImage = 'url(' + img_url + ')';

			xpath_eval_single('p[@pname]'		, a).innerHTML	= name;
			xpath_eval_single('p[@pprice]'		, a).innerHTML	= price;
			xpath_eval_single('p[@pquantity]'	, a).innerHTML	= quantity;

			style.float = i + 1 < new_paging_state.page_size_ ? 'left' : 'right';

			for( let key in	style )
				if( a.style[key] !== style[key] )
					a.style[key] = style[key];

		}

		let pctrl = xpath_eval_single('html/body/div[@pcontrols]');
		let base = xpath_eval_single('div[@plist_controls]', pctrl);

		xpath_eval_single('div[@first_page]', base).fade(new_paging_state.pgno_ >= 2 && new_paging_state.pages_ >= 2);
		xpath_eval_single('div[@prev_page]', base).fade(new_paging_state.pgno_ !== 0 && new_paging_state.pages_ >= 2);
		xpath_eval_single('div[@prev_page]/span[@btn_txt]', base).innerText = (new_paging_state.pgno_ + 1) - 1;
		xpath_eval_single('div[@next_page]', base).fade(new_paging_state.pgno_ <= new_paging_state.pages_ - 2 && new_paging_state.pages_ >= 2);
		xpath_eval_single('div[@next_page]/span[@btn_txt]', base).innerText = (new_paging_state.pgno_ + 1) + 1;
		xpath_eval_single('div[@last_page]', base).fade(new_paging_state.pgno_ <= new_paging_state.pages_ - 3 && new_paging_state.pages_ >= 3);
		xpath_eval_single('div[@last_page]/span[@btn_txt]', base).innerText = new_paging_state.pages_ > 0 ? new_paging_state.pages_ : '';

		base = xpath_eval_single('div[@psort_controls]', pctrl);

		let order = state.orders_[new_paging_state.order_];
		let direction = state.directions_[new_paging_state.direction_];

		xpath_eval_single('div[@list_sort_order]/span[@btn_txt]', base).innerText = '';//order.display;
		xpath_eval_single('div[@list_sort_order]/img[@btn_ico]', base).src = order.ico[direction];
		xpath_eval_single('div[@list_sort_direction]/img[@btn_ico]', base).src = order.order_icons[direction];

	}

	assemble_info(new_page_state, data) {

		let state = this.state_;
		let product = data.product;
		let pinfo_element = xpath_eval_single('html/body/div[@pinfo]');
		let pbuy_quantity = xpath_eval_single('div[@pright]/p[@pbuy_quantity]', pinfo_element);
		let cart_entity = new_page_state.cart_by_uuid_[product.uuid];

		pbuy_quantity.innerText = cart_entity ? cart_entity.buy_quantity : '-';

		pinfo_element.setAttribute('uuid'		, product.uuid);
		pinfo_element.setAttribute('price'		, product.price);
		pinfo_element.setAttribute('remainder'	, product.remainder);
		pinfo_element.setAttribute('reserve'	, product.reserve);

		xpath_eval_single('div[@pimg]', pinfo_element).style.backgroundImage = 'url(' + product.img_url + ')';
		xpath_eval_single('div[@pmid]/p[@pname]', pinfo_element).innerHTML = product.name + ' [' + product.code + ']';

		let coefficients = [ 1, 1 ];
		let html = '';

		for( let p of data.properties ) {

			coefficients[0] = Math.max(coefficients[0], p.property_name.length);
			coefficients[1] = Math.max(coefficients[1], p.value.toString().length);

			html = html + `
				<div pproperty property_uuid="${p.property_uuid}" property_idx="${p.property_idx}" value_uuid="${p.value_uuid}" value_type="${p.value_type}">
				<span pproperty_name>${p.property_name}</span>
				<span pproperty_value>&nbsp;${p.value}</span>
				</div>`
			;

		}

        let pproperties_element = xpath_eval_single('div[@pmid]/div[@pproperties]', pinfo_element);
		pproperties_element.innerHTML = html.replace(/(?:[\r\n\t])/g, '');

		// 13 rows -> 350px on my display debug
		// x rows  <- y px  on target display
		let y = sscanf(getComputedStyle(pinfo_element).height, '%u')[0];
		let x = y * 10 / 350;
		let e = xpath_eval_single('div[@pmid]/div[@pproperties]', pinfo_element);
		e.style.MozColumnCount = Math.trunc(data.properties.length / x) + 1;

		let proportions = distribute_proportionally(100, coefficients);
		proportions[0] = sprintf('%.2f%%', proportions[0]);
		proportions[1] = sprintf('%.2f%%', proportions[1]);

		for( let e of xpath_eval('div[@pmid]/div[@pproperties]/div[@pproperty]/span[@pproperty_name]', pinfo_element) )
			e.style.width = proportions[0];
		for( let e of xpath_eval('div[@pmid]/div[@pproperties]/div[@pproperty]/span[@pproperty_value]', pinfo_element) )
			e.style.width = proportions[1];

		xpath_eval_single('div[@pright]/p[@pprice]'		, pinfo_element).innerHTML	= 'Цена&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;' + product.price + '&nbsp;<i rouble>&psi;</i>';//₽';
		xpath_eval_single('div[@pright]/p[@pquantity]'	, pinfo_element).innerHTML	= 'Остаток&nbsp;:&nbsp;' + this.get_remainder(product) + this.get_reserve(product);
		xpath_eval_single('div[@pright]/p[@pincart]'	, pinfo_element).innerHTML	= cart_entity ? 'Заказано:&nbsp;' + cart_entity.buy_quantity : '';

		html = '';

		for( let p of data.remainders ) {

			html = html
				+ '<p premainder>'
				+ '<span pshop_name shop_uuid="' + p.shop_uuid + '">' + p.shop_name + '</span>'
				+ '<span pshop_quantity shop_uuid="' + p.shop_uuid + '">' + this.get_remainder(p) + this.get_reserve(p) + '</span>'
				+ '</p>'
			;

		}

		xpath_eval_single('div[@pright]/div[@premainders]', pinfo_element).innerHTML = html.replace(/(?:[\r\n\t])/g, '');
		xpath_eval_single('div[@pright]/p[@premainders_head]', pinfo_element).fade(data.remainders.length > 0);

		for( let e of xpath_eval('div[@pright]/hr', pinfo_element) )
			e.fade(data.remainders.length > 0);

		e = xpath_eval_single('div[@pmid]/div[@pdescription]', pinfo_element);
		//e.innerHTML = product.description ? product.description_in_html ? product.description : `<pre>${product.description}</pre>` : '';
		e.innerHTML = product.description ? product.description.replace(/(?:[\r\n\t])/g, '') : '';

		// when description rollup then rolldown
		pproperties_element.fadein();

	}

	assemble_cart_informer(new_page_state) {

		let state = this.state_;
		let cart = new_page_state.cart_;
		let pcrin = xpath_eval_single('html/body/div[@top]/div[@cart_informer]');

		if( cart.length > 0 ) {
	
			let ccount = 0;
			let csum = 0;

			for( let e of cart ) {
				ccount	+= e.buy_quantity;
				csum	+= e.buy_quantity * e.price;
			}

			let cinfo = xpath_eval_single('div[@cinfo]', pcrin);

			xpath_eval_single('p[@ccount]'	, cinfo).innerHTML = 'В корзине: ' + ccount;// + ' товар' + (ccount == 1 ? '' : ccount <= 4 ? 'а' : 'ов');
			xpath_eval_single('p[@csum]'	, cinfo).innerHTML = 'На сумму : ' + csum + '<i rouble>&psi;</i>';// + '&nbsp;₽';

		}

	}

	assemble_cart(new_page_state, data) {

		let state = this.state_;
		let pcrin = xpath_single('html/body/div[@top]/div[@cart_informer]/div[@btn and @cart]');
		let base = xpath_single('html/body/div[@pcart]');
		let element = xpath_single('div[@ptable]', base);

		if( !(pcrin && base && element) )
			return;

		let cart = new_page_state.cart_;

		if( !new_page_state.cart_page_size_ ) {
			//let height = sscanf(getComputedStyle(element).height, '%u')[0];
			//let line_height = sscanf(getComputedStyle(pcrin).height, '%u')[0];
			//new_page_state.cart_page_size_ = page_size = Math.trunc(height / line_height);
			new_page_state.cart_page_size_ = this.debug_ ? 9 : Math.trunc(9 * 720 / 390);
		}

		new_page_state.cart_pages_ = Math.trunc(cart.length / new_page_state.cart_page_size_) + (cart.length % new_page_state.cart_page_size_ !== 0 ? 1 : 0);

		// if pages changed suddenly
		if( new_page_state.cart_pgno_ >= new_page_state.cart_pages_ )
			new_page_state.cart_pgno_ = new_page_state.cart_pages_ > 0 ? new_page_state.cart_pages_ - 1 : 0;

		if( element.innerHTML.isEmpty() ) {

			let html = '';

			for( let i = 0; i < new_page_state.cart_page_size_; i++ )
				html = html
					+ '<div pitem="' + i + '">'
					+ '<span pno></span>'
					+ '<div pimg></div>'
					+ '<span pname></span>'
					+ '<span pprice></span>'
					+ '<span psum></span>'
					+ '<div btn plus_one>'
					+ '<img btn_ico src="assets/plus.ico">'
					+ '</div>'
					+ '<span pbuy_quantity></span>'
					+ '<div btn minus_one>'
					+ '<img btn_ico src="assets/minus.ico">'
					+ '</div>'
					+ '</div>'
				;

			element.innerHTML = html.replace(/(?:[\r\n\t])/g, '');

			state.setup_events(xpath_eval('div[@pitem]/div[@btn]', element));

		}

		let items = xpath_eval('div[@pitem]', element);
		let buy_quantity_one = true;

		for( let a of items ) {

			let i = parseInt(a.attributes.pitem.value, 10);
			let n = i + new_page_state.cart_pgno_ * new_page_state.cart_page_size_;

			if( n < cart.length ) {

				let e = cart[n];

				xpath_eval_single('span[@pno]'				, a).innerHTML				= n + 1;
				xpath_eval_single('div[@pimg]'				, a).style.backgroundImage	= 'url(' + e.img_url + ')';
				xpath_eval_single('span[@pname]'			, a).innerHTML				= e.name + ' [' + e.code + ']';
				xpath_eval_single('span[@pprice]'			, a).innerHTML				= e.price + '&nbsp;<i rouble>&psi;</i>';//₽';
				xpath_eval_single('span[@psum]'				, a).innerHTML				= e.price * e.buy_quantity + '&nbsp;<i rouble>&psi;</i>';//₽';
				xpath_eval_single('span[@pbuy_quantity]'	, a).innerText				= e.buy_quantity;

				if( e.buy_quantity > 1 )
					buy_quantity_one = false;

				a.setAttribute('uuid'		, e.uuid);
				a.setAttribute('remainder'	, e.remainder);
				a.setAttribute('reserve'	, e.reserve);

				a.style.visibility = 'visible';

			}
			else {

				a.style.visibility = 'hidden';

			}

		}

		let pctrl = xpath_eval_single('div[@pcontrols]', base);

		xpath_eval_single('div[@prev_page]', pctrl).fade(new_page_state.cart_pgno_ > 0);
		xpath_eval_single('div[@next_page]', pctrl).fade(new_page_state.cart_pgno_ + 1 < new_page_state.cart_pages_);

		for( let a of xpath_eval('div[@pitem]/span[@psum]', element) )
			a.fade(!buy_quantity_one);

		if( new_page_state.constants_ ) {
			xpath_eval_single('html/body/div[@top]/div[@mag]').innerHTML = `
				<p>&nbsp;</p>
				<p>${new_page_state.constants_['ТекущийМагазинПредставление']}</p>
				<p>${new_page_state.constants_['ТекущийМагазинАдрес']}</p>
			`.replace(/(?:[\r\n\t])/g, '');

			delete new_page_state.constants_;
		}
	}

	rewrite_info(new_page_state = null) {

		let state = this.state_;

		if( new_page_state === null )
			new_page_state = state.page_state_;

		let request = {
			'module'	: 'producter',
			'handler'	: 'producter',
			'product'	: new_page_state.product_
		};

		let data = state.post_json('proxy.php', request);
		//state.ellapsed_ += data.ellapsed;

		this.assemble_info(new_page_state, data);

	}

	rewrite_page(new_page_state = null) {

		let state = this.state_;

		if( new_page_state === null )
			new_page_state = state.page_state_;

		let new_paging_state = new_page_state.paging_state_by_category_[new_page_state.category_];
		let request = {
			'module'			: 'pager',
			'handler'			: 'pager',
			'category'			: new_page_state.category_ !== null_uuid ? new_page_state.category_ : null,
			'order'				: state.orders_[new_paging_state.order_].name,
			'direction'			: state.directions_[new_paging_state.direction_],
			'pgno'				: new_paging_state.pgno_
		};

		let new_selections_state = new_paging_state.selections_state_;
		let selections = [];

		for( let p of new_selections_state ) {

			let a = [];

			for( let v of p.values ) {

				if( !v.checked )
					continue;

				a.push(extend_object(v));

			}

			if( a.length !== 0 ) {

				let q = extend_object(p);

				q.values = a;

				selections.push(q);

			}

		}

		if( selections.length !== 0 )
			request.selections = selections;

		let select_by_car_state = new_paging_state.select_by_car_state_;

		if( select_by_car_state.car )
			request.car = select_by_car_state.car;

		request.fts_filter = new_page_state.fts_filter_;

		let data = state.post_json('proxy.php', request);
		//state.ellapsed_ += data.ellapsed;

		new_paging_state.page_size_	= data.page_size;
		new_paging_state.pages_		= data.pages;

		// if pages changed suddenly
		if( new_paging_state.pgno_ > 0 && new_paging_state.pgno_ >= new_paging_state.pages_ ) {
			new_paging_state.pgno_ = new_paging_state.pages_ > 0 ? new_paging_state.pages_ - 1 : 0;
			this.rewrite_page(new_page_state);
			return;
		}

		this.assemble_page(new_page_state, data);

	}

	rewrite_cart(new_page_state = null, product = null_uuid, buy_quantity = null, buy_price = null) {

		let state = this.state_;

		if( new_page_state === null )
			new_page_state = state.page_state_;

		let request = {
			'module'		: 'carter',
			'handler'		: 'carter'
		};

		let cart_entity = new_page_state.cart_by_uuid_[product];

		if( cart_entity ) {

			cart_entity.buy_quantity = buy_quantity > cart_entity.remainder ? cart_entity.remainder : buy_quantity;

			if( cart_entity.buy_quantity < 0 )
				cart_entity.buy_quantity = 0;

			cart_entity.modified = true;

		}
		else if( product !== null_uuid && buy_quantity !== null ) {

			if( !request.products )
				request.products = [];

			let price = typeof buy_price === 'string' ? Number.parseFloat(buy_price) : buy_price;

			if( Number.isNaN(price) )
				price = 0;

			request.products.push({
				'uuid'		: product,
				'quantity'	: buy_quantity,
				'price'		: price
			});

		}

		for( let e of new_page_state.cart_ ) {

			if( !e.modified )
				continue;

			if( !request.products )
				request.products = [];

			let req = {
				'uuid'		: e.uuid,
				'quantity'	: e.buy_quantity,
				'price'		: e.price
			};

			request.products.push(req);

		}

		let data = state.post_json('proxy.php', request);
		//state.ellapsed_ += data.ellapsed;

		new_page_state.constants_ = data.constants;
		new_page_state.cart_ = data.cart;
		new_page_state.cart_by_uuid_ = {};

		for( let e of data.cart )
			new_page_state.cart_by_uuid_[e.uuid] = e;

		this.assemble_cart_informer(new_page_state);
		this.assemble_cart(new_page_state, data);

		if( product === new_page_state.product_ ) {
	
			cart_entity = new_page_state.cart_by_uuid_[product];

			let p = xpath_single('html/body/div[@pinfo]/div[@pright]/p[@pincart]');

			if( p )
				p.innerHTML = cart_entity ? 'Заказано:&nbsp;' + cart_entity.buy_quantity : '';

		}

		// if cart empty go back
		if( new_page_state.cart_.length === 0 )
			new_page_state.cart_edit_ = false;

	}

	assemble_selections(new_page_state, data) {

		let state = this.state_;
		let new_paging_state = new_page_state.paging_state_by_category_[new_page_state.category_];
		let selections_state = new_paging_state.selections_state_;
		let html = '';

		for( let i = 0; i < data.setup.length; i++ ) {

			let p = data.setup[i];
			let cols = p.columns;

			html = html + `
				<div property uuid="${p.uuid}">
				<div>${p.display}</div>
				<div values ${cols === 0 ? 'one_column' : ''}
					${cols !== 0 ? ' style="-moz-column-count: ' + cols + '"' : ''}>`
			;

			let br = p.columns > 1 ? '<br>' : '';

			for( let j = 0; j < p.values.length; j++ ) {

				let v = p.values[j];
				let prop = selections_state.find(e => e.uuid === p.uuid);
				let val = prop ? prop.values.find(e => e.uuid === v.uuid) : undefined;

				v.checked = val ? val.checked : false;

				html = html + `
					<div value uuid="${v.uuid}"${v.checked ? ' checked' : ''}>
					<span ico check_box></span>
					<span txt check_box>${v.value}</span>
					</div>`
				;

			}

			html = html
				+ '</div>'
				+ '</div>'
			;

		}

		new_paging_state.selections_state_ = data.setup;

		let element = xpath_eval_single('html/body/div[@categories]/div[@selections_frame and @uuid=\'' + new_page_state.category_ + '\']');
		element.innerHTML = html.replace(/(?:[\r\n\t])/g, '');

		state.setup_events(xpath_eval('div[@property]/div[@values]/div[@value]', element));

	}

	rewrite_selections(new_page_state = null) {

		let state = this.state_;

		if( new_page_state === null )
			new_page_state = state.page_state_;

		let new_paging_state = new_page_state.paging_state_by_category_[new_page_state.category_];

		let request = {
			'module'	: 'selectorer',
			'handler'	: 'selectorer',
			'category'	: new_page_state.category_ !== null_uuid ? new_page_state.category_ : null,
			'setup'		: true
		};

		let data = state.post_json('proxy.php', request);

		this.assemble_selections(new_page_state, data);

	}

	assemble_select_by_car(new_page_state) {

		let state = this.state_;
		let new_paging_state = new_page_state.paging_state_by_category_[new_page_state.category_];
		let select_by_car_state = new_paging_state.select_by_car_state_;
		let html = '';

		for( let i = 0; i < select_by_car_state.values.length; i++ ) {

			let v = select_by_car_state.values[i];

			html = html + `
				<div value uuid="${v.uuid}">
				${v.value}
				</div>`
			;

		}

		let frame = xpath_eval_single('html/body/div[@categories]/div[@select_by_car_frame and @uuid=\'' + new_page_state.category_ + '\']');
		let e = xpath_eval_single('div[@values]', frame);
		e.innerHTML = html.replace(/(?:[\r\n\t])/g, '');

		state.setup_events(xpath_eval('div[@value]', e));

		xpath_eval_single('div[@manufacturer]/span[@value]'	, frame).innerText = select_by_car_state.manufacturer	? select_by_car_state.manufacturer.value	: '';
		xpath_eval_single('div[@model]/span[@value]'		, frame).innerText = select_by_car_state.model			? select_by_car_state.model.value			: '';
		xpath_eval_single('div[@modification]/span[@value]'	, frame).innerText = select_by_car_state.modification	? select_by_car_state.modification.value	: '';
		xpath_eval_single('div[@year]/span[@value]'			, frame).innerText = select_by_car_state.year			? select_by_car_state.year.value			: '';

	}

	rewrite_select_by_car(new_page_state = null) {

		let state = this.state_;

		if( new_page_state === null )
			new_page_state = state.page_state_;

		let new_paging_state = new_page_state.paging_state_by_category_[new_page_state.category_];
		let select_by_car_state = new_paging_state.select_by_car_state_;

		let request = {
			'module'	: 'by_car_selectorer',
			'handler'	: 'by_car_selectorer',
			'category'	: new_page_state.category_ !== null_uuid ? new_page_state.category_ : null
		};

		if( select_by_car_state.manufacturer )
			request.manufacturer = select_by_car_state.manufacturer.uuid;
		if( select_by_car_state.model )
			request.model = select_by_car_state.model.uuid;
		if( select_by_car_state.modification )
			request.modification = select_by_car_state.modification.uuid;
		if( select_by_car_state.year )
			request.year = select_by_car_state.year.uuid;

		let data = state.post_json('proxy.php', request);

		new_paging_state.select_by_car_state_.values = data.values;

		if( data.car )
			new_paging_state.select_by_car_state_.car = data.car;

	}

	rewrite_category(new_page_state = null) {

		let state = this.state_;

		if( new_page_state === null )
			new_page_state = state.page_state_;

		let element = xpath_eval_single('html/body/div[@categories]');
		let request = {
			'module'	: 'categorer',
			'handler'	: 'categorer',
			'parent'	: new_page_state.category_ !== null_uuid ? new_page_state.category_ : null
		};

		let data = state.post_json('proxy.php', request);
		let categories = data.categories;
		let html = '';

		for( let i = 0; i < categories.length; i++ ) {

			let c = categories[i];
			let new_paging_state = new_page_state.paging_state_by_category_[c.uuid];

			if( !new_paging_state ) {

				new_paging_state = state.paging_state_template;
				new_paging_state.category_ = c.uuid;
				new_page_state.paging_state_by_category_[c.uuid] = new_paging_state;

			}

			html = html + `
				<div btc uuid="${c.uuid}"
			 		${c.uuid === new_page_state.category_ ? ' blink' : ''}>
					${c.name}
				</div>
				<div selections_frame fadein instant uuid="${c.uuid}"></div>
				<div btn clear_selections uuid="${c.uuid}">
					<img btn_ico src="assets/filter_clear.ico">
					<span btn_txt>ОЧИСТИТЬ</span>
				</div>`
			;

			html = html + `
				<div select_by_car_frame fadein instant uuid="${c.uuid}">
					<div selector manufacturer>
						<!--<span ico search_field></span>
						<span ico list_box></span>-->
						<span label>Производитель</span>
						<img arrow src="assets/arrows/arrow_right.ico">
						<span value></span>
					</div>
					<div selector model>
						<span label>Модель</span>
						<img arrow src="assets/arrows/arrow_right.ico">
						<span value></span>
					</div>
					<div selector modification>
						<span label>Модификация</span>
						<img arrow src="assets/arrows/arrow_right.ico">
						<span value></span>
					</div>
					<div selector year>
						<span label>Год выпуска</span>
						<img arrow src="assets/arrows/arrow_right.ico">
						<span value></span>
					</div>
					<div selector values></div>
				</div>
				<div btn clear_select_by_car uuid="${c.uuid}">
					<img btn_ico src="assets/car_clear.ico">
					<span btn_txt>ОЧИСТИТЬ</span>
				</div>`
			;

		}

		element.innerHTML = html.replace(/(?:[\r\n\t])/g, '');

		// set events for new a[@btc] elements
		state.setup_animation_events(xpath_eval('//*[@fadein or @fadeout]', element));
		state.setup_events(xpath_eval('div[@btc or @btn]', element));

	}

	show_new_page_state(new_page_state = null) {

		let zero = new_page_state === null;
		let state = this.state_;
		let cur_state = state.page_state_;
		let cur_paging_state = cur_state.paging_state_by_category_[cur_state.category_];

		if( new_page_state === null )
			new_page_state = cur_state;

		let new_paging_state = new_page_state.paging_state_by_category_[new_page_state.category_];

		let plist = xpath_single('html/body/div[@plist]');
		let pinfo = xpath_single('html/body/div[@pinfo]');
		let backb = xpath_single('html/body/div[@btn and @back]');
		let selsb = xpath_single('html/body/div[@btn and @selections]');
		let carbb = xpath_single('html/body/div[@btn and @select_by_car]');
		let pcart = xpath_single('html/body/div[@pcart]');
		let pctrl = xpath_single('html/body/div[@pcontrols]');
		let pcrin = xpath_single('html/body/div[@top]/div[@cart_informer]');
		let catsb = xpath_eval('html/body/div[@categories]/div[@btc]');

		if( new_page_state.cart_.length > 0 && (cur_state.cart_.length === 0 || zero) )
			pcrin.fadein();

		if( new_page_state.cart_.length === 0 && cur_state.cart_.length > 0 )
			pcrin.fadeout();

		let setup_categories_selections = function () {

			let f = new_page_state.category_ !== null_uuid && new_page_state.product_ === null_uuid;

			selsb && selsb.fade(f);
			carbb && carbb.fade(f);

			let e = xpath_single('html/body/div[@categories]');

			for( let cat_uuid in new_page_state.paging_state_by_category_ ) {

				if( cat_uuid === null_uuid )
					continue;

				let s = xpath_eval_single('div[@selections_frame and @uuid=\'' + cat_uuid + '\']', e);
				let c = xpath_eval_single('div[@clear_selections and @uuid=\'' + cat_uuid + '\']', e);

				if( new_page_state.paging_state_by_category_[cat_uuid].selections_ && cat_uuid === new_page_state.category_ ) {

					s.fade(true);
					c.fade(new_paging_state.selections_checked_);

				}
				else {

					s.fade(false);
					c.fade(false);

				}

			}

			selsb && selsb.blink(new_paging_state.selections_checked_);

		};

		let setup_categories_select_by_car = function () {

			let f = new_page_state.category_ !== null_uuid && new_page_state.product_ === null_uuid;

			selsb && selsb.fade(f);
			carbb && carbb.fade(f);

			let e = xpath_single('html/body/div[@categories]');

			for( let cat_uuid in new_page_state.paging_state_by_category_ ) {

				if( cat_uuid === null_uuid )
					continue;

				let s = xpath_eval_single('div[@select_by_car_frame and @uuid=\'' + cat_uuid + '\']', e);
				let c = xpath_eval_single('div[@clear_select_by_car and @uuid=\'' + cat_uuid + '\']', e);

				let new_paging_state = new_page_state.paging_state_by_category_[cat_uuid];

				if( new_paging_state.select_by_car_ && cat_uuid === new_page_state.category_ ) {

					s.fade(true);

					let select_by_car_state = new_paging_state.select_by_car_state_;

					f = new_paging_state.select_by_car_checked_
						|| select_by_car_state.manufacturer
						|| select_by_car_state.model
						|| select_by_car_state.modification
						|| select_by_car_state.year;

					c.fade(f);

					for( let a of xpath_eval('div[@selector and not(@values)]', s) )
						a.fade(new_paging_state.select_by_car_checked_);
					
				}
				else {

					s.fade(false);
					c.fade(false);

				}

			}

			carbb && carbb.blink(new_paging_state.select_by_car_checked_);

		};

		let to_cart = function () {

			backb && backb.fadein();
			pcart && pcart.fadein();
			plist && plist.fadeout();
			pctrl && pctrl.fadeout();
			pinfo && pinfo.fadeout();
			selsb && selsb.fadeout();
			carbb && carbb.fadeout();

			for( let e of catsb )
				e.fadeout();

			for( let e of xpath_eval('html/body/div[@categories]/div[@selections_frame or @clear_selections or @select_by_car_frame or @clear_select_by_car]') )
				e.fadeout();

		};

		let to_list = function () {

			backb && backb.fadeout();
			pcart && pcart.fadeout();
			plist && plist.fadein();
			pctrl && pctrl.fadein();
			pinfo && pinfo.fadeout();
			selsb && selsb.fadeout();
			carbb && carbb.fadeout();

			for( let e of catsb )
				e.fadein();

			setup_categories_selections();
			setup_categories_select_by_car();

		};

		let to_info = function () {

			backb.fadein();
			pcart.fadeout();
			plist.fadeout();
			pctrl.fadeout();
			pinfo.fadein();
			selsb.fadeout();
			carbb.fadeout();

			for( let e of catsb )
				e.fadeout();

			for( let e of xpath_eval('html/body/div[@categories]/div[@selections_frame or @clear_selections or @select_by_car_frame or @clear_select_by_car]') )
				e.fadeout();

		};

		if( new_page_state.cart_edit_ !== cur_state.cart_edit_ || new_page_state.product_ !== cur_state.product_ ) {

			if( new_page_state.cart_edit_ )
				to_cart();
			else if( new_page_state.product_ === null_uuid )
				to_list();
			else
				to_info();

		}

		if( new_paging_state.pgno_ !== cur_paging_state.pgno_ ) {

			plist.fadein();

		}

		if( new_page_state.category_ !== cur_state.category_ ) {

			plist.fadein();
			setup_categories_selections();
			setup_categories_select_by_car();

		}

		if( new_paging_state.selections_ !== cur_paging_state.selections_
			|| new_paging_state.selections_checked_ !== cur_paging_state.selections_checked_ ) {

			setup_categories_selections();

		}

		let cur_select_by_car_state = cur_paging_state.select_by_car_state_;
		let new_select_by_car_state = new_paging_state.select_by_car_state_;
		
		if( new_paging_state.select_by_car_ !== cur_paging_state.select_by_car_
			|| new_paging_state.select_by_car_checked_ !== cur_paging_state.select_by_car_checked_
			|| new_select_by_car_state.manufacturer !== cur_select_by_car_state.manufacturer
			|| new_select_by_car_state.model != cur_select_by_car_state.model
			|| new_select_by_car_state.modification !== cur_select_by_car_state.modification
			|| new_select_by_car_state.year !== cur_select_by_car_state.year ) {

			setup_categories_select_by_car();

		}

		if( cur_state.vk_ !== new_page_state.vk_ ) {

			let e = xpath_eval_single('html/body/iframe[@vk]');
			e.fade(new_page_state.vk_);

		}

	}

}
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class HtmlPageEvents extends HtmlPageState {

	constructor() {

		super();

		this.render_ = null;
		this.events_ = [
			'click',
			'mousedown',
			'mouseenter',
			'mouseleave',
			'mousemove',
			'mouseout',
			'mouseover',
			'mouseup',
			'touchstart',
			'touchend',
			'touchcancel',
			'touchmove',
			'blur',
			'focus'
		];

	}

	show_alert(msg, state, idle_timeout = 0) {

		let e = xpath_eval_single('html/body/div[@alert]');
		e.innerHTML = msg;
		e.fadein();

		if( idle_timeout > 0 ) {

			new Idle({
				oneshot	: true,
				start	: true,
				timeout	: idle_timeout,
				away	: () => { e.fade(false, 'inline-block'); state.alert_ = false; }
			});

		}

		state.alert_ = true;

	}

	clone_page_state() {

		let new_page_state = extend_object(this.page_state_);

		new_page_state.cart_by_uuid_ = {};

		for( let e of new_page_state.cart_ )
			new_page_state.cart_by_uuid_[e.uuid] = e;

		new_page_state.modified_ = false;

		let new_paging_state = new_page_state.paging_state_by_category_[new_page_state.category_];

		return [ new_page_state, new_paging_state ];

	}

	btn_prev_page_handler(cur_paging_state) {

		if( cur_paging_state.pgno_ > 0 ) {

			let [ new_page_state, new_paging_state ] = this.clone_page_state();

			new_paging_state.pgno_--;
			new_page_state.modified_ = true;

			this.render_.rewrite_page(new_page_state);

			return new_page_state;

		}

		// return undefined;

	}

	btn_next_page_handler(cur_paging_state) {

		if( cur_paging_state.pgno_ + 1 < cur_paging_state.pages_ ) {

			let [ new_page_state, new_paging_state ] = this.clone_page_state();

			new_paging_state.pgno_++;
			new_page_state.modified_ = true;

			this.render_.rewrite_page(new_page_state);

			return new_page_state;

		}

	}

	btn_first_page_handler(cur_paging_state) {

		if( cur_paging_state.pgno_ != 0 ) {

			let [ new_page_state, new_paging_state ] = this.clone_page_state();

			new_paging_state.pgno_ = 0;
			new_page_state.modified_ = true;

			this.render_.rewrite_page(new_page_state);

			return new_page_state;

		}

	}

	btn_last_page_handler(cur_paging_state) {

		let newpgno = cur_paging_state.pages_ > 0 ? cur_paging_state.pages_ - 1 : 0;

		if( newpgno != cur_paging_state.pgno_ ) {

			let [ new_page_state, new_paging_state ] = this.clone_page_state();

			new_paging_state.pgno_ = newpgno;
			new_page_state.modified_ = true;

			this.render_.rewrite_page(new_page_state);

			return new_page_state;

		}

	}

	btc_handler(cur_page_state, element, attrs) {

		// categories buttons
		let cur_category = cur_page_state.category_;
		let new_category = cur_page_state.category_ !== attrs.uuid.value ? attrs.uuid.value : null_uuid;

		let [ new_page_state ] = this.clone_page_state();

		new_page_state.category_ = new_category;
		new_page_state.product_ = null_uuid;
		new_page_state.modified_ = true;

		this.render_.rewrite_page(new_page_state);

		// switch on blinking new category
		if( cur_category !== new_category )
			element.blink(true);

		// switch off blinking current category
		if( cur_category !== null_uuid )
			xpath_eval_single('html/body/div[@categories]/div[@btc and @uuid=\'' + cur_category + '\']').blink(false);

		return new_page_state;

	}

	btn_list_sort_order_handler() {

		let [ new_page_state, new_paging_state ] = this.clone_page_state();

		if( ++new_paging_state.order_ >= this.orders_.length )
			new_paging_state.order_ = 0;

		new_page_state.product_ = null_uuid;
		new_page_state.modified_ = true;

		this.render_.rewrite_page(new_page_state);

		return new_page_state;

	}

	btn_list_sort_direction_handler() {

		let [ new_page_state, new_paging_state ] = this.clone_page_state();

		if( ++new_paging_state.direction_ >= this.directions_.length )
			new_paging_state.direction_ = 0;

		new_page_state.product_ = null_uuid;
		new_page_state.modified_ = true;

		this.render_.rewrite_page(new_page_state);

		return new_page_state;

	}

	btn_back_handler() {

		let [ new_page_state ] = this.clone_page_state();

		if( new_page_state.cart_edit_ ) {
			// switch back from cart
			new_page_state.cart_edit_ = false;
		}
		else {
			// switch back from product info
			new_page_state.product_ = null_uuid;
		}

		new_page_state.modified_ = true;

		this.render_.rewrite_page(new_page_state);

		return new_page_state;

	}

	pimg_pitem_ptable_plist_handler(element) {

		let [ new_page_state ] = this.clone_page_state();

		// switch view to product info
		new_page_state.product_ = element.parentNode.attributes.uuid.value;
		new_page_state.modified_ = true;

		this.render_.rewrite_info(new_page_state);

		return new_page_state;

	}

	pimg_pinfo_handler(cur_page_state, element) {

		// switch on product image large view
		let largeimg = xpath_eval_single('html/body/div[@plargeimg]');

		largeimg.style.backgroundImage = element.attributes.img_url ? 'url(' + element.attributes.img_url.value + ')' : element.style.backgroundImage;
		//largeimg.style.display = 'inline-block';
		largeimg.fadein();

		cur_page_state.large_img_view_ = true;

	}

	btn_prev_page_pcontrols_pcart_handler(cur_page_state) {

		if( cur_page_state.cart_pgno_ > 0 ) {

			let [ new_page_state ] = this.clone_page_state();

			new_page_state.cart_pgno_--;
			new_page_state.modified_ = true;

			return new_page_state;

		}

		// return undefined;

	}

	btn_next_page_pcontrols_pcart_handler(cur_page_state) {

		if( cur_page_state.cart_pgno_ + 1 < cur_page_state.cart_pages_ ) {

			let [ new_page_state ] = this.clone_page_state();

			new_page_state.cart_pgno_++;
			new_page_state.modified_ = true;

			return new_page_state;

		}

		// return undefined;

	}

	btn_plus_one_pitem_ptable_pcart_handler(cur_page_state, product = null) {

		let cart_entity = cur_page_state.cart_by_uuid_[product];

		if( cart_entity.buy_quantity < cart_entity.remainder ) {

			let [ new_page_state ] = this.clone_page_state();

			cart_entity = new_page_state.cart_by_uuid_[product];

			cart_entity.buy_quantity++;
			cart_entity.modified = true;
			new_page_state.modified_ = true;

			this.render_.rewrite_cart(new_page_state);

			return new_page_state;

		}

	}

	btn_minus_one_pitem_ptable_pcart_handler(cur_page_state, product = null) {

		let cart_entity = cur_page_state.cart_by_uuid_[product];

		if( cart_entity.buy_quantity > 0 ) {

			let [ new_page_state ] = this.clone_page_state();

			cart_entity = new_page_state.cart_by_uuid_[product];

			cart_entity.buy_quantity--;
			cart_entity.modified = true;
			new_page_state.modified_ = true;

			this.render_.rewrite_cart(new_page_state);

			return new_page_state;

		}

	}

	btn_buy_pright_pinfo_handler(product, buy_quantity, buy_price) {

		let [ new_page_state ] = this.clone_page_state();

		new_page_state.modified_ = true;

		this.render_.rewrite_cart(new_page_state, product, buy_quantity, buy_price);

		return new_page_state;

	}

	pright_pinfo_handler(element, cur_page_state) {

		let new_page_state;

		let product = element.parentNode.parentNode.attributes.uuid.value;
		let remainder = parseInt(element.parentNode.parentNode.attributes.remainder.value, 10);

		let pbuy_quantity_element = xpath_eval_single('p[@pbuy_quantity]', element.parentNode);
		let buy_quantity = parseInt(pbuy_quantity_element.innerText, 10);

		if( Number.isNaN(buy_quantity) )
			buy_quantity = 0;

		if( element.attributes.buy ) {

			new_page_state = this.btn_buy_pright_pinfo_handler(product, buy_quantity, element.parentNode.parentNode.attributes.price.value);

		}
		else if( element.attributes.plus_one ) {

			if( buy_quantity < remainder )
				pbuy_quantity_element.innerText = buy_quantity + 1;

		}
		else if( element.attributes.minus_one ) {

			pbuy_quantity_element.innerText = buy_quantity > 1 ? buy_quantity - 1 : '-';

		}

		return new_page_state;

	}

	btn_drop_cart_informer_handler() {

		let [ new_page_state ] = this.clone_page_state();

		for( let e of new_page_state.cart_ ) {

			e.buy_quantity = 0;
			e.modified = true;

		}

		new_page_state.modified_ = true;

		this.render_.rewrite_cart(new_page_state);

		return new_page_state;

	}

	btn_cart_cart_informer_handler() {

		let [ new_page_state ] = this.clone_page_state();

		new_page_state.cart_edit_ = true;
		new_page_state.modified_ = true;

		this.render_.rewrite_cart(new_page_state);

		return new_page_state;

	}

	btn_cheque_cart_informer_handler(cur_page_state) {

		let [ new_page_state ] = this.clone_page_state();

		try {
			let request = {
				'module'	: 'carter',
				'handler'	: 'carter',
				'order'		: []
			};

			for( let e of new_page_state.cart_ )
				request.order.push({
					'uuid'		: e.uuid,
					'price'		: e.price,
					'quantity'	: e.buy_quantity
				});

			if( this.dct_ ) {
				request.paper = true;

				if( cur_page_state.authorized_ && cur_page_state.auth_ ) {
					request.user = cur_page_state.auth_.user_uuid;
					request.pass = cur_page_state.auth_.pass;
				}
			}

			let data = this.post_json('proxy.php', request);

			if( data.errno !== 0 )
				throw new Error(data.error + "\n" + data.stacktrace);

			let clear_cart = () => {
				// successfully, clear cart now
				for( let e of new_page_state.cart_ ) {
					e.buy_quantity = 0;
					e.modified = true;
				}

				this.render_.rewrite_cart(new_page_state);
			};

			if( data.order && data.order.availability ) {
				// fail, modify buy quantities and show cart alert

				for( let p of data.order.availability ) {

					let e = new_page_state.cart_by_uuid_[p.product];

					if( e.buy_quantity > p.remainder - p.reserve ) {

						e.buy_quantity = p.remainder - p.reserve;
						e.modified = true;

					}

				}

				this.render_.rewrite_cart(new_page_state);

				if( this.dct_ )
					this.barcode_scanner_rewrite(new_page_state, cur_page_state);

				let msg = 'Недостаточное количество товара на складе для заказа, Ваш заказ изменён, проверьте пожалуйста и попробуйте ещё раз';
				this.show_alert(msg, new_page_state, 15000);

				new_page_state.cart_edit_ = new_page_state.cart_.length > 0;
			}
			else if( this.cst_ ) {
				// success, print cheque

				for( let ncopy = 1; !this.cheque_printed_ && ncopy <= 2; ncopy++ ) {

					let iframe_content = xpath_eval_single('html/body/iframe[@cheque_print and @copy=\'' + ncopy + '\']').contentWindow;
					let iframe	= iframe_content.document;

					let head	= xpath_eval_single('html/body/div[@head]', iframe, iframe);
					xpath_eval_single('p[@node_name]'			, head, iframe).innerHTML = data.order.name;
					xpath_eval_single('p[@uuid]'				, head, iframe).innerHTML = data.order.uuid;
					xpath_eval_single('p[@number]'				, head, iframe).innerHTML = 'Заказ&nbsp;:&nbsp;' + data.order.number;
					xpath_eval_single('p[@date]'				, head, iframe).innerHTML = 'Время&nbsp;:&nbsp;' + this.date_formatter_(data.order.date);//.toLocaleFormat('%d.%m.%Y %H:%M:%S');
					xpath_eval_single('p[@barcode]'				, head, iframe).innerHTML = 'EAN13&nbsp;:&nbsp;' + data.order.barcode;

					let table = xpath_eval_single('html/body/div[@table]', iframe, iframe);
					let html = '';

					for( let i = 0; i < new_page_state.cart_.length; i++ ) {

						let e = new_page_state.cart_[i];

						html = html + `
							<p product>
							${i + 1}. ${e.name + ' [' + e.code + ']'} ${e.price + '<i rouble>&psi;</i>'} ${e.buy_quantity + '&nbsp;шт'}
							<span psum>&nbsp;=${e.price * e.buy_quantity + '<i rouble>&psi;</i>'}</span>
							</p>`
						;

					}

					table.innerHTML = html.replace(/(?:[\r\n\t])/g, '');

					let footer = xpath_eval_single('html/body/div[@footer]', iframe, iframe);
					xpath_eval_single('p[@totals]/span[@txt]'	, footer, iframe).innerHTML = 'Сумма:';
					xpath_eval_single('p[@totals]/span[@sum]'	, footer, iframe).innerHTML = data.order.totals + '<i rouble>&psi;</i>';

					let barcode = data.order.barcode;
					//barcode = data.order.barcode_eangnivc;
					let barcode_render = new barcode_ean13_render({ width: 6.1 });
					let barcode_html = barcode_render.draw_barcode(barcode);
					let tail = xpath_eval_single('html/body/div[@tail]', iframe, iframe);
					xpath_eval_single('div[@barcode]', tail, iframe).innerHTML = barcode_html;

					// http://stackoverflow.com/a/11823629
					// Open about:config then change the pref dom.successive_dialog_time_limit to zero integer
					iframe_content.print();
				}

				this.cheque_printed_ = true;
				clear_cart();
				delete this.cheque_printed_;
				new_page_state.cart_edit_ = false;
			}
			else if( this.dct_ ) {
				clear_cart();

				this.barcode_scanner_rewrite(new_page_state, cur_page_state);

				if( this.pending_orders_ )
					this.setup_pending_orders_refresh();
				else
					this.barcode_scanner_insert_order(data.order);
			}

			new_page_state.product_ = null_uuid;
		}
		catch( ex ) {

			if( ex instanceof XhrDeferredException )
				throw ex;

			delete this.cheque_printed_;
			this.show_alert('<pre error>' + ex.message + "\n" + ex.stack + '</pre>', cur_page_state);
			console.error(ex.message);
			throw ex;

		}

		new_page_state.modified_ = true;

		return new_page_state;

	}

	btn_selections_handler(cur_page_state, cur_paging_state) {

		if( cur_page_state.category_ !== null_uuid ) {

			let [ new_page_state, new_paging_state ] = this.clone_page_state();

			new_paging_state.selections_ = !cur_paging_state.selections_;
			new_page_state.modified_ = true;

			if( new_paging_state.select_by_car_ )
				new_paging_state.select_by_car_ = false;

			if( new_paging_state.selections_ )
				this.render_.rewrite_selections(new_page_state);

			return new_page_state;

		}

	}

	checkbox_values_property_selections_frame_handler(element) {

		let [ new_page_state, new_paging_state ] = this.clone_page_state();
		let new_selections_state = new_paging_state.selections_state_;

		let property_uuid	= element.parentNode.parentNode.attributes.uuid.value;
		let value_uuid		= element.attributes.uuid.value;
		let checked, p, v;

		new_paging_state.selections_checked_ = false;

		for( let pp of new_selections_state )
			for( let vv of pp.values ) {

				if( pp.uuid === property_uuid && vv.uuid === value_uuid ) {

					p = pp;
					v = vv;
					checked = v.checked = !v.checked;

				}

				if( vv.checked )
					new_paging_state.selections_checked_ = true;

			}

		if( checked && !p.multi_select )
			for( let q of p.values )
				if( q.uuid !== v.uuid )
					q.checked = false;

		new_page_state.modified_ = true;

		this.render_.rewrite_page(new_page_state);

		if( checked ) {

			if( !p.multi_select )
				for( let q of xpath_eval('div[@value]', element.parentNode) )
					q.removeAttribute('checked');

			element.setAttribute('checked', '');

		}
		else {

			element.removeAttribute('checked');

		}

		let e = xpath_eval_single('html/body/div[@categories]/div[@clear_selections and @uuid=\'' + new_page_state.category_ + '\']');
		e.fade(new_paging_state.selections_checked_);

		return new_page_state;

	}

	btn_clear_selections_handler(cur_page_state, cur_paging_state, element) {

		let [ new_page_state, new_paging_state ] = this.clone_page_state();
		let new_selections_state = new_paging_state.selections_state_;

		for( let p of new_selections_state )
			for( let v of p.values )
				v.checked = false;

		new_paging_state.selections_checked_ = false;
		new_page_state.modified_ = true;

		this.render_.rewrite_page(new_page_state);

		let path = 'html/body/div[@categories]/div[@selections_frame and @uuid=\'' + new_page_state.category_ + '\']';

		for( let e of xpath_eval(path + '/div[@property]/div[@values]/div[@value and @checked]') )
			e.removeAttribute('checked');

		element.fadeout();

		return new_page_state;

	}

	btn_select_by_car_handler(cur_page_state, cur_paging_state) {

		if( cur_page_state.category_ !== null_uuid ) {

			let [ new_page_state, new_paging_state ] = this.clone_page_state();

			new_paging_state.select_by_car_ = !cur_paging_state.select_by_car_;
			new_page_state.modified_ = true;

			if( new_paging_state.selections_ )
				new_paging_state.selections_ = false;

			if( new_paging_state.select_by_car_ ) {

				this.render_.rewrite_select_by_car(new_page_state);
				this.render_.assemble_select_by_car(new_page_state);

			}

			return new_page_state;

		}

	}

	values_select_by_car_frame_handler(cur_page_state, cur_paging_state, element) {

		let [ new_page_state, new_paging_state ] = this.clone_page_state();
		let select_by_car_state = new_paging_state.select_by_car_state_;

		if( select_by_car_state.manufacturer ) {

			if( select_by_car_state.model ) {
			
				if( select_by_car_state.modification ) {

					let uuid = element.attributes.uuid.value;

					select_by_car_state.year = select_by_car_state.values.find(e => e.uuid === uuid);
					new_paging_state.select_by_car_checked_ = true;

				}
				else {

					let uuid = element.attributes.uuid.value;

					select_by_car_state.modification = select_by_car_state.values.find(e => e.uuid === uuid);

				}

			}
			else {

				let uuid = element.attributes.uuid.value;

				select_by_car_state.model = select_by_car_state.values.find(e => e.uuid === uuid);

			}

		}
		else {

			let uuid = element.attributes.uuid.value;

			select_by_car_state.manufacturer = select_by_car_state.values.find(e => e.uuid === uuid);

		}

		if( new_paging_state.select_by_car_checked_ )
			new_paging_state.select_by_car_ = false;

		new_page_state.modified_ = true;

		this.render_.rewrite_select_by_car(new_page_state);

		if( !cur_paging_state.select_by_car_checked_ && new_paging_state.select_by_car_checked_ )
			this.render_.rewrite_page(new_page_state);

		this.render_.assemble_select_by_car(new_page_state);

		let e = xpath_eval_single('html/body/div[@categories]/div[@clear_select_by_car and @uuid=\'' + new_page_state.category_ + '\']');
		e.fade(new_paging_state.select_by_car_checked_);

		return new_page_state;

	}

	btn_clear_select_by_car_handler(cur_page_state, cur_paging_state, element) {

		let [ new_page_state, new_paging_state ] = this.clone_page_state();
		let new_selections_state = new_paging_state.selections_state_;
		let select_by_car_state = new_paging_state.select_by_car_state_;

		select_by_car_state.manufacturer = undefined;
		select_by_car_state.model = undefined;
		select_by_car_state.modification = undefined;
		select_by_car_state.year = undefined;

		if( select_by_car_state.car )
			select_by_car_state.car = undefined;

		new_paging_state.select_by_car_checked_ = false;
		new_page_state.modified_ = true;

		this.render_.rewrite_select_by_car(new_page_state);

		if( cur_paging_state.select_by_car_checked_ )
			this.render_.rewrite_page(new_page_state);

		this.render_.assemble_select_by_car(new_page_state);

		return new_page_state;

	}

	btn_vk_handler(cur_page_state, cur_paging_state, element) {

		let [ new_page_state, new_paging_state ] = this.clone_page_state();

		new_page_state.vk_ = !cur_page_state.vk_;
		new_page_state.modified_ = true;

		return new_page_state;

	}

	btn_vki_type_handler(e, cur_page_state, cur_paging_state, element) {

		let [ new_page_state, new_paging_state ] = this.clone_page_state();

		new_page_state.fts_filter_ = e.detail;
		new_page_state.modified_ = true;

		this.render_.rewrite_page(new_page_state);

		return new_page_state;

	}

	vk_input_callback_handler(e, keyboard, el) {

		let sw = false, change = false;

		switch( e.type ) {

			case 'keyboardChange'   : break;
			case 'change'   		: change = true; break;
			case 'visible'			: break;
			case 'hidden'			: break;
			case 'accepted'			: sw = true; break;
			case 'canceled'			: sw = true; break;
			case 'restricted'		: break;
			case 'beforeClose'		: break;

		}

		if( sw ) {

			let el = xpath_eval_single('html/body/img[@vk]');
			let evt = document.createEvent("MouseEvents");
			evt.initEvent('mouseup', true, true);
			el.dispatchEvent(evt);

		}

		if( change ) {

			if( this.vk_input_timer_ )
				clearTimeout(this.vk_input_timer_);

			this.vk_input_timer_ = setTimeout( () => {

				let m = new CustomEvent('vki_type', { detail : keyboard.preview.value });
				window.dispatchEvent(m);

			}, 1000);

		}

	}

	startup_handler(cur_page_state, cur_paging_state, element) {

		if( this.cst_ ) {

			if( !this.startup_stage_ )
				this.startup_stage_ = 1;

			if( this.startup_stage_ === 1 ) {
				this.render_.rewrite_category();
				this.startup_stage_ = 2;
			}

			if( this.startup_stage_ === 2 ) {
				this.render_.rewrite_page();
				this.startup_stage_ = 3;
			}

			if( this.startup_stage_ === 3 ) {
				this.render_.rewrite_cart();
				this.startup_stage_ = 4;
			}

			if( this.startup_stage_ === 4 ) {
				this.render_.show_new_page_state();
				delete this.startup_stage_;

				// switch to tyres category by default
				let e = xpath_eval_single('html/body/div[@categories]/div[@btc and @uuid=\'83f528bc-481a-11e2-9a03-ace5647d95bd\']');
				let evt = document.createEvent("MouseEvents");
				evt.initEvent('mouseup', true, true);
				setTimeout(() => e.dispatchEvent(evt));
			}
		}

		if( this.dct_ ) {
			if( this.debug_ && this.dct_ /*&& !SmartPhone.isAny()*/ )
				this.debug_barcodes_ = [
					'2000556067968',
					'5904608006653',
					'0009603055103',
					'4606746008919',
					'4606746008933',
					'4606746008926',
					'4606746008810',
					'2000556207968',
					'4260041010796',
					'4100420037061',
					'4100420037078'
				];

			// fetch delayed cart
			setTimeout(() => window.dispatchEvent(new CustomEvent('barcode')));
		}
	}

	startup_auth_handler(cur_page_state, cur_paging_state) {

		let [ new_page_state ] = this.clone_page_state();

		let request = {
			'module'	: 'authorizer',
			'handler'	: 'authorizer'
		};

		let data = this.post_json('proxy.php', request);

		if( data.errno === 0 && data.auth && data.auth.authorized ) {
			new_page_state.modified_ = true;
			new_page_state.auth_ = data.auth;
			new_page_state.authorized_ = data.auth.authorized;
		
			xpath_eval_single('html/body/div[@top]/div[@auth]').innerHTML = `Авторизовано: ${data.auth.user}`;
		}

		return new_page_state;
	}

	idle_away_reload_handler(cur_page_state, cur_paging_state, element) {

		let [ new_page_state, new_paging_state ] = this.clone_page_state();

		new_page_state.modified_ = true;

		this.render_.rewrite_page();

		let date = new Date;

		console.log(this.date_formatter_(date) + ': current page reloaded on user idle away');
		//console.log(date.toLocaleFormat('%d.%m.%Y %H:%M:%S') + ': current page reloaded on user idle away');

		return new_page_state;

	}

	sse_reload_handler(cur_page_state, cur_paging_state, element) {

		let [ new_page_state, new_paging_state ] = this.clone_page_state();

		new_page_state.modified_ = true;

		this.render_.rewrite_page();

		let date = new Date;
		console.log(this.date_formatter_(date) + ': products on current page changed, reloaded');

		return new_page_state;

	}

	/*events_handler(e) {

		setTimeout((e) => this.dispatch_handler(e), 0);

	}*/

	window_resize_handler() {
		/*let [ w, h ] = window_size();
		let b = xpath_eval_single('html/body');
		let sp = SmartPhone.isAny();

		if( this.debug_ && this.dct_ && !SmartPhone.isAny() ) {
			let m = xpath_eval_single('html/body/div[@debug]');
			m.style.left = '5%';
			m.style.width = '35%';

			b.style.left = 'calc(50% - 35mm)';
			b.style.top = '20px';
			b.style.width = '70mm';
			b.style.height = '140mm';
			b.style.border = 'solid 1px black';

			for( let btn of xpath_eval('html/body/i[@btn]') )
				btn.style.top = '4%';
		}
		else if( sp ) { // prevent virtual keyboard appear resize body
			if( this.debug_ && this.dct_ ) {
				let m = xpath_eval_single('html/body/div[@debug]');
				m.style.left = '0';
				m.style.width = '55%';
			}

			let ww = this.deviceWidth_  !== undefined ? this.deviceWidth_  : 0;
			let hh = this.deviceHeight_ !== undefined ? this.deviceHeight_ : 0;

			if( w > ww || h > hh ) {
				b.style.width  = w + 'px';
				b.style.height = h + 'px';
				this.deviceWidth_  = w;
				this.deviceHeight_ = h;
			}

			//if( this.dct_ ) {
			//	let icon_scan = xpath_eval_single('html/body/i[@btn and @scan]');
			//	icon_scan.style.top = 'calc(100% - 9.999%)';
			//	icon_scan.style.left = 'calc(100% - 10.5mm)';
			//	icon_scan.style.width = '10mm';
			//	icon_scan.style.height = '10mm';
			//}
		}
		else {
			b.style.width  = w + 'px';
			b.style.height = h + 'px';
		}

		let p = xpath_single('html/body/div[@search_panel]');

		if( p ) {
			let r = p.getCoords();

			if( h < screen.height ) {
				let viewport_h = Math.min(b.getCoords().bottom, h);
				let nh = Math.trunc(viewport_h - r.top * 1.4);
				p.style.height = nh.toString() + 'px';
			}
			else
				p.removeAttribute('style');
		}*/
	}

	get_quagga_params() {
		return {
			inputStream : {
				name		: 'Live',
				type		: 'LiveStream',
				target		: xpath_eval_single('html/body/div[@middle]/div[@scanner]/div[@viewport]'),//document.querySelector('#yourElement'),    // Or '#yourElement' (optional)
				constraints	: {
					width		: { min: 320 },
					height		: { min: 240 },
					facingMode	: 'environment',
					aspectRatio	: { min: 1, max: 2 }
				}
			},
			decoder			: {
				readers : [
					{ format : 'code_128_reader', config : {} },
					{ format : 'ean_reader'		, config : {} },
					{ format : 'upc_reader'		, config : {} },
					{ format : 'upc_e_reader'	, config : {} },
					{ format : 'codabar_reader'	, config : {} }
				]
			},
			locator		: {
				patchSize	: 'medium',
				halfSample	: true
			},
			numOfWorkers	: navigator.hardwareConcurrency,
			frequency		: 10,
			locate			: false
		};
	};

	switch_dst_middle_pitem(cur_page_state, cur_paging_state, element) {

		let [ new_page_state, new_paging_state ] = this.clone_page_state();

		if( element.attributes.expanded ) {
			for( let e of xpath_eval('div[@btn]', element) )
				e.display(false);

			let e = xpath_eval_single('div[@btn and @discount]', element);
			for( let q of xpath_eval('div[@discount_value or (@btn and (@discount_price or @discount_percent or @discount_accept))]', element) )
				q.display(false);

			xpath_eval_single('div[@pbuy_quantity]', element).display(false);
			//xpath_eval_single('div[@txt]/font[@pprice]', element).display(true);
			xpath_eval_single('div[@txt]/font[@pcomma]', element).display(true);
			xpath_eval_single('div[@txt]/font[@pbuy_quantity]', element).display(true);
			element.removeAttribute('expanded');
		}
		else {
			for( let e of xpath_eval('div[@btn]', element) )
				e.display(e.attributes.discount ? new_page_state.authorized_ : true);

			let e = xpath_eval_single('div[@btn and @discount]', element);
			for( let q of xpath_eval('div[@discount_value or (@btn and (@discount_price or @discount_percent or @discount_accept))]', element) )
				q.display(e.attributes.expanded
					&& (
						!q.attributes.btn
						|| (q.attributes.discount_price && e.attributes.mode.value === 'price')
						|| (q.attributes.discount_percent && e.attributes.mode.value === 'percent')
						|| q.attributes.discount_accept
					)
				);

			xpath_eval_single('div[@pbuy_quantity]', element).display(true);
			//xpath_eval_single('div[@txt]/font[@pprice]', element).display(false);
			xpath_eval_single('div[@txt]/font[@pcomma]', element).display(false);
			xpath_eval_single('div[@txt]/font[@pbuy_quantity]', element).display(false);
			element.setAttribute('expanded', '');
		}

		new_page_state.modified_ = true;

		return new_page_state;
	}

	btn_dst_plus_one_pitem_handler(cur_page_state, product = null) {

		let cart_entity = cur_page_state.cart_by_uuid_[product];

		if( cart_entity.buy_quantity < cart_entity.remainder ) {

			let [ new_page_state ] = this.clone_page_state();

			cart_entity = new_page_state.cart_by_uuid_[product];

			cart_entity.buy_quantity++;
			cart_entity.modified = true;

			this.render_.rewrite_cart(new_page_state);
			this.barcode_scanner_rewrite(new_page_state, cur_page_state);

			new_page_state.modified_ = true;

			return new_page_state;

		}

	}

	btn_dst_minus_one_pitem_handler(cur_page_state, product = null) {

		let cart_entity = cur_page_state.cart_by_uuid_[product];

		if( cart_entity.buy_quantity > 0 ) {

			let [ new_page_state ] = this.clone_page_state();

			cart_entity = new_page_state.cart_by_uuid_[product];

			cart_entity.buy_quantity--;
			cart_entity.modified = true;

			this.render_.rewrite_cart(new_page_state);
			this.barcode_scanner_rewrite(new_page_state, cur_page_state);

			new_page_state.modified_ = true;

			return new_page_state;

		}

	}

	btn_dst_discount_accept_handler(cur_page_state, product, value) {

		let cart_entity = cur_page_state.cart_by_uuid_[product];

		if( cart_entity ) {

			let [ new_page_state ] = this.clone_page_state();

			cart_entity = new_page_state.cart_by_uuid_[product];
			cart_entity.price = Number.parseFloat(value);
			cart_entity.modified = true;

			this.render_.rewrite_cart(new_page_state);
			this.barcode_scanner_rewrite(new_page_state, cur_page_state);

			new_page_state.modified_ = true;

			return new_page_state;
		}
	}

	discount_value_text_type_handler(element, cur_page_state, text) {

		if( element.value !== text )
			return;

		let product = element.parentNode.parentNode.attributes.uuid.value;
		let cart_entity = cur_page_state.cart_by_uuid_[product];

		if( cart_entity ) {
			let n = Number.parseFloat(text);

			if( !Number.isNaN(n) ) {
				let holder = xpath_eval_single('div[@btn and @discount]', element.parentNode.parentNode);
				let mode = holder.attributes.mode.value;

				if( mode === 'price' )
					n = n;
				else if( mode === 'percent' ) 
					n = Math.max(0, round(cart_entity.price - cart_entity.price * n / 100, 2));

				holder.setAttribute('value', n);

				let e = xpath_eval_single('div[@discount_value]', element.parentNode.parentNode);
				xpath_eval_single('font[@price]', e).innerHTML = n;
				xpath_eval_single('font[@summ]', e).innerHTML = n * cart_entity.buy_quantity;
			}
		}
	}

	switch_dst_discount_middle_pitem(element) {

		let a = element.attributes;

		if( a.expanded )
			element.removeAttribute('expanded');
		else
			element.setAttribute('expanded', '');

		for( let q of xpath_eval('div[@discount_value or (@btn and (@discount_price or @discount_percent or @discount_accept))]', element.parentNode) )
			q.display(a.expanded
				&& (
					!q.attributes.btn
					|| (q.attributes.discount_price && a.mode.value === 'price')
					|| (q.attributes.discount_percent && a.mode.value === 'percent')
					|| q.attributes.discount_accept
				)
			);

		let p = xpath_eval_single('div[@discount_value]/input[@discount_value]', element.parentNode);

		if( a.expanded ) {
			p.focus();
			p.click();
		}
		else {
			if( document.activeElement === p )
				document.activeElement.blur();
		}
	}

	barcode_scanner_rewrite(new_page_state, cur_page_state) {

		let m = xpath_eval_single('html/body/div[@middle]/div[@scanner]');
		let cart = new_page_state.cart_;
		let n = 1;
		let modified = false;

		for( let e of xpath_eval('div[@uuid]', m.parentNode) ) {
			if( new_page_state.cart_by_uuid_[e.attributes.uuid.value] )
				continue;
			m.parentNode.removeChild(e);
			modified = true;
		}

		for( let p of cart ) {
			let o = cur_page_state.cart_by_uuid_[p.uuid] || {};

			if( o.buy_quantity === p.buy_quantity
				&& o.price === p.price
				&& o.remainder === p.remainder
				&& new_page_state.authorized_ === cur_page_state.authorized_ )
				continue;

			modified = true;

			let g = () => xpath_single('div[@uuid=\'' + p.uuid + '\']', m.parentNode);
			let e = g();

			if( !e ) {
				m.insertAdjacentHTML('afterend', `
					<div pitem="${n}" uuid="${p.uuid}" price="${p.price}" fliphin>
						<div txt${p.img_uuid ? ' have_img' : ''}>
							<font pcode style="color:darkblue" blink2></font>
							<font pname></font>
							<font pprice></font>
							<font pcomma>, </font>
							<font pbuy_quantity></font>
						</div>
						<i pimg></i>
						<div btn plus_one></div>
						<div pbuy_quantity></div>
						<div btn minus_one></div>
						<div btn discount mode="price"></div>
						<div discount_value setup>
							<input discount_value text_type type="number">
							<br>
							<font>Цена&nbsp;: </font><font price></font><i rouble>&psi;</i></font>
							<br>
							<font>Сумма: </font><font summ></font><i rouble>&psi;</i></font>
						</div>
						<div btn discount_price></div>
						<div btn discount_percent></div>
						<div btn discount_accept></div>
					</div>
				`.replace(/(?:[\r\n\t])/g, ''));

				e = g();

				this.setup_events(xpath_eval('div[@discount_value]/input[@discount_value]', e));
				this.setup_events(xpath_eval('i[@pimg]', e));
				this.setup_events(xpath_eval('div[@btn]', e));
				this.setup_events(e);
			}

			let txt = xpath_eval_single('div[@txt]', e);

			xpath_eval_single('font[@pcode]' , txt).innerHTML = `[${p.code}]`;
			xpath_eval_single('font[@pname]' , txt).innerHTML = p.name;
			xpath_eval_single('font[@pprice]', txt).innerHTML = `, ${p.price}<i rouble>&psi;</i>`;//₽`;

			let bq = xpath_eval_single('font[@pbuy_quantity]', txt);
			bq.innerHTML = `${p.buy_quantity}`;
			if( p.buy_quantity <= p.remainder ) {
				bq.style.color = 'darkmagenta';
				if( bq.attributes.blink2 )
					bq.removeAttribute('blink2');
			}
			else {
				bq.style.color = 'red';
				bq.setAttribute('blink2', '');
			}

			let img = xpath_eval_single('i[@pimg]', e);
			img.setAttribute('img_url', p.img_url);
			img.style.backgroundImage = `url(${p.img_ico})`;
			img.display(p.img_uuid);

			// http://en.wikipedia.org/wiki/Arrow_%28symbol%29#Arrows_in_Unicode
			// https://en.wikipedia.org/wiki/Geometric_Shapes
			// BLACK DOWN-POINTING TRIANGLE, HTML HEX: &#x25BC;
			// name += '<font triangle style="color:black;font-size:250%">▼</font>';

			xpath_eval_single('div[@pbuy_quantity]', e).innerHTML = '<span>Кол-во&nbsp;: ' + p.buy_quantity
				+ '<br>Сумма&nbsp;&nbsp;: ' + p.price * p.buy_quantity + '<i rouble>&psi;</i>'
				+ '<br>Остаток: ' + p.remainder
				+ '</span>';

			let dis = xpath_eval_single('div[@btn and @discount]', e);
			dis.display(new_page_state.authorized_ && e.attributes.expanded);

			for( let q of xpath_eval('div[@discount_value or (@btn and (@discount_price or @discount_percent or @discount_accept))]', e) )
				q.display(dis.attributes.expanded
					&& (
						!q.attributes.btn
						|| (q.attributes.discount_price && dis.attributes.mode.value === 'price')
						|| (q.attributes.discount_percent && dis.attributes.mode.value === 'percent')
						|| q.attributes.discount_accept
					)
				);

			let dv = xpath_eval_single('div[@discount_value]', e);

			if( dv.attributes.setup ) {
				xpath_eval_single('input[@discount_value]', dv).value = p.price;
				xpath_eval_single('font[@price]', dv).innerHTML = p.price;
				xpath_eval_single('font[@summ]', dv).innerHTML = p.price * p.buy_quantity;
				dv.removeAttribute('setup');
			}

			if( dis.attributes.value && !dis.attributes.value.value.isEmpty() )
				xpath_eval_single('font[@summ]', dv).innerHTML = Number.parseFloat(dis.attributes.value.value) * p.buy_quantity;

			n++;
		}

		if( modified ) {
			this.render_.assemble_cart_informer(new_page_state);

			if( new_page_state.cart_.length !== 0 && cur_page_state.cart_.length === 0 )
				xpath_eval_single('html/body/i[@btn and @order]').display(true);
			else if( new_page_state.cart_.length === 0 && cur_page_state.cart_.length !== 0 )
				xpath_eval_single('html/body/i[@btn and @order]').display(false);
		}

		if( new_page_state.constants_ ) {
			xpath_eval_single('html/body/div[@mount]/p[@mag]').innerHTML =
				'Магазин: ' + new_page_state.constants_['ТекущийМагазинПредставление'];
			xpath_eval_single('html/body/div[@mount]/p[@address]').innerHTML =
				'Адрес: ' + new_page_state.constants_['ТекущийМагазинАдрес'];

			this.pending_orders_ = new_page_state.constants_.pending_orders;
			delete new_page_state.constants_;
		}

		let panel = xpath_eval_single('html/body/div[@middle]/div[@orders_panel]');

		if( new_page_state.cart_.length === 0 ) {
			panel.style.left = 0;
			panel.style.width = '98%';
		}
		else {
			panel.removeAttribute('style');
		}

		if( new_page_state.orders_ ) {
			let orders = [];

			for( let n in new_page_state.orders_ )
				if( new_page_state.orders_.hasOwnProperty(n) )
					orders.push(new_page_state.orders_[n]);

			orders.sort((a, b) => a.date - b.date);

			let panel = xpath_eval_single('html/body/div[@middle]/div[@orders_panel]');

			for( let order of orders ) {
				let p = xpath_single('div[@uuid=\'' + order.uuid + '\']', panel);

				if( !p || p.attributes.customer_uuid.value !== order.customer_uuid )
					modified = true;

				this.barcode_scanner_insert_order(order);
			}

			for( let p of xpath_eval('div[@uuid]', panel) ) {
				let i = orders.findIndex(order => order.uuid === p.attributes.uuid.value);
				if( i < 0 ) {
					panel.removeChild(p);
					modified = true;
				}
			}

			delete new_page_state.orders_;
		}

		if( !modified && this.pending_orders_refresh_timeout_id_ ) {
			this.setup_pending_orders_refresh();
		}
		else if( modified && this.pending_orders_refresh_timeout_id_ ) {
			delete this.pending_orders_refresh_timeout_id_;
		}

		return modified;
	}

	barcode_scanner_insert_order(order, panel) {

		panel = panel || xpath_eval_single('html/body/div[@middle]/div[@orders_panel]');

		let e = xpath_single('div[@uuid=\'' + order.uuid + '\']', panel);

		if( e ) {
			e.setAttribute('customer_uuid', order.customer_uuid);
			xpath_eval_single('div[@txt]/font[@customer_name]', e).innerHTML = order.customer;
		}
		else {
			panel.insertAdjacentHTML('afterbegin', `
				<div order uuid="${order.uuid}" customer_uuid="${order.customer_uuid}">
					<div txt>
						<font>Заказ&nbsp;</font><font style="color:darkblue" blink2>№&nbsp;${order.number}</font>
						<font> от ${this.date_formatter_(order.date).trim()}</font>
						<font>, </font><font customer_name>${order.customer}</font>
						<font>, Сумма:&nbsp;${order.totals}<i rouble>&psi;</i></font>
						<font>, EAN13:&nbsp;${order.barcode}</font>
					</div>
					<div btn customer></div>
					<div btn remove></div>
				</div>
			`.replace(/(?:[\r\n\t])/g, ''));

			this.setup_events(xpath_eval('div[@order and @uuid=\'' + order.uuid + '\']', panel));
			this.setup_events(xpath_eval('div[@order and @uuid=\'' + order.uuid + '\']/div[@btn]', panel));
		}

		/*let iframe = document.createElement('iframe');
		iframe.setAttribute('seamless', '');
		iframe.setAttribute('frameborder', 0);
		iframe.setAttribute('scrolling', 'no');
		iframe.setAttribute('order', '');
		iframe.src = 'data:text/html;base64,' + base64_encode(order.paper);
		iframe.onload = () => {
		//for( let iframe of xpath_eval('div[@order]/iframe[@order]', panel) ) {
			let doc = iframe.contentWindow.document;
			let body = doc.body;
			let html = doc.documentElement;
			
			//for( let e of xpath_eval('html/body/*', doc, doc) )
			//	e.style.width = '10px';
		};*/

		//xpath_eval_single('div[@order]', panel).appendChild(iframe);

		return panel;

	}

	setup_pending_orders_refresh() {

		this.pending_orders_refresh_timeout_id_ = setTimeout(() => {
			window.dispatchEvent(new CustomEvent('barcode'));
		}, 5000);

	}

	barcode_scan_handler(cur_page_state, code) {

		if( this.barcode_event_ && this.barcode_event_ !== this.current_event_ )
			return;

		this.barcode_event_ = this.current_event_;

		let ex;
		let cleanup = true;
		let [ new_page_state, new_paging_state ] = this.clone_page_state();

		try {

			//Render.debug(3, 'B:&nbsp;' + code);
			//let m = xpath_eval_single('html/body/div[@middle]/div[@scanner]/div[@viewport]');
			//m.insertAdjacentHTML('afterend', `<div barcode="${code}">${code}</div>`);

			let request = {
				'module'		: 'carter',
				'handler'		: 'carter'
			};

			if( code )
				request.products = [{ 'barcode' : code }];
			else
				request.orders = true;

			let data = this.post_json('proxy.php', request);

			if( !code && data.cart.length !== 0 )
				delete this.debug_barcodes_;

			new_page_state.constants_ = data.constants;
			new_page_state.orders_ = data.orders;
			new_page_state.cart_ = data.cart;
			new_page_state.cart_by_uuid_ = {};

			for( let e of data.cart )
				new_page_state.cart_by_uuid_[e.uuid] = e;

			let modified = this.barcode_scanner_rewrite(new_page_state, cur_page_state);

			if( modified && code )
				this.scanner_beep();

			new_page_state.modified_ = true;

		}
		catch( e ) {
			ex = e;
			if( e instanceof XhrDeferredException )
				cleanup = false;
			throw e;
		}
		finally {
			if( cleanup ) {
				if( this.debug_barcodes_ && this.debug_barcodes_.length !== 0 ) {
					delete this.barcode_event_;

					let code = this.debug_barcodes_.pop();

					if( this.debug_barcodes_.length === 0 )
						delete this.debug_barcodes_;

					setTimeout(() => window.dispatchEvent(new CustomEvent('barcode', { detail : code })));
				}
				else {
					// allow scan barcode only once per second
					setTimeout(() => delete this.barcode_event_, 1000);
				}
			}
		}

		return new_page_state;
	}

	switch_scanner() {

		if( this.quagga_initialized_ ) {
			let btn_scan = xpath_eval_single('html/body/i[@btn and @scan]');
			let scanner = xpath_eval_single('html/body/div[@middle]/div[@scanner]');

			if( this.quagga_started_ ) {
				Quagga.stop();
				this.quagga_started_ = false;
				btn_scan.blink(false);
				scanner.fade(false);
				console.log("Quagga stopped");
				this.quagga_initialized_ = false;
			}
			else {
    			/*Quagga.onProcessed(result => {
					let drawingCtx = Quagga.canvas.ctx.overlay;
					let drawingCanvas = Quagga.canvas.dom.overlay;

					if( result ) {
						if( result.boxes ) {
							drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute('width')), parseInt(drawingCanvas.getAttribute('height')));
							result.boxes.filter(box => box !== result.box).forEach((box) => {
                    			Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: 'green', lineWidth: 2 });
							});
						}

						if( result.box )
							Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: '#00F', lineWidth: 2 });

						if( result.codeResult && result.codeResult.code )
							Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: 'red', lineWidth: 3 });
					}
				});*/

				Quagga.onDetected(result => {
					window.dispatchEvent(new CustomEvent('barcode', { detail : result.codeResult.code }));
					//let code = result.codeResult.code;

					//if( App.lastResult !== code ) {
    	        	//	App.lastResult = code;
					//	let $node = null, canvas = Quagga.canvas.dom.image;
					//	$node = $('<li><div class="thumbnail"><div class="imgWrapper"><img /></div><div class="caption"><h4 class="code"></h4></div></div></li>');
					//	$node.find("img").attr("src", canvas.toDataURL());
					//	$node.find("h4.code").html(code);
					//	$("#result_strip ul.thumbnails").prepend($node);
					//}
				});

				Quagga.start();
				this.quagga_started_ = true;
				btn_scan.blink(true);
				scanner.fade(true);
				console.log("Quagga started");
			}
		}
		else {
			this.quagga_scripts_loaded_ = true;
			
			Quagga.init(this.get_quagga_params(), err => {
				if( err ) {
					console.log(err);
					return;
				}

				this.quagga_initialized_ = true;
				console.log("Quagga initialization finished. Ready to start");

            	let track = Quagga.CameraAccess.getActiveTrack();

            	if( track && typeof track.getCapabilities === 'function' ) {
                    track.applyConstraints({advanced: [{zoom: parseFloat(2.0)}]});
					track.applyConstraints({advanced: [{torch: true}]});
                }

				this.switch_scanner();
			});
		}
	}

	amplifyMedia(mediaElem, multiplier) {
		let context = new (window.AudioContext || window.webkitAudioContext),
			result = {
				context: context,
				source: context.createMediaElementSource(mediaElem),
				gain: context.createGain(),
				media: mediaElem,
				amplify: function(multiplier) { result.gain.gain.value = multiplier; },
				getAmpLevel: function() { return result.gain.gain.value; }
		};
		result.source.connect(result.gain);
		result.gain.connect(context.destination);
		result.amplify(multiplier);
		return result;
	}

	scanner_beep(volume = 1.0) {

		try {
			let beep = document.getElementById('scanner_beep');
			//let amp = this.amplifyMedia(beep, volume);
			beep.volume = volume;
			beep.play();
		}
		catch( e ) {
			console.log(e.message);
			//Render.debug(2, 'PLAY:&nbsp;' + e.message);
		}

	}

	btn_scan_handler() {

		this.scanner_beep(0.0001);

		if( this.quagga_scripts_loaded_ ) {
			this.switch_scanner();
		}
		else {
			load_script('assets/scanner/vendor/jquery-3.2.1.slim.min.js', () =>
			load_script('assets/scanner/adapter_no_edge_no_global-4.2.2.js', () =>
			load_script('assets/scanner/quagga.min.js', () => this.switch_scanner())));
		}

	}

	setup_text_type_event(elements, delay_ms = 300) {

		for( let element of (elements instanceof Array ? elements : [elements]) ) {
			if( !element.attributes || !element.attributes.text_type )
				continue;

			if( element.text_type_timeout_id_ )
				clearTimeout(element.text_type_timeout_id_);

			if( delay_ms === null )
				continue;

			element.text_type_handler_ = () => {
				delete element.text_type_timeout_id_;

				let stms = () => {
					element.text_type_timeout_id_ = setTimeout(element.text_type_handler_, delay_ms);
				};

				if( element.text_typed_ !== element.value ) {
					delete element.text_typed_fired_;
					element.text_typed_ = element.value;
					stms();
				}
				else if( element.text_typed_fired_ ) {
					stms();
				}
				else {
					try {
						element.dispatchEvent(new CustomEvent('text_type', { detail : element.text_typed_ }));
					}
					finally {
						element.text_typed_fired_ = true;
						stms();
					}
				}
			};

			if( !element.text_typed_event_ )
				add_event(element, 'text_type', e => this.events_handler(e), false);

			element.text_typed_ = element.value;
			element.text_typed_fired_ = true;
			element.text_typed_event_ = true;
			element.text_type_handler_();
		}
	}

	search_panel_text_type_handler(text) {

		if( xpath_eval_single('html/body/div[@search_panel]/input[@vks]').value !== text )
			return;

		let panel = xpath_eval_single('html/body/div[@search_panel]');

		let request = {
			'module'			: 'searcher',
			'handler'			: 'searcher',
			'view'				: panel.attributes.view.value,
			'fts_filter'		: text
		};

		let data = this.post_json('proxy.php', request);
		//state.ellapsed_ += data.ellapsed;
		let html = '';

		if( data.products && data.products.length !== 0 ) {
			for( let p of data.products ) {
				let name = p.name.replace(/ ,/, ',').trim();

				/*for( let l = name.length, i = 0, j = 0; i < l; i++, j++ ) {
					if( j >= 35 && name[i] === ' ' ) {
						name = name.substr(0, i) + '<br>' + name.substr(i).trim();
						l = name.length;
						j = -1;
					}
				}*/

				let pimg = p.img_uuid ? `<i pimg img_url="${p.img_url}" style="background-image:url(${p.img_ico})"></i>` : '';

				html += `
					<div result uuid="${p.uuid}" price="${p.price}" fliphin>
						<div txt${p.img_uuid ? ' have_img' : ''}>
							<font pcode style="color:darkblue" blink2>[${p.code}]</font>
							<font pname> ${name}</font>
							<font pcomma>, </font>
							<font pprice style="color:darkmagenta">${p.price}<i rouble>&psi;</i></font>
							<font pcomma>, </font>
							<font premainder style="color:navy">${p.remainder}</font>
							<font pcomma>, </font>
							<font preserve style="color:gray">${p.reserve}</font>
						</div>
						${pimg}
					</div>
				`;
			}
		}
		else if( data.customers && data.customers.length !== 0 ) {
			for( let p of data.customers ) {
				let inn = p.inn.isEmpty() ? '' : '[' + p.inn + '] ';
				html += `
					<div result uuid="${p.uuid}" fliphin>
						<div txt>
							<font pcode style="color:darkblue" blink2>${inn}</font>
							<font pname>${p.name}</font>
						</div>
					</div>
				`;
			}
		}

		let results = xpath_eval_single('div[@results]', panel);
		results.innerHTML = html.replace(/(?:[\r\n\t])/g, '');
		this.setup_events(xpath_eval('div[@result]', results));

	}

	//dispatch_handler(e) {
	events_handler(e) {

		let prevent_default = true, show_alert = false;

		this.current_event_ = e;

		let state				= this;
		let cur_page_state 		= state.page_state_;
		let cur_paging_state 	= state.page_state_.paging_state_by_category_[state.page_state_.category_];
		let new_page_state;
		let x;

		try {

			if( !this.load_indicator_ )
				this.load_indicator_ = xpath_single('html/body/div[@class=\'cssload-container\']');

			if( this.load_indicator_ && !this.load_indicator_timer_ ) {

				//this.load_indicator_.style.display = 'none';
				this.load_indicator_.fadeout();

				this.load_indicator_timer_ = setTimeout(() => {

					//this.load_indicator_.style.display = 'inline-block';
					this.load_indicator_.fadein();

				},
				125);

			}

			let element		= e.currentTarget ? e.currentTarget : e.deferredTarget;
			let attrs		= element && element.attributes ? element.attributes : {};

			this.start_		= e.start ? e.start : mili_time();
			e.start			= this.start_;
			this.ellapsed_	= 0;

			switch( e.type ) {

				case 'resize'		:
					this.window_resize_handler();
					break;

				case 'mouseup'		:

					if( e.button !== 0 )
						break;

				case 'touchend'		:

					// check for modal elements

					if( attrs.alert ) {

						// switch off product image large view
						//xpath_eval_single('html/body/div[@alert]').fadeout('inline-block');
						element.fadeout('inline-block');
						state.page_state_.alert_ = false;
						break;

					}
				
					if( attrs.plargeimg ) {

						// switch off product image large view
						//let largeimg = xpath_eval_single('html/body/div[@plargeimg]');
						//largeimg.style.display = 'none';
						element.fadeout('inline-block');
						state.page_state_.large_img_view_ = false;
						break;

					}

					// block input while modal element showing
					if( state.page_state_.alert_ || state.page_state_.large_img_view_ )
						break;

						if( attrs.btn && element.ascend('plist_controls/pcontrols') ) {

						if( attrs.prev_page ) {

							new_page_state = this.btn_prev_page_handler(cur_paging_state);

						}
						else if( attrs.next_page ) {

							new_page_state = this.btn_next_page_handler(cur_paging_state);

						}
						else if( attrs.first_page ) {

							new_page_state = this.btn_first_page_handler(cur_paging_state);

						}
						else if( attrs.last_page ) {

							new_page_state = this.btn_last_page_handler(cur_paging_state);

						}

					}
					else if( attrs.btc ) {

						new_page_state = this.btc_handler(cur_page_state, element, attrs);

					}
					else if( attrs.btn && element.ascend('psort_controls/pcontrols') ) {

						if( attrs.list_sort_order ) {

							new_page_state = this.btn_list_sort_order_handler();

						}
						else if( attrs.list_sort_direction ) {

							new_page_state = this.btn_list_sort_direction_handler();

						}

					}
					else if( attrs.btn && attrs.back ) {

						new_page_state = this.btn_back_handler();

					}
					else if( attrs.pimg && element.ascend('pitem/ptable/plist') ) {

						new_page_state = this.pimg_pitem_ptable_plist_handler(element);

					}
					else if( attrs.pimg && (element.ascend('pinfo') || element.ascend('pitem/middle')) && !attrs.touchmove ) {

						this.pimg_pinfo_handler(cur_page_state, element);

					}
					else if( attrs.btn && element.ascend('pcontrols/pcart') ) {

						if( attrs.prev_page ) {

							new_page_state = this.btn_prev_page_pcontrols_pcart_handler(cur_page_state);

						}
						else if( attrs.next_page ) {

							new_page_state = this.btn_next_page_pcontrols_pcart_handler(cur_page_state);

						}

					}
					else if( attrs.btn && element.ascend('pitem/ptable/pcart') ) {

						// change cart
						let product = element.parentNode.attributes.uuid.value;

						if( attrs.plus_one ) {

							new_page_state = this.btn_plus_one_pitem_ptable_pcart_handler(cur_page_state, product);

						}
						else if( attrs.minus_one ) {

							new_page_state = this.btn_minus_one_pitem_ptable_pcart_handler(cur_page_state, product);

						}

					}
					else if( attrs.btn && element.ascend('pright/pinfo') ) {

						new_page_state = this.pright_pinfo_handler(element, cur_page_state);

					}
					else if( attrs.buy && element.ascend('pitem/ptable/plist') ) {

						new_page_state = this.btn_buy_pright_pinfo_handler(element.parentNode.attributes.uuid.value, 1, element.parentNode.attributes.price.value);

					}
					else if( attrs.btn && attrs.drop && element.ascend('cart_informer') ) {

						new_page_state = this.btn_drop_cart_informer_handler();

					}
					else if( attrs.btn && attrs.cart && element.ascend('cart_informer') ) {

						new_page_state = this.btn_cart_cart_informer_handler();

					}
					else if( attrs.btn && attrs.cheque && element.ascend('cart_informer') ) {

						new_page_state = this.btn_cheque_cart_informer_handler(cur_page_state);

					}
					else if( attrs.btn && attrs.selections ) {

						new_page_state = this.btn_selections_handler(cur_page_state, cur_paging_state);

					}
					else if( attrs.value && element.ascend('values/property/selections_frame/categories') ) {

						new_page_state = this.checkbox_values_property_selections_frame_handler(element);

					}
					else if( attrs.btn && attrs.clear_selections ) {

						new_page_state = this.btn_clear_selections_handler(cur_page_state, cur_paging_state, element);

					}
					else if( attrs.btn && attrs.select_by_car ) {

						new_page_state = this.btn_select_by_car_handler(cur_page_state, cur_paging_state);

					}
					else if( attrs.value && element.ascend('values/select_by_car_frame/categories') ) {

						new_page_state = this.values_select_by_car_frame_handler(cur_page_state, cur_paging_state, element);

					}
					else if( attrs.btn && attrs.clear_select_by_car ) {

						new_page_state = this.btn_clear_select_by_car_handler(cur_page_state, cur_paging_state, element);

					}
					else if( attrs.pdescription && element.ascend('pmid/pinfo') ) {

						let e = xpath_eval_single('html/body/div[@pinfo]/div[@pmid]/div[@pproperties]');

						if( e.style.display === 'none' ) {

							e.fadein();

						}
						else {

							e.fadeout();
							element.fadein();

						}

					}
					else if( attrs.vk ) {

						new_page_state = this.btn_vk_handler(cur_page_state, cur_paging_state, element);

					}
					else if( attrs.btn && attrs.scan && !attrs.touchmove ) {

						this.btn_scan_handler();

					}
					else if( attrs.btn && attrs.order && !attrs.touchmove ) {

						new_page_state = this.btn_cheque_cart_informer_handler(cur_page_state);

					}
					else if( attrs.btn && element.ascend('pitem/middle') && !attrs.touchmove ) {
						// change cart
						let product = element.parentNode.attributes.uuid.value;

						if( attrs.plus_one ) {

							new_page_state = this.btn_dst_plus_one_pitem_handler(cur_page_state, product);

						}
						else if( attrs.minus_one ) {

							new_page_state = this.btn_dst_minus_one_pitem_handler(cur_page_state, product);

						}
						else if( attrs.discount ) {

							this.switch_dst_discount_middle_pitem(element);

						}
						else if( attrs.discount_price ) {
							let btn = xpath_eval_single('div[@btn and @discount]', element.parentNode);
							btn.setAttribute('mode', 'percent');
							element.display(false);
							xpath_eval_single('div[@btn and @discount_percent]', element.parentNode).display(true);
							let v = xpath_eval_single('div[@discount_value]/input[@discount_value]', element.parentNode);
							this.discount_value_text_type_handler(v, cur_page_state, v.value);
						}
						else if( attrs.discount_percent ) {
							let btn = xpath_eval_single('div[@btn and @discount]', element.parentNode);
							btn.setAttribute('mode', 'price');
							element.display(false);
							xpath_eval_single('div[@btn and @discount_price]', element.parentNode).display(true);
							let v = xpath_eval_single('div[@discount_value]/input[@discount_value]', element.parentNode);
							this.discount_value_text_type_handler(v, cur_page_state, v.value);
						}
						else if( attrs.discount_accept ) {
							let holder = xpath_eval_single('div[@btn and @discount]', element.parentNode);
							if( holder.attributes.value ) {
								let value = holder.attributes.value.value;
								if( !value.isEmpty() ) {
									new_page_state = this.btn_dst_discount_accept_handler(cur_page_state, product, value);

									if( document.activeElement === xpath_eval_single('div[@discount_value]/input[@discount_value]', element.parentNode) )
										document.activeElement.blur();

									this.switch_dst_discount_middle_pitem(holder);
								}
							}
						}
					}
					else if( attrs.discount_value && element.ascend('discount_value/pitem/middle') && !attrs.touchmove ) {
					}
					else if( attrs.pitem && element.ascend('middle')
						&& !(((e.target.attributes.btn || e.target.attributes.pimg) && e.target.ascend('pitem/middle')) || e.target.ascend('discount_value/pitem/middle'))
						&& !attrs.touchmove ) {

						new_page_state = this.switch_dst_middle_pitem(cur_page_state, cur_paging_state, element);

					}
					else if( attrs.order && element.ascend('orders_panel')
						&& !(e.target.attributes.btn && e.target.ascend('order/orders_panel'))
						&& !attrs.touchmove ) {
						
						for( let p of xpath_eval('div[@btn]', element) )
							p.display(!attrs.expanded);

						if( attrs.expanded )
							element.removeAttribute('expanded');
						else
							element.setAttribute('expanded', '');

					}
					else if( attrs.btn && element.ascend('order/orders_panel') && !attrs.touchmove ) {

						let order = element.parentNode.attributes.uuid.value;

						// switch on search panel
						if( attrs.customer ) {
							let panel = xpath_eval_single('html/body/div[@search_panel]');
							panel.display(true);
							panel.setAttribute('view', 'customers');
							panel.setAttribute('order', order);
							xpath_eval_single('html/body/i[@btn and @vks]').display(false);
							xpath_eval_single('input[@vks]', panel).focus();
							xpath_eval_single('input[@vks]', panel).click();
							cur_page_state.search_panel_ = true;
						}
						else if( attrs.remove ) {
							[ new_page_state ] = this.clone_page_state();

							let request = {
								'module'		: 'orderer',
								'handler'		: 'orderer',
								'order'			: order,
								'remove'		: true
							};

							if( cur_page_state.authorized_ && cur_page_state.auth_ ) {
								request.user = cur_page_state.auth_.user_uuid;
								request.pass = cur_page_state.auth_.pass;
							}

							show_alert = true;
							let data = this.post_json('proxy.php', request);

							if( data.errno !== 0 )
								throw new Error(data.error + "\n" + data.stacktrace);

							new_page_state.modified_ = true;

							if( new_page_state && new_page_state.modified_ ) {

								if( this.pending_orders_ ) {
									this.setup_pending_orders_refresh();
								}
								else {
									let p = xpath_eval_single('html/body/div[@middle]/div[@orders_panel]/div[@order and @uuid=\'' + order + '\']');
									p.parentNode.removeChild(p);
								}

								new_page_state.search_panel_ = false;
							}
						}
					}
					else if( attrs.search_panel ) {
						if( document.activeElement === xpath_eval_single('input[@vks]', element) )
							document.activeElement.blur();
					}
					else if( attrs.vks && attrs.btn && element.ascend('search_panel') && !attrs.touchmove ) {
						// switch off search panel
						xpath_eval_single('html/body/div[@search_panel]').display(false);
						xpath_eval_single('html/body/i[@btn and @vks]').display(true);
						cur_page_state.search_panel_ = false;

						if( document.activeElement === xpath_eval_single('input[@vks]', element.parentNode) )
							document.activeElement.blur();
					}
					else if( attrs.vks && element.ascend('search_panel') && !attrs.touchmove ) {

						if( element === document.activeElement ) {
							prevent_default = false;
						}
						else {
							e.stopImmediatePropagation();
							e.preventDefault();
							e.target.focus();
							e.target.click();
						}

					}
					else if( attrs.results && element.ascend('search_panel') ) {
						if( document.activeElement === xpath_eval_single('input[@vks]', element.parentNode) )
							document.activeElement.blur();
					}
					else if( attrs.result && element.ascend('results/search_panel') ) {
						let panel = element.parentNode.parentNode;

						if( !attrs.touchmove && panel.attributes.view.value === 'products' ) {
							let product = attrs.uuid.value;
							let cart_entity = cur_page_state.cart_by_uuid_[product];

							if( cart_entity ) {
								if( cart_entity.buy_quantity < cart_entity.remainder ) {
									[ new_page_state ] = this.clone_page_state();

									cart_entity = new_page_state.cart_by_uuid_[product];

									cart_entity.buy_quantity++;
									cart_entity.modified = true;

									this.render_.rewrite_cart(new_page_state);
									this.barcode_scanner_rewrite(new_page_state, cur_page_state);
									new_page_state.modified_ = true;
								}
							}
							else {
								[ new_page_state ] = this.clone_page_state();
								this.render_.rewrite_cart(new_page_state, product, 1, attrs.price.value);
								this.barcode_scanner_rewrite(new_page_state, cur_page_state);
								new_page_state.modified_ = true;
							}

							if( new_page_state && new_page_state.modified_ ) {
								// switch off search panel
								panel.display(false);
								xpath_eval_single('html/body/i[@btn and @vks]').display(true);

								if( document.activeElement === xpath_eval_single('input[@vks]', panel) )
									document.activeElement.blur();

								new_page_state.search_panel_ = false;
							}
						}
						else if( !attrs.touchmove && panel.attributes.view.value === 'customers' ) {
							[ new_page_state ] = this.clone_page_state();
							let order = panel.attributes.order.value;

							let request = {
								'module'		: 'orderer',
								'handler'		: 'orderer',
								'order'			: order,
								'customer'		: attrs.uuid.value
							};

							if( cur_page_state.authorized_ && cur_page_state.auth_ ) {
								request.user = cur_page_state.auth_.user_uuid;
								request.pass = cur_page_state.auth_.pass;
							}

							show_alert = true;
							let data = this.post_json('proxy.php', request);

							if( data.errno !== 0 )
								throw new Error(data.error + "\n" + data.stacktrace);

							new_page_state.modified_ = true;

							if( new_page_state && new_page_state.modified_ ) {
								// switch off search panel
								panel.display(false);
								xpath_eval_single('html/body/i[@btn and @vks]').display(true);

								if( document.activeElement === xpath_eval_single('input[@vks]', panel) )
									document.activeElement.blur();

								if( this.pending_orders_ ) {
									this.setup_pending_orders_refresh();
								}
								else {
									xpath_eval_single('html/body/div[@middle]/div[@orders_panel]/div[@order and @uuid=\'' + order + '\']/div[@txt]/font[@customer_name]').innerHTML =
										xpath_eval_single('div[@txt]/font[@pname]', element).innerHTML;
								}

								new_page_state.search_panel_ = false;
							}
						}
					}
					else if( attrs.btn && attrs.vks && !attrs.touchmove ) {

						// switch on search panel
						let panel = xpath_eval_single('html/body/div[@search_panel]');
						panel.display(true).setAttribute('view', 'products');
						xpath_eval_single('html/body/i[@btn and @vks]').display(false);
						xpath_eval_single('input[@vks]', panel).focus();
						xpath_eval_single('input[@vks]', panel).click();
						cur_page_state.search_panel_ = true;

					}
					else if( attrs.logo && element.ascend('top') && !attrs.touchmove ) {
						// switch on auth panel
						let panel = xpath_eval_single('html/body/div[@auth_panel]');
						panel.display(true);

						let p = xpath_eval_single('input[@login_user]', panel);
						p.focus();
						p.click();

						p = xpath_eval_single('label[@vk_logout]', panel);
						p.display(cur_page_state.authorized_);

					}
					else if( attrs.login_user && element.ascend('auth_panel') && !attrs.touchmove ) {
						if( document.activeElement !== element ) {
							element.focus();
							element.click();
						}
					}
					else if( attrs.login_pass && element.ascend('auth_panel') && !attrs.touchmove ) {
						if( document.activeElement !== element ) {
							element.focus();
							element.click();
						}
					}
					else if( attrs.btn && element.ascend('auth_panel') && !attrs.touchmove ) {

						if( attrs.vk_login ) {
							[ new_page_state ] = this.clone_page_state();
							let panel = element.parentNode;

							let request = {
								'module'	: 'authorizer',
								'handler'	: 'authorizer',
								'login'		: true,
								'user'		: xpath_eval_single('input[@login_user]', panel).value,
								'pass'		: xpath_eval_single('input[@login_pass]', panel).value
							};

							if( !this.sha256_ )
								this.sha256_ = new Hashes.SHA256;

							request.pass = this.sha256_.hex(request.pass).toUpperCase();

							show_alert = true;
							let data = this.post_json('proxy.php', request);

							if( data.errno !== 0 )
								throw new Error(data.error + "\n" + data.stacktrace);

							new_page_state.modified_ = true;
							new_page_state.auth_ = data.auth;
							new_page_state.authorized_ = data.auth && data.auth.authorized;

							if( new_page_state.authorized_ ) {
								element.parentNode.display(false);
								xpath_eval_single('html/body/div[@top]/div[@auth]').innerHTML = `<br>Авторизовано: ${data.auth.user}`;
							}
							else {
								for(;;) {
									let error_panel = xpath_single('div[@error]', panel);

									if( error_panel ) {
										error_panel.innerHTML = 'Ошибка авторизации, неверное имя или пароль';
										setTimeout(() => panel.removeChild(error_panel), 5000);
										break;
									}

									panel.insertAdjacentHTML('beforeend', '<div error></div>');
								}
							}

							this.barcode_scanner_rewrite(new_page_state, cur_page_state);
						}
						else if( element.attributes.vk_logout ) {
							[ new_page_state ] = this.clone_page_state();
							let panel = e.target.parentNode;

							let request = {
								'module'	: 'authorizer',
								'handler'	: 'authorizer',
								'logout'	: true
							};

							show_alert = true;
							let data = this.post_json('proxy.php', request);

							if( data.errno !== 0 )
								throw new Error(data.error + "\n" + data.stacktrace);

							new_page_state.modified_ = true;
							delete new_page_state.auth_;
							new_page_state.authorized_ = false;

							element.parentNode.display(false);
							xpath_eval_single('html/body/div[@top]/div[@auth]').innerHTML = '';
							this.barcode_scanner_rewrite(new_page_state, cur_page_state);
						}
						else if( element.attributes.vk_cancel ) {
							element.parentNode.display(false);

							if( document.activeElement === xpath_eval_single('input[@login_user]', element.parentNode)
								|| document.activeElement === xpath_eval_single('input[@login_pass]', element.parentNode) )
								document.activeElement.blur();
						}

					}

					if( attrs.touchmove )
						element.removeAttribute('touchmove');
					//Render.debug(2, e.currentTarget.innerHTML);
					break;

				case 'touchcancel'	:
					if( attrs.touchmove )
						element.removeAttribute('touchmove');
					prevent_default = false;
					break;

				case 'touchstart'	:
					if( attrs.touchmove )
						element.removeAttribute('touchmove');
					//if( attrs.middle && this.debug_ && this.dct_ ) {
					//	this.startx_ = e.touches[0].pageX;
					//	this.starty_ = e.touches[0].pageY;
					//}
					prevent_default = false;
					break;

				case 'touchmove'	:
					//if( attrs.middle && this.debug_ && this.dct_ ) {
					//	let distx = this.startx_ - e.touches[0].pageX;
					//	let disty = this.starty_ - e.touches[0].pageY;
					//	Render.debug(1, 'TM:&nbsp;' + Math.trunc(distx) + '&nbsp;' + Math.trunc(disty));
					//}
					//Render.debug(1, e.currentTarget.innerHTML);
					if( typeof element.setAttribute === 'function' )
						element.setAttribute('touchmove', '');

					prevent_default = false;
					break;

				case 'mouseover'	:
					break;

				case 'mouseout'	:
					break;

				case 'mouseenter'	:
					if( attrs.middle && this.debug_ && this.dct_ ) {
						this.startx_ = parseInt(e.clientX);
						this.starty_ = parseInt(e.clientY);
					}
					break;

				case 'mouseleave'	:
					break;

				case 'mousemove'	:
					if( attrs.middle && this.debug_ && this.dct_ ) {
						let distx = parseInt(e.clientX) - this.startx_;
						let disty = parseInt(e.clientY) - this.starty_;
						//Render.debug(0, 'ME:&nbsp;' + this.startx_ + '&nbsp;' + this.starty_);
						//Render.debug(1, 'MM:&nbsp;' + distx + '&nbsp;' + disty);
					}
					break;

				case 'blur'			:		
					this.setup_text_type_event(element, null);
					break;

				case 'focus'		:
					if( attrs.vks && element.ascend('search_panel') )
						this.setup_text_type_event(element);
					else if( attrs.discount_value && element.ascend('discount_value/pitem/middle') )
						this.setup_text_type_event(element, 100);
					else
						this.setup_text_type_event(element);
					break;

				case 'contextmenu'	:
				case 'selectstart'	:
					return false;

				// custom events
				case 'text_type'	:
					if( attrs.vks && element.ascend('search_panel') )
						this.search_panel_text_type_handler(e.detail);
					else if( attrs.discount_value && element.ascend('discount_value/pitem/middle') )
						this.discount_value_text_type_handler(element, cur_page_state, e.detail);
					break;

				case 'barcode'		:
					new_page_state = this.barcode_scan_handler(cur_page_state, e.detail);
					break;

				case 'startup'		:
					new_page_state = this.startup_handler(cur_page_state, cur_paging_state, element);
					break;

				case 'startup_auth'		:
					new_page_state = this.startup_auth_handler(cur_page_state, cur_paging_state);
					break;

				case 'away'			:
					new_page_state = this.idle_away_reload_handler(cur_page_state, cur_paging_state, element);
					break;

				case 'sse_reload'	:
					new_page_state = this.sse_reload_handler(cur_page_state, cur_paging_state, element);
					break;

				case 'vki_type'		:
					new_page_state = this.btn_vki_type_handler(e, cur_page_state, cur_paging_state, element);
					break;

			}

			// success rewrite page, save new state
			if( new_page_state && new_page_state.modified_ ) {

				this.render_.show_new_page_state(new_page_state);
				this.page_state_ = new_page_state;

				this.render_.debug_ellapsed(0, 'PAGE:&nbsp;');

			}

		}
		catch( ex ) {

			if( ex instanceof XhrDeferredException ) {
				x = ex;
				e.deferredTarget = e.currentTarget ? e.currentTarget : e.deferredTarget;
			}
			else {
				if( show_alert )
					this.show_alert('<pre error>' + ex.message + "\n" + ex.stack + '</pre>', cur_page_state);
				console.log(ex);
				//console.log(ex.message + "\n" + ex.stack);
				throw ex;
			}

		}
		finally {

			if( prevent_default ) {
				//e.stopImmediatePropagation();
				e.preventDefault();
			}

			if( !x ) {

				if( this.load_indicator_timer_ ) {

					clearTimeout(this.load_indicator_timer_);
					delete this.load_indicator_timer_;//this.load_indicator_timer_ = undefined;

				}

				if( this.load_indicator_ )
					this.load_indicator_.fadeout();//this.load_indicator_.style.display = 'none';

			}

		}

		return false;
	}

	animation_events_handler(e) {

		if( e.animationName !== 'fadein' && e.animationName !== 'fadeout' )
			return;

		let element	= e.currentTarget;
		let attrs	= element.attributes;

		if( attrs.fadein || attrs.fadeout ); else return;

		switch( e.type ) {

			case 'animationstart'	:
				break;

			case 'animationend'		:

				if( attrs.fadein )
					element.removeAttribute('fadein');

				if( attrs.fadeout ) {

					if( attrs.fadeout.value.isEmpty() )
						element.style.display = 'none';

					element.removeAttribute('fadeout');

				}

				break;

		}

		e.preventDefault();

	}

	setup_animation_events(elements, phase = false) {

		for( let element of elements )
			for( let event of [ 'animationstart', 'animationend' ] )
				add_event(element, event, e => this.animation_events_handler(e), phase);

	}

	setup_events(elements, phase = true) {

		for( let event of this.events_ )
			for( let element of (elements instanceof Array ? elements : [elements]) )
				add_event(element, event, e => this.events_handler(e), phase);

	}

	sse_handler_(e) {

		if( e.data ) {

			//console.log('message: ' + e.data + ', last-event-id: ' + e.lastEventId);
			let data = JSON.parse(e.data, JSON.dateParser);

			//if( data.timestamp )
			//	console.log(data.timestamp + ', last-event-id: ' + e.lastEventId);
			let reload = false;
			let ptable = xpath_eval_single('html/body/div[@plist]/div[@ptable]');
			let walk = function (uuids) {

				for( let uuid of uuids ) {

					let items = xpath_eval('div[@pitem and @uuid=\'' + uuid + '\']', ptable);

					if( items.length === 0 )
						continue;

					reload = true;

				}

			};

			if( data.products )
				walk(data.products);

			if( data.prices )
				walk(data.prices);

			if( data.remainders )
				walk(data.remainders);

			if( data.reserves )
				walk(data.reserves);

			if( data.system_remainders )
				walk(data.system_remainders);

			if( reload )
				window.dispatchEvent(new CustomEvent('sse_reload'));

		}

	}

	sse_start() {
		this.sseq_timer_ = setTimeout(() => this.sse_handler(), 1000);
	}

	sse_success_handler(events) {

		try {

			let ids = [];
			let reload = false;
			let table = xpath_eval_single('html/body/div[@plist]/div[@ptable]');
			let m = {};

			for( let e of xpath_eval('div[@pitem]', table) )
				if( e.attributes.uuid )
					m[e.attributes.uuid.value] = true;

			for( let e of xpath_eval('div[@pitem]/div[@pimg]', table) )
				if( e.attributes.uuid )
					m[e.attributes.uuid.value] = true;

			let walk = (uuids) => {

				for( let uuid of uuids )
					if( m[uuid] )
						reload = true;

			};

			for( let e of events ) {

				if( e.products )
					walk(e.products);

				if( e.prices )
					walk(e.prices);

				if( e.remainders )
					walk(e.remainders);

				if( e.system_remainders )
					walk(e.system_remainders);

				if( e.reserves )
					walk(e.reserves);

				if( e.images )
					walk(e.images);

				ids.push(e.id);

			}

			if( reload )
				window.dispatchEvent(new CustomEvent('sse_reload'));

			let request = {
				'module'	: 'eventer',
				'handler'	: 'eventer',
				'received'	: ids
			};

			post_json_async('proxy.php', request);

		}
		catch( e ) {

			console.log(e.message + "\n" + e.stack);
			this.sse_start();
			throw e;

		}

		this.sse_start();

	}

	sse_error_handler(msg, xhr) {

		console.log(msg);
		this.sse_start();

	}

	sse_handler() {

		let request = {
			'module'	: 'eventer',
			'handler'	: 'eventer',
			'get'		: true
		};

		post_json_async(
			'proxy.php',
			request,
			(data)		=> this.sse_success_handler(data.events),
			(msg, xhr)	=> this.sse_error_handler(msg, xhr)
		);

	}

}
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class HtmlPageManager extends HtmlPageEvents {

	constructor() {
		super();
	}

	startup() {

		this.dct_ = location_search().dct;
		this.cst_ = !this.dct_; // customer terminal mode
		this.debug_ = location_search().debug;

		this.window_resize_handler();

		// Intl not work under android
		//this.date_formatter_ = date => {
		//	let f = new Intl.DateTimeFormat('ru-RU', {
		//		year	: 'numeric', 
		//		month	: '2-digit',
		//		day		: '2-digit',
		//		hour	: '2-digit',
		//		minute	: '2-digit',
		//		second	: '2-digit',
		//		hour12	: false
		//	});
		//	return f.format(date);
		//};
		this.date_formatter_ = date => strftime('%d.%m.%Y %H:%M:%S', date);

		Render.hide_cursor();

		this.setup_animation_events(xpath_eval('//*[@fadein or @fadeout]'));
		this.setup_events(xpath_eval('html/body/div[@btn]'));

		if( this.cst_ ) {
			this.setup_events(xpath_eval('html/body/div[@pcontrols]/div[@plist_controls or @psort_controls]/div[@btn]'));
			this.setup_events(xpath_eval('html/body/div[@pinfo]/div[@pright]/div[@btn]'));
			this.setup_events(xpath_eval('html/body/div[@pinfo]/div[@pmid]/div[@pdescription]'));
			this.setup_events(xpath_eval('html/body/div[@pinfo]/div[@pimg]'));
			this.setup_events(xpath_eval('html/body/div[@top]/div[@cart_informer]/div[@btn]'));
		}

		this.setup_events(xpath_eval('html/body/div[@plargeimg or @alert]'));

		if( this.dct_ ) {
			this.setup_events([document]);
			this.setup_events(xpath_eval('html/body'));
			this.setup_events(xpath_eval('html/body/div[@middle]'));
			this.setup_events(xpath_eval('html/body/i[@btn]'));
			this.setup_events(xpath_eval_single('html/body/div[@search_panel]/div[@results]'));

			this.setup_events(xpath_eval('html/body/div[@search_panel]/label'), false);
			this.setup_events(xpath_eval('html/body/div[@search_panel]/input'), false);
			this.setup_events(xpath_eval_single('html/body/div[@top]/div[@logo]'), false);

			this.setup_events(xpath_eval('html/body/div[@auth_panel]/label'), false);
			this.setup_events(xpath_eval('html/body/div[@auth_panel]/input'), false);
		}

		this.setup_events(xpath_eval('html/body/div[@pcart]/div[@pcontrols]/div[@btn]'));

		this.render_ = new Render;
		this.render_.state = this;

		if( this.cst_ ) {
			add_event(window, 'sse_reload', e => this.events_handler(e), false);
			this.sse_start();

			add_event(window, 'away', e => this.events_handler(e), false);
			this.idle_away_reloader_ = new Idle({
				oneshot	: false,
				retry	: true,
				start	: true,
				timeout	: 60000, // 60s
				away	: () => {
					window.dispatchEvent(new CustomEvent('away'));
				}
			});

			// virtual keyboard initiator
			add_event(window, 'vki_type', e => this.events_handler(e), false);
			this.setup_events(xpath_eval('html/body/img[@vk]'));
			let vki_iframe_content = xpath_eval_single('html/body/iframe[@vk]').contentWindow;
			vki_iframe_content.vki_callback = (e, keyboard, el, status) => this.vk_input_callback_handler(e, keyboard, el, status);
		}

		add_event(window, 'resize', e => this.events_handler(e), false);

		if( !this.debug_ ) { // disable text selection and context menu
			add_event(document, 'contextmenu', (e) => { e.preventDefault(); return false; }, true);
			add_event(document, 'selectstart', (e) => { e.preventDefault(); return false; }, true);
		}

		if( this.dct_ ) {
			add_event(window, 'barcode', e => this.events_handler(e), false);
			add_event(window, 'startup_auth', e => this.events_handler(e), false);
		}

		add_event(window, 'startup', e => this.events_handler(e), false);
	
		setTimeout(() => {
			if( this.dct_ )
				window.dispatchEvent(new CustomEvent('startup_auth'));
			window.dispatchEvent(new CustomEvent('startup'));
		});
	}
}
//------------------------------------------------------------------------------
function dct_html_body() {
	return `
		<div top>
			<div logo></div>
			<div auth></div>
			<div cart_informer>
				<div cinfo>
					<p ccount></p>
					<p csum></p>
				</div>
			</div>
		</div>
		<div middle>
			<div scanner fadein>
				<div viewport></div>
			</div>
			<!--<iframe scanner src="assets/scanner/index.html"></iframe>-->
			<div orders_panel></div>
		</div>
		<i btn scan></i>
		<i btn order></i>
		<i btn vks blink2></i>
		<div mount>
			<!--<p>&nbsp;</p>-->
			<p mag></p>
			<p address></p>
		</div>
		<div plargeimg fadein></div>
		<div alert fadein></div>
		<div search_panel>
			<input vks text_type placeholder="Вводите текст поиска ..." type="text">
			<label vks btn blink2></label>
			<div results></div>
		</div>
		<div auth_panel>
			<input login_user placeholder="Регистрационное имя ..." type="text">
			<br>
			<input login_pass placeholder="Пароль ..." type="password">
			<br>
			<label btn vk_login blink2></label>
			<label btn vk_logout blink2></label>
			<label btn vk_cancel></label>
		</div>
		<audio id="scanner_beep">
			<source src="assets/scanner/beep-07.ogg" type="audio/ogg">
			<source src="assets/scanner/beep-07.mp3" type="audio/mpeg">
			<source src="assets/scanner/beep-07.wav" type="audio/x-wav">
		</audio>
	`;
}
//------------------------------------------------------------------------------
function cst_html_body() {
	return `
		<div top>
			<div logo></div>
			<div mag></div>
			<div cart_informer>
				<div cinfo>
					<p ccount></p>
					<p csum></p>
				</div>
				<div btn cheque>
					<img btn_ico src="assets/cheque.ico">
					<span btn_txt>ПРЕДЧЕК</span>
				</div>
				<div btn cart>
					<img btn_ico src="assets/cart/cart_edit.ico">
					<span btn_txt>ИЗМЕНИТЬ</span>
				</div>
				<div btn drop>
					<img btn_ico src="assets/cart/cart_delete.ico">
					<span btn_txt>ОЧИСТИТЬ</span>
				</div>
			</div>
		</div>
		<div categories></div>
		<div btn back fadein>
			<img btn_ico src="assets/arrows/arrow_undo.ico">
			<span btn_txt>НАЗАД</span>
		</div>
		<div btn selections fadein>
			<img btn_ico src="assets/filter.ico">
			<span btn_txt>&nbsp;&nbsp;ФИЛЬТР&nbsp;&nbsp;</span>
		</div>
		<div btn select_by_car fadein>
			<img btn_ico src="assets/car.ico">
			<span btn_txt>АВТОМОБИЛЬ</span>
		</div>
		<div plist fadein>
			<div ptable></div>
		</div>
		<div pcontrols>
			<div psort_controls>
				<div btn list_sort_order fadein>
					<span btn_txt></span>
					<img btn_ico src="">
				</div>
				<div btn list_sort_direction fadein>
					<img btn_ico src="">
				</div>
			</div>
			<div plist_controls>
				<div btn first_page fadein>
					<img btn_ico_condensed src="assets/arrows/arrow_left.ico">
					<img btn_ico_condensed src="assets/arrows/arrow_left.ico">
				</div>
				<div btn prev_page fadein>
					<span btn_txt></span>
					<img btn_ico src="assets/arrows/arrow_left.ico">
				</div>
				<div btn next_page fadein>
					<img btn_ico src="assets/arrows/arrow_right.ico">
					<span btn_txt></span>
				</div>
				<div btn last_page fadein>
					<img btn_ico_condensed src="assets/arrows/arrow_right.ico">
					<img btn_ico_condensed src="assets/arrows/arrow_right.ico">
					<span btn_txt></span>
				</div>
			</div>
		</div>
		<div pinfo fadein>
			<div pimg></div>
				<div pmid>
				<p pname></p>
				<hr><p pproperties_head>Характеристики</p><hr>
				<div pproperties fadein></div>
				<div pdescription fadein></div>
			</div>
			<div pright>
				<p pprice></p>
				<p pquantity></p>
				<p pincart></p>
				<div btn minus_one fadein>
					<img btn_ico src="assets/minus.ico">
				</div>
				<p pbuy_quantity></p>
				<div btn plus_one fadein>
					<img btn_ico src="assets/plus.ico">
				</div>
				<div btn buy>
					<img btn_ico src="assets/cart/cart_put.ico">
					<span btn_txt>КУПИТЬ</span>
				</div>
				<hr><p premainders_head>Наличие в магазинах</p><hr>
				<div premainders></div>
			</div>
		</div>
		<div plargeimg fadein></div>
		<div pcart fadein>
			<div ptable></div>
			<div pcontrols>
				<div btn prev_page fadein>
					<span btn_txt></span>
					<img btn_ico src="assets/arrows/arrow_left.ico">
				</div>
				<div btn next_page fadein>
					<img btn_ico src="assets/arrows/arrow_right.ico">
					<span btn_txt></span>
				</div>
			</div>
		</div>
		<div middle></div>
		<div mount></div>
		<div alert fadein></div>

		<iframe cheque_print copy="1" src="assets/print/cheque_template.html"></iframe>
		<iframe cheque_print copy="2" src="assets/print/cheque_template.html"></iframe>

		<img vk fadein src="assets/vk/jquery/keyboard.svg">

		<div barcode></div>

		<div class="cssload-container" fadein>
			<div class="cssload-text">
				<span>ЗАГРУЗКА<br>ЖДИТЕ...</span>
			</div>
			<div class="cssload-bell">
				<div class="cssload-circle">
					<div class="cssload-inner"></div>
				</div>
				<div class="cssload-circle">
					<div class="cssload-inner"></div>
				</div>
				<div class="cssload-circle">
					<div class="cssload-inner"></div>
				</div>
				<div class="cssload-circle">
					<div class="cssload-inner"></div>
				</div>
				<div class="cssload-circle">
					<div class="cssload-inner"></div>
				</div>
			</div>
		</div>
	`;
}
//------------------------------------------------------------------------------
function core() {
	let qp = location_search();
	//let browser = get_browser();
	let t = qp.dct ? dct_html_body() : cst_html_body();

	if( qp.debug && qp.dct && !SmartPhone.isAny() )
		t += '<img debug_barcode src="assets/scanner/barcode-7638900411416.svg">';

	document.getElementsByTagName('body')[0].insertAdjacentHTML('beforeend', t.replace(/(?:[\r\n\t])/g, ''));
	//document.getElementsByTagName('title')[0].innerText = 'Терминал сбора данных, ТСД (data collection terminal, DCT)';

	if( qp.debug ) {

		let div = document.createElement('div');
		div.setAttribute('debug', '');
		div.innerHTML = `
			<div debug="0"></div><div debug="1"></div>
			<div debug="2"></div><div debug="3"></div>
			<div debug="4"></div><div debug="5"></div>
			<div debug="6"></div><div debug="7"></div>
			<div debug="8"></div><div debug="9"></div>
		`.replace(/(?:[\r\n\t])/g, '');

		let body = document.getElementsByTagName('body')[0];
		body.appendChild(div);

		let lnk = document.createElement('link');
		lnk.setAttribute('rel', 'stylesheet');
		lnk.setAttribute('type', 'text/css');
		lnk.setAttribute('href', 'css/debug.css');

		let head = document.getElementsByTagName('head')[0];
		head.appendChild(lnk);

	}

	if( !qp.dct ) {

		//<iframe vk fadein src="assets/vk/jquery/vk.html"></iframe>
		let iframe = document.createElement('iframe');
		iframe.setAttribute('seamless', '');
		iframe.setAttribute('frameborder', 0);
		iframe.setAttribute('scrolling', 'no');
		iframe.setAttribute('vk', '');
		iframe.setAttribute('fadein', '');
		iframe.src = 'assets/vk/jquery/vk.html';
		iframe.onload = () => {
			if( qp.debug )
				return;

			let doc = iframe.contentWindow.document;
			let body = doc.body;
			let html = doc.documentElement;
			
			//let vki_iframe_content = xpath_eval_single('html/body/iframe[@vk]').contentWindow;
			let vki_iframe_document = iframe.contentWindow.document;
			let lnk = vki_iframe_document.createElement('link');
			lnk.setAttribute('rel', 'stylesheet');
			lnk.setAttribute('type', 'text/css');
			lnk.setAttribute('href', 'vkn.css');

			vki_iframe_document.getElementsByTagName('head')[0].appendChild(lnk);
		};

		xpath_eval_single('html/body').insertBefore(iframe, xpath_eval_single('html/body/img[@vk]').nextElementSibling);
	}

	manager = new HtmlPageManager;
	manager.startup();

	// TODO: debug only, need to remove
	//let barcode_render = new barcode_ean13_render({ width: 7.62 });
	//let barcode_html = barcode_render.draw_barcode('5099206021877');

	//xpath_eval_single('html/body/div[@barcode]').innerHTML = barcode_html;

	/*{
		//let c = xpath_eval_single('html/body/canvas[@id=\'■\']');
		let c = document.createElement('Canvas');
		c.style.position = 'fixed';
		c.style.left = '10px';
		c.style.top = '80px';
		c.style.zIndex = 999;
		c.style.border = 'solid 1px black';
		c.width = c.height = 300;
		document.getElementsByTagName('body')[0].appendChild(c);
		let ctx = c.getContext('2d');
		ctx.imageSmoothingEnabled = false;
		//ctx.translate(c.width, c.height);
		// 1 metre is equal to 237.10630158366 em
		// 1 mm is equal to 0.28453 em
		ctx.textBaseline = 'top';
		ctx.textAlign = 'left';
		ctx.font = '638px Arial';
		ctx.font = '300px Arial';
		ctx.fillStyle = 'black';
		ctx.fillText('■', 0, -30);
		//ctx.fillRect(0, 0, 5, 5);
		//document.getElementsByTagName('body')[0].removeChild(c);
		console.log(screen.width, screen.height);

		let imgData = ctx.getImageData(0, 0, c.width, c.height);
		// array [r,g,b,a,r,g,b,a,r,g,..]

		function getPixel(imgData, index) {
			let i = index * 4, d = imgData.data;
			return [ d[i], d[i + 1], d[i + 2], d[i + 3] ]; // array [R,G,B,A]
		}

		// AND/OR

		function getPixelXY(imgData, x, y) {
			let i = (y * imgData.width + x) * 4, d = imgData.data;
  			return [ d[i], d[i + 1], d[i + 2], d[i + 3] ]; // array [R,G,B,A]
		}

		function getPixelAlpha(imgData, x, y) {
			let i = (y * imgData.width + x) * 4, d = imgData.data;
  			return d[i + 3];
		}

		let data = imgData.data;
		let width = imgData.width;
		let pitch = width * 4;
		let find_corner = (d) => {
			let s = d > 0 ? 0 : width - 1;
			let t = d > 0 ? 0 : width;

			for( let i = s; d > 0 ? i < width : i >= 0; i += d ) {
				if( data[pitch * i + i * 4 + 3] === 0 )
					continue;

				let x = i, y = i;

				for(;;) {
					let lp = x !== t ? data[pitch * y + (x - d) * 4 + 3] : 0;
					let tp = y !== t ? data[pitch * (y - d) + x * 4 + 3] : 0;

					if( lp !== 0 )
						x -= d;
					else if( tp !== 0 )
						y -= d;
					else
						break;
				}

				return [ x, y ];
			}
		};

		let [ x1, y1 ] = find_corner(+1);
		let [ x2, y2 ] = find_corner(-1);

		console.log(x1, y1, x2, y2, (x2 - x1 + 1) / (y2 - y1 + 1));
		Render.debug(2, '' + x1 + ', ' + y1 + ', ' + x2 + ', ' + y2 + ', ' + (x2 - x1 + 1) / (y2 - y1 + 1));
	}*/
	//Render.debug(2, res().dpi);
	//Render.debug(3, verge.aspect(screen));
}
//------------------------------------------------------------------------------
// THIS FILE IS GENERATED - DO NOT EDIT!
/*!mobile-detect v1.3.6 2017-04-05*/
/*global module:false, define:false*/
/*jshint latedef:false*/
/*!@license Copyright 2013, Heinrich Goebl, License: MIT, see https://github.com/hgoebl/mobile-detect.js*/
(function (define, undefined) {
define(function () {
    'use strict';

    var impl = {};

    impl.mobileDetectRules = {
    "phones": {
        "iPhone": "\\biPhone\\b|\\biPod\\b",
        "BlackBerry": "BlackBerry|\\bBB10\\b|rim[0-9]+",
        "HTC": "HTC|HTC.*(Sensation|Evo|Vision|Explorer|6800|8100|8900|A7272|S510e|C110e|Legend|Desire|T8282)|APX515CKT|Qtek9090|APA9292KT|HD_mini|Sensation.*Z710e|PG86100|Z715e|Desire.*(A8181|HD)|ADR6200|ADR6400L|ADR6425|001HT|Inspire 4G|Android.*\\bEVO\\b|T-Mobile G1|Z520m",
        "Nexus": "Nexus One|Nexus S|Galaxy.*Nexus|Android.*Nexus.*Mobile|Nexus 4|Nexus 5|Nexus 6",
        "Dell": "Dell.*Streak|Dell.*Aero|Dell.*Venue|DELL.*Venue Pro|Dell Flash|Dell Smoke|Dell Mini 3iX|XCD28|XCD35|\\b001DL\\b|\\b101DL\\b|\\bGS01\\b",
        "Motorola": "Motorola|DROIDX|DROID BIONIC|\\bDroid\\b.*Build|Android.*Xoom|HRI39|MOT-|A1260|A1680|A555|A853|A855|A953|A955|A956|Motorola.*ELECTRIFY|Motorola.*i1|i867|i940|MB200|MB300|MB501|MB502|MB508|MB511|MB520|MB525|MB526|MB611|MB612|MB632|MB810|MB855|MB860|MB861|MB865|MB870|ME501|ME502|ME511|ME525|ME600|ME632|ME722|ME811|ME860|ME863|ME865|MT620|MT710|MT716|MT720|MT810|MT870|MT917|Motorola.*TITANIUM|WX435|WX445|XT300|XT301|XT311|XT316|XT317|XT319|XT320|XT390|XT502|XT530|XT531|XT532|XT535|XT603|XT610|XT611|XT615|XT681|XT701|XT702|XT711|XT720|XT800|XT806|XT860|XT862|XT875|XT882|XT883|XT894|XT901|XT907|XT909|XT910|XT912|XT928|XT926|XT915|XT919|XT925|XT1021|\\bMoto E\\b",
        "Samsung": "\\bSamsung\\b|SM-G9250|GT-19300|SGH-I337|BGT-S5230|GT-B2100|GT-B2700|GT-B2710|GT-B3210|GT-B3310|GT-B3410|GT-B3730|GT-B3740|GT-B5510|GT-B5512|GT-B5722|GT-B6520|GT-B7300|GT-B7320|GT-B7330|GT-B7350|GT-B7510|GT-B7722|GT-B7800|GT-C3010|GT-C3011|GT-C3060|GT-C3200|GT-C3212|GT-C3212I|GT-C3262|GT-C3222|GT-C3300|GT-C3300K|GT-C3303|GT-C3303K|GT-C3310|GT-C3322|GT-C3330|GT-C3350|GT-C3500|GT-C3510|GT-C3530|GT-C3630|GT-C3780|GT-C5010|GT-C5212|GT-C6620|GT-C6625|GT-C6712|GT-E1050|GT-E1070|GT-E1075|GT-E1080|GT-E1081|GT-E1085|GT-E1087|GT-E1100|GT-E1107|GT-E1110|GT-E1120|GT-E1125|GT-E1130|GT-E1160|GT-E1170|GT-E1175|GT-E1180|GT-E1182|GT-E1200|GT-E1210|GT-E1225|GT-E1230|GT-E1390|GT-E2100|GT-E2120|GT-E2121|GT-E2152|GT-E2220|GT-E2222|GT-E2230|GT-E2232|GT-E2250|GT-E2370|GT-E2550|GT-E2652|GT-E3210|GT-E3213|GT-I5500|GT-I5503|GT-I5700|GT-I5800|GT-I5801|GT-I6410|GT-I6420|GT-I7110|GT-I7410|GT-I7500|GT-I8000|GT-I8150|GT-I8160|GT-I8190|GT-I8320|GT-I8330|GT-I8350|GT-I8530|GT-I8700|GT-I8703|GT-I8910|GT-I9000|GT-I9001|GT-I9003|GT-I9010|GT-I9020|GT-I9023|GT-I9070|GT-I9082|GT-I9100|GT-I9103|GT-I9220|GT-I9250|GT-I9300|GT-I9305|GT-I9500|GT-I9505|GT-M3510|GT-M5650|GT-M7500|GT-M7600|GT-M7603|GT-M8800|GT-M8910|GT-N7000|GT-S3110|GT-S3310|GT-S3350|GT-S3353|GT-S3370|GT-S3650|GT-S3653|GT-S3770|GT-S3850|GT-S5210|GT-S5220|GT-S5229|GT-S5230|GT-S5233|GT-S5250|GT-S5253|GT-S5260|GT-S5263|GT-S5270|GT-S5300|GT-S5330|GT-S5350|GT-S5360|GT-S5363|GT-S5369|GT-S5380|GT-S5380D|GT-S5560|GT-S5570|GT-S5600|GT-S5603|GT-S5610|GT-S5620|GT-S5660|GT-S5670|GT-S5690|GT-S5750|GT-S5780|GT-S5830|GT-S5839|GT-S6102|GT-S6500|GT-S7070|GT-S7200|GT-S7220|GT-S7230|GT-S7233|GT-S7250|GT-S7500|GT-S7530|GT-S7550|GT-S7562|GT-S7710|GT-S8000|GT-S8003|GT-S8500|GT-S8530|GT-S8600|SCH-A310|SCH-A530|SCH-A570|SCH-A610|SCH-A630|SCH-A650|SCH-A790|SCH-A795|SCH-A850|SCH-A870|SCH-A890|SCH-A930|SCH-A950|SCH-A970|SCH-A990|SCH-I100|SCH-I110|SCH-I400|SCH-I405|SCH-I500|SCH-I510|SCH-I515|SCH-I600|SCH-I730|SCH-I760|SCH-I770|SCH-I830|SCH-I910|SCH-I920|SCH-I959|SCH-LC11|SCH-N150|SCH-N300|SCH-R100|SCH-R300|SCH-R351|SCH-R400|SCH-R410|SCH-T300|SCH-U310|SCH-U320|SCH-U350|SCH-U360|SCH-U365|SCH-U370|SCH-U380|SCH-U410|SCH-U430|SCH-U450|SCH-U460|SCH-U470|SCH-U490|SCH-U540|SCH-U550|SCH-U620|SCH-U640|SCH-U650|SCH-U660|SCH-U700|SCH-U740|SCH-U750|SCH-U810|SCH-U820|SCH-U900|SCH-U940|SCH-U960|SCS-26UC|SGH-A107|SGH-A117|SGH-A127|SGH-A137|SGH-A157|SGH-A167|SGH-A177|SGH-A187|SGH-A197|SGH-A227|SGH-A237|SGH-A257|SGH-A437|SGH-A517|SGH-A597|SGH-A637|SGH-A657|SGH-A667|SGH-A687|SGH-A697|SGH-A707|SGH-A717|SGH-A727|SGH-A737|SGH-A747|SGH-A767|SGH-A777|SGH-A797|SGH-A817|SGH-A827|SGH-A837|SGH-A847|SGH-A867|SGH-A877|SGH-A887|SGH-A897|SGH-A927|SGH-B100|SGH-B130|SGH-B200|SGH-B220|SGH-C100|SGH-C110|SGH-C120|SGH-C130|SGH-C140|SGH-C160|SGH-C170|SGH-C180|SGH-C200|SGH-C207|SGH-C210|SGH-C225|SGH-C230|SGH-C417|SGH-C450|SGH-D307|SGH-D347|SGH-D357|SGH-D407|SGH-D415|SGH-D780|SGH-D807|SGH-D980|SGH-E105|SGH-E200|SGH-E315|SGH-E316|SGH-E317|SGH-E335|SGH-E590|SGH-E635|SGH-E715|SGH-E890|SGH-F300|SGH-F480|SGH-I200|SGH-I300|SGH-I320|SGH-I550|SGH-I577|SGH-I600|SGH-I607|SGH-I617|SGH-I627|SGH-I637|SGH-I677|SGH-I700|SGH-I717|SGH-I727|SGH-i747M|SGH-I777|SGH-I780|SGH-I827|SGH-I847|SGH-I857|SGH-I896|SGH-I897|SGH-I900|SGH-I907|SGH-I917|SGH-I927|SGH-I937|SGH-I997|SGH-J150|SGH-J200|SGH-L170|SGH-L700|SGH-M110|SGH-M150|SGH-M200|SGH-N105|SGH-N500|SGH-N600|SGH-N620|SGH-N625|SGH-N700|SGH-N710|SGH-P107|SGH-P207|SGH-P300|SGH-P310|SGH-P520|SGH-P735|SGH-P777|SGH-Q105|SGH-R210|SGH-R220|SGH-R225|SGH-S105|SGH-S307|SGH-T109|SGH-T119|SGH-T139|SGH-T209|SGH-T219|SGH-T229|SGH-T239|SGH-T249|SGH-T259|SGH-T309|SGH-T319|SGH-T329|SGH-T339|SGH-T349|SGH-T359|SGH-T369|SGH-T379|SGH-T409|SGH-T429|SGH-T439|SGH-T459|SGH-T469|SGH-T479|SGH-T499|SGH-T509|SGH-T519|SGH-T539|SGH-T559|SGH-T589|SGH-T609|SGH-T619|SGH-T629|SGH-T639|SGH-T659|SGH-T669|SGH-T679|SGH-T709|SGH-T719|SGH-T729|SGH-T739|SGH-T746|SGH-T749|SGH-T759|SGH-T769|SGH-T809|SGH-T819|SGH-T839|SGH-T919|SGH-T929|SGH-T939|SGH-T959|SGH-T989|SGH-U100|SGH-U200|SGH-U800|SGH-V205|SGH-V206|SGH-X100|SGH-X105|SGH-X120|SGH-X140|SGH-X426|SGH-X427|SGH-X475|SGH-X495|SGH-X497|SGH-X507|SGH-X600|SGH-X610|SGH-X620|SGH-X630|SGH-X700|SGH-X820|SGH-X890|SGH-Z130|SGH-Z150|SGH-Z170|SGH-ZX10|SGH-ZX20|SHW-M110|SPH-A120|SPH-A400|SPH-A420|SPH-A460|SPH-A500|SPH-A560|SPH-A600|SPH-A620|SPH-A660|SPH-A700|SPH-A740|SPH-A760|SPH-A790|SPH-A800|SPH-A820|SPH-A840|SPH-A880|SPH-A900|SPH-A940|SPH-A960|SPH-D600|SPH-D700|SPH-D710|SPH-D720|SPH-I300|SPH-I325|SPH-I330|SPH-I350|SPH-I500|SPH-I600|SPH-I700|SPH-L700|SPH-M100|SPH-M220|SPH-M240|SPH-M300|SPH-M305|SPH-M320|SPH-M330|SPH-M350|SPH-M360|SPH-M370|SPH-M380|SPH-M510|SPH-M540|SPH-M550|SPH-M560|SPH-M570|SPH-M580|SPH-M610|SPH-M620|SPH-M630|SPH-M800|SPH-M810|SPH-M850|SPH-M900|SPH-M910|SPH-M920|SPH-M930|SPH-N100|SPH-N200|SPH-N240|SPH-N300|SPH-N400|SPH-Z400|SWC-E100|SCH-i909|GT-N7100|GT-N7105|SCH-I535|SM-N900A|SGH-I317|SGH-T999L|GT-S5360B|GT-I8262|GT-S6802|GT-S6312|GT-S6310|GT-S5312|GT-S5310|GT-I9105|GT-I8510|GT-S6790N|SM-G7105|SM-N9005|GT-S5301|GT-I9295|GT-I9195|SM-C101|GT-S7392|GT-S7560|GT-B7610|GT-I5510|GT-S7582|GT-S7530E|GT-I8750|SM-G9006V|SM-G9008V|SM-G9009D|SM-G900A|SM-G900D|SM-G900F|SM-G900H|SM-G900I|SM-G900J|SM-G900K|SM-G900L|SM-G900M|SM-G900P|SM-G900R4|SM-G900S|SM-G900T|SM-G900V|SM-G900W8|SHV-E160K|SCH-P709|SCH-P729|SM-T2558|GT-I9205|SM-G9350|SM-J120F|SM-G920F|SM-G920V|SM-G930F|SM-N910C",
        "LG": "\\bLG\\b;|LG[- ]?(C800|C900|E400|E610|E900|E-900|F160|F180K|F180L|F180S|730|855|L160|LS740|LS840|LS970|LU6200|MS690|MS695|MS770|MS840|MS870|MS910|P500|P700|P705|VM696|AS680|AS695|AX840|C729|E970|GS505|272|C395|E739BK|E960|L55C|L75C|LS696|LS860|P769BK|P350|P500|P509|P870|UN272|US730|VS840|VS950|LN272|LN510|LS670|LS855|LW690|MN270|MN510|P509|P769|P930|UN200|UN270|UN510|UN610|US670|US740|US760|UX265|UX840|VN271|VN530|VS660|VS700|VS740|VS750|VS910|VS920|VS930|VX9200|VX11000|AX840A|LW770|P506|P925|P999|E612|D955|D802|MS323)",
        "Sony": "SonyST|SonyLT|SonyEricsson|SonyEricssonLT15iv|LT18i|E10i|LT28h|LT26w|SonyEricssonMT27i|C5303|C6902|C6903|C6906|C6943|D2533",
        "Asus": "Asus.*Galaxy|PadFone.*Mobile",
        "NokiaLumia": "Lumia [0-9]{3,4}",
        "Micromax": "Micromax.*\\b(A210|A92|A88|A72|A111|A110Q|A115|A116|A110|A90S|A26|A51|A35|A54|A25|A27|A89|A68|A65|A57|A90)\\b",
        "Palm": "PalmSource|Palm",
        "Vertu": "Vertu|Vertu.*Ltd|Vertu.*Ascent|Vertu.*Ayxta|Vertu.*Constellation(F|Quest)?|Vertu.*Monika|Vertu.*Signature",
        "Pantech": "PANTECH|IM-A850S|IM-A840S|IM-A830L|IM-A830K|IM-A830S|IM-A820L|IM-A810K|IM-A810S|IM-A800S|IM-T100K|IM-A725L|IM-A780L|IM-A775C|IM-A770K|IM-A760S|IM-A750K|IM-A740S|IM-A730S|IM-A720L|IM-A710K|IM-A690L|IM-A690S|IM-A650S|IM-A630K|IM-A600S|VEGA PTL21|PT003|P8010|ADR910L|P6030|P6020|P9070|P4100|P9060|P5000|CDM8992|TXT8045|ADR8995|IS11PT|P2030|P6010|P8000|PT002|IS06|CDM8999|P9050|PT001|TXT8040|P2020|P9020|P2000|P7040|P7000|C790",
        "Fly": "IQ230|IQ444|IQ450|IQ440|IQ442|IQ441|IQ245|IQ256|IQ236|IQ255|IQ235|IQ245|IQ275|IQ240|IQ285|IQ280|IQ270|IQ260|IQ250",
        "Wiko": "KITE 4G|HIGHWAY|GETAWAY|STAIRWAY|DARKSIDE|DARKFULL|DARKNIGHT|DARKMOON|SLIDE|WAX 4G|RAINBOW|BLOOM|SUNSET|GOA(?!nna)|LENNY|BARRY|IGGY|OZZY|CINK FIVE|CINK PEAX|CINK PEAX 2|CINK SLIM|CINK SLIM 2|CINK +|CINK KING|CINK PEAX|CINK SLIM|SUBLIM",
        "iMobile": "i-mobile (IQ|i-STYLE|idea|ZAA|Hitz)",
        "SimValley": "\\b(SP-80|XT-930|SX-340|XT-930|SX-310|SP-360|SP60|SPT-800|SP-120|SPT-800|SP-140|SPX-5|SPX-8|SP-100|SPX-8|SPX-12)\\b",
        "Wolfgang": "AT-B24D|AT-AS50HD|AT-AS40W|AT-AS55HD|AT-AS45q2|AT-B26D|AT-AS50Q",
        "Alcatel": "Alcatel",
        "Nintendo": "Nintendo 3DS",
        "Amoi": "Amoi",
        "INQ": "INQ",
        "GenericPhone": "Tapatalk|PDA;|SAGEM|\\bmmp\\b|pocket|\\bpsp\\b|symbian|Smartphone|smartfon|treo|up.browser|up.link|vodafone|\\bwap\\b|nokia|Series40|Series60|S60|SonyEricsson|N900|MAUI.*WAP.*Browser"
    },
    "tablets": {
        "iPad": "iPad|iPad.*Mobile",
        "NexusTablet": "Android.*Nexus[\\s]+(7|9|10)",
        "SamsungTablet": "SAMSUNG.*Tablet|Galaxy.*Tab|SC-01C|GT-P1000|GT-P1003|GT-P1010|GT-P3105|GT-P6210|GT-P6800|GT-P6810|GT-P7100|GT-P7300|GT-P7310|GT-P7500|GT-P7510|SCH-I800|SCH-I815|SCH-I905|SGH-I957|SGH-I987|SGH-T849|SGH-T859|SGH-T869|SPH-P100|GT-P3100|GT-P3108|GT-P3110|GT-P5100|GT-P5110|GT-P6200|GT-P7320|GT-P7511|GT-N8000|GT-P8510|SGH-I497|SPH-P500|SGH-T779|SCH-I705|SCH-I915|GT-N8013|GT-P3113|GT-P5113|GT-P8110|GT-N8010|GT-N8005|GT-N8020|GT-P1013|GT-P6201|GT-P7501|GT-N5100|GT-N5105|GT-N5110|SHV-E140K|SHV-E140L|SHV-E140S|SHV-E150S|SHV-E230K|SHV-E230L|SHV-E230S|SHW-M180K|SHW-M180L|SHW-M180S|SHW-M180W|SHW-M300W|SHW-M305W|SHW-M380K|SHW-M380S|SHW-M380W|SHW-M430W|SHW-M480K|SHW-M480S|SHW-M480W|SHW-M485W|SHW-M486W|SHW-M500W|GT-I9228|SCH-P739|SCH-I925|GT-I9200|GT-P5200|GT-P5210|GT-P5210X|SM-T311|SM-T310|SM-T310X|SM-T210|SM-T210R|SM-T211|SM-P600|SM-P601|SM-P605|SM-P900|SM-P901|SM-T217|SM-T217A|SM-T217S|SM-P6000|SM-T3100|SGH-I467|XE500|SM-T110|GT-P5220|GT-I9200X|GT-N5110X|GT-N5120|SM-P905|SM-T111|SM-T2105|SM-T315|SM-T320|SM-T320X|SM-T321|SM-T520|SM-T525|SM-T530NU|SM-T230NU|SM-T330NU|SM-T900|XE500T1C|SM-P605V|SM-P905V|SM-T337V|SM-T537V|SM-T707V|SM-T807V|SM-P600X|SM-P900X|SM-T210X|SM-T230|SM-T230X|SM-T325|GT-P7503|SM-T531|SM-T330|SM-T530|SM-T705|SM-T705C|SM-T535|SM-T331|SM-T800|SM-T700|SM-T537|SM-T807|SM-P907A|SM-T337A|SM-T537A|SM-T707A|SM-T807A|SM-T237|SM-T807P|SM-P607T|SM-T217T|SM-T337T|SM-T807T|SM-T116NQ|SM-P550|SM-T350|SM-T550|SM-T9000|SM-P9000|SM-T705Y|SM-T805|GT-P3113|SM-T710|SM-T810|SM-T815|SM-T360|SM-T533|SM-T113|SM-T335|SM-T715|SM-T560|SM-T670|SM-T677|SM-T377|SM-T567|SM-T357T|SM-T555|SM-T561|SM-T713|SM-T719|SM-T813|SM-T819|SM-T580|SM-T355Y|SM-T280|SM-T817A|SM-T820|SM-W700|SM-P580|SM-T587",
        "Kindle": "Kindle|Silk.*Accelerated|Android.*\\b(KFOT|KFTT|KFJWI|KFJWA|KFOTE|KFSOWI|KFTHWI|KFTHWA|KFAPWI|KFAPWA|WFJWAE|KFSAWA|KFSAWI|KFASWI|KFARWI|KFFOWI|KFGIWI|KFMEWI)\\b|Android.*Silk\/[0-9.]+ like Chrome\/[0-9.]+ (?!Mobile)",
        "SurfaceTablet": "Windows NT [0-9.]+; ARM;.*(Tablet|ARMBJS)",
        "HPTablet": "HP Slate (7|8|10)|HP ElitePad 900|hp-tablet|EliteBook.*Touch|HP 8|Slate 21|HP SlateBook 10",
        "AsusTablet": "^.*PadFone((?!Mobile).)*$|Transformer|TF101|TF101G|TF300T|TF300TG|TF300TL|TF700T|TF700KL|TF701T|TF810C|ME171|ME301T|ME302C|ME371MG|ME370T|ME372MG|ME172V|ME173X|ME400C|Slider SL101|\\bK00F\\b|\\bK00C\\b|\\bK00E\\b|\\bK00L\\b|TX201LA|ME176C|ME102A|\\bM80TA\\b|ME372CL|ME560CG|ME372CG|ME302KL| K010 | K011 | K017 | K01E |ME572C|ME103K|ME170C|ME171C|\\bME70C\\b|ME581C|ME581CL|ME8510C|ME181C|P01Y|PO1MA|P01Z",
        "BlackBerryTablet": "PlayBook|RIM Tablet",
        "HTCtablet": "HTC_Flyer_P512|HTC Flyer|HTC Jetstream|HTC-P715a|HTC EVO View 4G|PG41200|PG09410",
        "MotorolaTablet": "xoom|sholest|MZ615|MZ605|MZ505|MZ601|MZ602|MZ603|MZ604|MZ606|MZ607|MZ608|MZ609|MZ615|MZ616|MZ617",
        "NookTablet": "Android.*Nook|NookColor|nook browser|BNRV200|BNRV200A|BNTV250|BNTV250A|BNTV400|BNTV600|LogicPD Zoom2",
        "AcerTablet": "Android.*; \\b(A100|A101|A110|A200|A210|A211|A500|A501|A510|A511|A700|A701|W500|W500P|W501|W501P|W510|W511|W700|G100|G100W|B1-A71|B1-710|B1-711|A1-810|A1-811|A1-830)\\b|W3-810|\\bA3-A10\\b|\\bA3-A11\\b|\\bA3-A20\\b|\\bA3-A30",
        "ToshibaTablet": "Android.*(AT100|AT105|AT200|AT205|AT270|AT275|AT300|AT305|AT1S5|AT500|AT570|AT700|AT830)|TOSHIBA.*FOLIO",
        "LGTablet": "\\bL-06C|LG-V909|LG-V900|LG-V700|LG-V510|LG-V500|LG-V410|LG-V400|LG-VK810\\b",
        "FujitsuTablet": "Android.*\\b(F-01D|F-02F|F-05E|F-10D|M532|Q572)\\b",
        "PrestigioTablet": "PMP3170B|PMP3270B|PMP3470B|PMP7170B|PMP3370B|PMP3570C|PMP5870C|PMP3670B|PMP5570C|PMP5770D|PMP3970B|PMP3870C|PMP5580C|PMP5880D|PMP5780D|PMP5588C|PMP7280C|PMP7280C3G|PMP7280|PMP7880D|PMP5597D|PMP5597|PMP7100D|PER3464|PER3274|PER3574|PER3884|PER5274|PER5474|PMP5097CPRO|PMP5097|PMP7380D|PMP5297C|PMP5297C_QUAD|PMP812E|PMP812E3G|PMP812F|PMP810E|PMP880TD|PMT3017|PMT3037|PMT3047|PMT3057|PMT7008|PMT5887|PMT5001|PMT5002",
        "LenovoTablet": "Lenovo TAB|Idea(Tab|Pad)( A1|A10| K1|)|ThinkPad([ ]+)?Tablet|YT3-X90L|YT3-X90F|YT3-X90X|Lenovo.*(S2109|S2110|S5000|S6000|K3011|A3000|A3500|A1000|A2107|A2109|A1107|A5500|A7600|B6000|B8000|B8080)(-|)(FL|F|HV|H|)",
        "DellTablet": "Venue 11|Venue 8|Venue 7|Dell Streak 10|Dell Streak 7",
        "YarvikTablet": "Android.*\\b(TAB210|TAB211|TAB224|TAB250|TAB260|TAB264|TAB310|TAB360|TAB364|TAB410|TAB411|TAB420|TAB424|TAB450|TAB460|TAB461|TAB464|TAB465|TAB467|TAB468|TAB07-100|TAB07-101|TAB07-150|TAB07-151|TAB07-152|TAB07-200|TAB07-201-3G|TAB07-210|TAB07-211|TAB07-212|TAB07-214|TAB07-220|TAB07-400|TAB07-485|TAB08-150|TAB08-200|TAB08-201-3G|TAB08-201-30|TAB09-100|TAB09-211|TAB09-410|TAB10-150|TAB10-201|TAB10-211|TAB10-400|TAB10-410|TAB13-201|TAB274EUK|TAB275EUK|TAB374EUK|TAB462EUK|TAB474EUK|TAB9-200)\\b",
        "MedionTablet": "Android.*\\bOYO\\b|LIFE.*(P9212|P9514|P9516|S9512)|LIFETAB",
        "ArnovaTablet": "97G4|AN10G2|AN7bG3|AN7fG3|AN8G3|AN8cG3|AN7G3|AN9G3|AN7dG3|AN7dG3ST|AN7dG3ChildPad|AN10bG3|AN10bG3DT|AN9G2",
        "IntensoTablet": "INM8002KP|INM1010FP|INM805ND|Intenso Tab|TAB1004",
        "IRUTablet": "M702pro",
        "MegafonTablet": "MegaFon V9|\\bZTE V9\\b|Android.*\\bMT7A\\b",
        "EbodaTablet": "E-Boda (Supreme|Impresspeed|Izzycomm|Essential)",
        "AllViewTablet": "Allview.*(Viva|Alldro|City|Speed|All TV|Frenzy|Quasar|Shine|TX1|AX1|AX2)",
        "ArchosTablet": "\\b(101G9|80G9|A101IT)\\b|Qilive 97R|Archos5|\\bARCHOS (70|79|80|90|97|101|FAMILYPAD|)(b|c|)(G10| Cobalt| TITANIUM(HD|)| Xenon| Neon|XSK| 2| XS 2| PLATINUM| CARBON|GAMEPAD)\\b",
        "AinolTablet": "NOVO7|NOVO8|NOVO10|Novo7Aurora|Novo7Basic|NOVO7PALADIN|novo9-Spark",
        "NokiaLumiaTablet": "Lumia 2520",
        "SonyTablet": "Sony.*Tablet|Xperia Tablet|Sony Tablet S|SO-03E|SGPT12|SGPT13|SGPT114|SGPT121|SGPT122|SGPT123|SGPT111|SGPT112|SGPT113|SGPT131|SGPT132|SGPT133|SGPT211|SGPT212|SGPT213|SGP311|SGP312|SGP321|EBRD1101|EBRD1102|EBRD1201|SGP351|SGP341|SGP511|SGP512|SGP521|SGP541|SGP551|SGP621|SGP612|SOT31",
        "PhilipsTablet": "\\b(PI2010|PI3000|PI3100|PI3105|PI3110|PI3205|PI3210|PI3900|PI4010|PI7000|PI7100)\\b",
        "CubeTablet": "Android.*(K8GT|U9GT|U10GT|U16GT|U17GT|U18GT|U19GT|U20GT|U23GT|U30GT)|CUBE U8GT",
        "CobyTablet": "MID1042|MID1045|MID1125|MID1126|MID7012|MID7014|MID7015|MID7034|MID7035|MID7036|MID7042|MID7048|MID7127|MID8042|MID8048|MID8127|MID9042|MID9740|MID9742|MID7022|MID7010",
        "MIDTablet": "M9701|M9000|M9100|M806|M1052|M806|T703|MID701|MID713|MID710|MID727|MID760|MID830|MID728|MID933|MID125|MID810|MID732|MID120|MID930|MID800|MID731|MID900|MID100|MID820|MID735|MID980|MID130|MID833|MID737|MID960|MID135|MID860|MID736|MID140|MID930|MID835|MID733|MID4X10",
        "MSITablet": "MSI \\b(Primo 73K|Primo 73L|Primo 81L|Primo 77|Primo 93|Primo 75|Primo 76|Primo 73|Primo 81|Primo 91|Primo 90|Enjoy 71|Enjoy 7|Enjoy 10)\\b",
        "SMiTTablet": "Android.*(\\bMID\\b|MID-560|MTV-T1200|MTV-PND531|MTV-P1101|MTV-PND530)",
        "RockChipTablet": "Android.*(RK2818|RK2808A|RK2918|RK3066)|RK2738|RK2808A",
        "FlyTablet": "IQ310|Fly Vision",
        "bqTablet": "Android.*(bq)?.*(Elcano|Curie|Edison|Maxwell|Kepler|Pascal|Tesla|Hypatia|Platon|Newton|Livingstone|Cervantes|Avant|Aquaris [E|M]10)|Maxwell.*Lite|Maxwell.*Plus",
        "HuaweiTablet": "MediaPad|MediaPad 7 Youth|IDEOS S7|S7-201c|S7-202u|S7-101|S7-103|S7-104|S7-105|S7-106|S7-201|S7-Slim",
        "NecTablet": "\\bN-06D|\\bN-08D",
        "PantechTablet": "Pantech.*P4100",
        "BronchoTablet": "Broncho.*(N701|N708|N802|a710)",
        "VersusTablet": "TOUCHPAD.*[78910]|\\bTOUCHTAB\\b",
        "ZyncTablet": "z1000|Z99 2G|z99|z930|z999|z990|z909|Z919|z900",
        "PositivoTablet": "TB07STA|TB10STA|TB07FTA|TB10FTA",
        "NabiTablet": "Android.*\\bNabi",
        "KoboTablet": "Kobo Touch|\\bK080\\b|\\bVox\\b Build|\\bArc\\b Build",
        "DanewTablet": "DSlide.*\\b(700|701R|702|703R|704|802|970|971|972|973|974|1010|1012)\\b",
        "TexetTablet": "NaviPad|TB-772A|TM-7045|TM-7055|TM-9750|TM-7016|TM-7024|TM-7026|TM-7041|TM-7043|TM-7047|TM-8041|TM-9741|TM-9747|TM-9748|TM-9751|TM-7022|TM-7021|TM-7020|TM-7011|TM-7010|TM-7023|TM-7025|TM-7037W|TM-7038W|TM-7027W|TM-9720|TM-9725|TM-9737W|TM-1020|TM-9738W|TM-9740|TM-9743W|TB-807A|TB-771A|TB-727A|TB-725A|TB-719A|TB-823A|TB-805A|TB-723A|TB-715A|TB-707A|TB-705A|TB-709A|TB-711A|TB-890HD|TB-880HD|TB-790HD|TB-780HD|TB-770HD|TB-721HD|TB-710HD|TB-434HD|TB-860HD|TB-840HD|TB-760HD|TB-750HD|TB-740HD|TB-730HD|TB-722HD|TB-720HD|TB-700HD|TB-500HD|TB-470HD|TB-431HD|TB-430HD|TB-506|TB-504|TB-446|TB-436|TB-416|TB-146SE|TB-126SE",
        "PlaystationTablet": "Playstation.*(Portable|Vita)",
        "TrekstorTablet": "ST10416-1|VT10416-1|ST70408-1|ST702xx-1|ST702xx-2|ST80208|ST97216|ST70104-2|VT10416-2|ST10216-2A|SurfTab",
        "PyleAudioTablet": "\\b(PTBL10CEU|PTBL10C|PTBL72BC|PTBL72BCEU|PTBL7CEU|PTBL7C|PTBL92BC|PTBL92BCEU|PTBL9CEU|PTBL9CUK|PTBL9C)\\b",
        "AdvanTablet": "Android.* \\b(E3A|T3X|T5C|T5B|T3E|T3C|T3B|T1J|T1F|T2A|T1H|T1i|E1C|T1-E|T5-A|T4|E1-B|T2Ci|T1-B|T1-D|O1-A|E1-A|T1-A|T3A|T4i)\\b ",
        "DanyTechTablet": "Genius Tab G3|Genius Tab S2|Genius Tab Q3|Genius Tab G4|Genius Tab Q4|Genius Tab G-II|Genius TAB GII|Genius TAB GIII|Genius Tab S1",
        "GalapadTablet": "Android.*\\bG1\\b",
        "MicromaxTablet": "Funbook|Micromax.*\\b(P250|P560|P360|P362|P600|P300|P350|P500|P275)\\b",
        "KarbonnTablet": "Android.*\\b(A39|A37|A34|ST8|ST10|ST7|Smart Tab3|Smart Tab2)\\b",
        "AllFineTablet": "Fine7 Genius|Fine7 Shine|Fine7 Air|Fine8 Style|Fine9 More|Fine10 Joy|Fine11 Wide",
        "PROSCANTablet": "\\b(PEM63|PLT1023G|PLT1041|PLT1044|PLT1044G|PLT1091|PLT4311|PLT4311PL|PLT4315|PLT7030|PLT7033|PLT7033D|PLT7035|PLT7035D|PLT7044K|PLT7045K|PLT7045KB|PLT7071KG|PLT7072|PLT7223G|PLT7225G|PLT7777G|PLT7810K|PLT7849G|PLT7851G|PLT7852G|PLT8015|PLT8031|PLT8034|PLT8036|PLT8080K|PLT8082|PLT8088|PLT8223G|PLT8234G|PLT8235G|PLT8816K|PLT9011|PLT9045K|PLT9233G|PLT9735|PLT9760G|PLT9770G)\\b",
        "YONESTablet": "BQ1078|BC1003|BC1077|RK9702|BC9730|BC9001|IT9001|BC7008|BC7010|BC708|BC728|BC7012|BC7030|BC7027|BC7026",
        "ChangJiaTablet": "TPC7102|TPC7103|TPC7105|TPC7106|TPC7107|TPC7201|TPC7203|TPC7205|TPC7210|TPC7708|TPC7709|TPC7712|TPC7110|TPC8101|TPC8103|TPC8105|TPC8106|TPC8203|TPC8205|TPC8503|TPC9106|TPC9701|TPC97101|TPC97103|TPC97105|TPC97106|TPC97111|TPC97113|TPC97203|TPC97603|TPC97809|TPC97205|TPC10101|TPC10103|TPC10106|TPC10111|TPC10203|TPC10205|TPC10503",
        "GUTablet": "TX-A1301|TX-M9002|Q702|kf026",
        "PointOfViewTablet": "TAB-P506|TAB-navi-7-3G-M|TAB-P517|TAB-P-527|TAB-P701|TAB-P703|TAB-P721|TAB-P731N|TAB-P741|TAB-P825|TAB-P905|TAB-P925|TAB-PR945|TAB-PL1015|TAB-P1025|TAB-PI1045|TAB-P1325|TAB-PROTAB[0-9]+|TAB-PROTAB25|TAB-PROTAB26|TAB-PROTAB27|TAB-PROTAB26XL|TAB-PROTAB2-IPS9|TAB-PROTAB30-IPS9|TAB-PROTAB25XXL|TAB-PROTAB26-IPS10|TAB-PROTAB30-IPS10",
        "OvermaxTablet": "OV-(SteelCore|NewBase|Basecore|Baseone|Exellen|Quattor|EduTab|Solution|ACTION|BasicTab|TeddyTab|MagicTab|Stream|TB-08|TB-09)",
        "HCLTablet": "HCL.*Tablet|Connect-3G-2.0|Connect-2G-2.0|ME Tablet U1|ME Tablet U2|ME Tablet G1|ME Tablet X1|ME Tablet Y2|ME Tablet Sync",
        "DPSTablet": "DPS Dream 9|DPS Dual 7",
        "VistureTablet": "V97 HD|i75 3G|Visture V4( HD)?|Visture V5( HD)?|Visture V10",
        "CrestaTablet": "CTP(-)?810|CTP(-)?818|CTP(-)?828|CTP(-)?838|CTP(-)?888|CTP(-)?978|CTP(-)?980|CTP(-)?987|CTP(-)?988|CTP(-)?989",
        "MediatekTablet": "\\bMT8125|MT8389|MT8135|MT8377\\b",
        "ConcordeTablet": "Concorde([ ]+)?Tab|ConCorde ReadMan",
        "GoCleverTablet": "GOCLEVER TAB|A7GOCLEVER|M1042|M7841|M742|R1042BK|R1041|TAB A975|TAB A7842|TAB A741|TAB A741L|TAB M723G|TAB M721|TAB A1021|TAB I921|TAB R721|TAB I720|TAB T76|TAB R70|TAB R76.2|TAB R106|TAB R83.2|TAB M813G|TAB I721|GCTA722|TAB I70|TAB I71|TAB S73|TAB R73|TAB R74|TAB R93|TAB R75|TAB R76.1|TAB A73|TAB A93|TAB A93.2|TAB T72|TAB R83|TAB R974|TAB R973|TAB A101|TAB A103|TAB A104|TAB A104.2|R105BK|M713G|A972BK|TAB A971|TAB R974.2|TAB R104|TAB R83.3|TAB A1042",
        "ModecomTablet": "FreeTAB 9000|FreeTAB 7.4|FreeTAB 7004|FreeTAB 7800|FreeTAB 2096|FreeTAB 7.5|FreeTAB 1014|FreeTAB 1001 |FreeTAB 8001|FreeTAB 9706|FreeTAB 9702|FreeTAB 7003|FreeTAB 7002|FreeTAB 1002|FreeTAB 7801|FreeTAB 1331|FreeTAB 1004|FreeTAB 8002|FreeTAB 8014|FreeTAB 9704|FreeTAB 1003",
        "VoninoTablet": "\\b(Argus[ _]?S|Diamond[ _]?79HD|Emerald[ _]?78E|Luna[ _]?70C|Onyx[ _]?S|Onyx[ _]?Z|Orin[ _]?HD|Orin[ _]?S|Otis[ _]?S|SpeedStar[ _]?S|Magnet[ _]?M9|Primus[ _]?94[ _]?3G|Primus[ _]?94HD|Primus[ _]?QS|Android.*\\bQ8\\b|Sirius[ _]?EVO[ _]?QS|Sirius[ _]?QS|Spirit[ _]?S)\\b",
        "ECSTablet": "V07OT2|TM105A|S10OT1|TR10CS1",
        "StorexTablet": "eZee[_']?(Tab|Go)[0-9]+|TabLC7|Looney Tunes Tab",
        "VodafoneTablet": "SmartTab([ ]+)?[0-9]+|SmartTabII10|SmartTabII7|VF-1497",
        "EssentielBTablet": "Smart[ ']?TAB[ ]+?[0-9]+|Family[ ']?TAB2",
        "RossMoorTablet": "RM-790|RM-997|RMD-878G|RMD-974R|RMT-705A|RMT-701|RME-601|RMT-501|RMT-711",
        "iMobileTablet": "i-mobile i-note",
        "TolinoTablet": "tolino tab [0-9.]+|tolino shine",
        "AudioSonicTablet": "\\bC-22Q|T7-QC|T-17B|T-17P\\b",
        "AMPETablet": "Android.* A78 ",
        "SkkTablet": "Android.* (SKYPAD|PHOENIX|CYCLOPS)",
        "TecnoTablet": "TECNO P9",
        "JXDTablet": "Android.* \\b(F3000|A3300|JXD5000|JXD3000|JXD2000|JXD300B|JXD300|S5800|S7800|S602b|S5110b|S7300|S5300|S602|S603|S5100|S5110|S601|S7100a|P3000F|P3000s|P101|P200s|P1000m|P200m|P9100|P1000s|S6600b|S908|P1000|P300|S18|S6600|S9100)\\b",
        "iJoyTablet": "Tablet (Spirit 7|Essentia|Galatea|Fusion|Onix 7|Landa|Titan|Scooby|Deox|Stella|Themis|Argon|Unique 7|Sygnus|Hexen|Finity 7|Cream|Cream X2|Jade|Neon 7|Neron 7|Kandy|Scape|Saphyr 7|Rebel|Biox|Rebel|Rebel 8GB|Myst|Draco 7|Myst|Tab7-004|Myst|Tadeo Jones|Tablet Boing|Arrow|Draco Dual Cam|Aurix|Mint|Amity|Revolution|Finity 9|Neon 9|T9w|Amity 4GB Dual Cam|Stone 4GB|Stone 8GB|Andromeda|Silken|X2|Andromeda II|Halley|Flame|Saphyr 9,7|Touch 8|Planet|Triton|Unique 10|Hexen 10|Memphis 4GB|Memphis 8GB|Onix 10)",
        "FX2Tablet": "FX2 PAD7|FX2 PAD10",
        "XoroTablet": "KidsPAD 701|PAD[ ]?712|PAD[ ]?714|PAD[ ]?716|PAD[ ]?717|PAD[ ]?718|PAD[ ]?720|PAD[ ]?721|PAD[ ]?722|PAD[ ]?790|PAD[ ]?792|PAD[ ]?900|PAD[ ]?9715D|PAD[ ]?9716DR|PAD[ ]?9718DR|PAD[ ]?9719QR|PAD[ ]?9720QR|TelePAD1030|Telepad1032|TelePAD730|TelePAD731|TelePAD732|TelePAD735Q|TelePAD830|TelePAD9730|TelePAD795|MegaPAD 1331|MegaPAD 1851|MegaPAD 2151",
        "ViewsonicTablet": "ViewPad 10pi|ViewPad 10e|ViewPad 10s|ViewPad E72|ViewPad7|ViewPad E100|ViewPad 7e|ViewSonic VB733|VB100a",
        "OdysTablet": "LOOX|XENO10|ODYS[ -](Space|EVO|Xpress|NOON)|\\bXELIO\\b|Xelio10Pro|XELIO7PHONETAB|XELIO10EXTREME|XELIOPT2|NEO_QUAD10",
        "CaptivaTablet": "CAPTIVA PAD",
        "IconbitTablet": "NetTAB|NT-3702|NT-3702S|NT-3702S|NT-3603P|NT-3603P|NT-0704S|NT-0704S|NT-3805C|NT-3805C|NT-0806C|NT-0806C|NT-0909T|NT-0909T|NT-0907S|NT-0907S|NT-0902S|NT-0902S",
        "TeclastTablet": "T98 4G|\\bP80\\b|\\bX90HD\\b|X98 Air|X98 Air 3G|\\bX89\\b|P80 3G|\\bX80h\\b|P98 Air|\\bX89HD\\b|P98 3G|\\bP90HD\\b|P89 3G|X98 3G|\\bP70h\\b|P79HD 3G|G18d 3G|\\bP79HD\\b|\\bP89s\\b|\\bA88\\b|\\bP10HD\\b|\\bP19HD\\b|G18 3G|\\bP78HD\\b|\\bA78\\b|\\bP75\\b|G17s 3G|G17h 3G|\\bP85t\\b|\\bP90\\b|\\bP11\\b|\\bP98t\\b|\\bP98HD\\b|\\bG18d\\b|\\bP85s\\b|\\bP11HD\\b|\\bP88s\\b|\\bA80HD\\b|\\bA80se\\b|\\bA10h\\b|\\bP89\\b|\\bP78s\\b|\\bG18\\b|\\bP85\\b|\\bA70h\\b|\\bA70\\b|\\bG17\\b|\\bP18\\b|\\bA80s\\b|\\bA11s\\b|\\bP88HD\\b|\\bA80h\\b|\\bP76s\\b|\\bP76h\\b|\\bP98\\b|\\bA10HD\\b|\\bP78\\b|\\bP88\\b|\\bA11\\b|\\bA10t\\b|\\bP76a\\b|\\bP76t\\b|\\bP76e\\b|\\bP85HD\\b|\\bP85a\\b|\\bP86\\b|\\bP75HD\\b|\\bP76v\\b|\\bA12\\b|\\bP75a\\b|\\bA15\\b|\\bP76Ti\\b|\\bP81HD\\b|\\bA10\\b|\\bT760VE\\b|\\bT720HD\\b|\\bP76\\b|\\bP73\\b|\\bP71\\b|\\bP72\\b|\\bT720SE\\b|\\bC520Ti\\b|\\bT760\\b|\\bT720VE\\b|T720-3GE|T720-WiFi",
        "OndaTablet": "\\b(V975i|Vi30|VX530|V701|Vi60|V701s|Vi50|V801s|V719|Vx610w|VX610W|V819i|Vi10|VX580W|Vi10|V711s|V813|V811|V820w|V820|Vi20|V711|VI30W|V712|V891w|V972|V819w|V820w|Vi60|V820w|V711|V813s|V801|V819|V975s|V801|V819|V819|V818|V811|V712|V975m|V101w|V961w|V812|V818|V971|V971s|V919|V989|V116w|V102w|V973|Vi40)\\b[\\s]+",
        "JaytechTablet": "TPC-PA762",
        "BlaupunktTablet": "Endeavour 800NG|Endeavour 1010",
        "DigmaTablet": "\\b(iDx10|iDx9|iDx8|iDx7|iDxD7|iDxD8|iDsQ8|iDsQ7|iDsQ8|iDsD10|iDnD7|3TS804H|iDsQ11|iDj7|iDs10)\\b",
        "EvolioTablet": "ARIA_Mini_wifi|Aria[ _]Mini|Evolio X10|Evolio X7|Evolio X8|\\bEvotab\\b|\\bNeura\\b",
        "LavaTablet": "QPAD E704|\\bIvoryS\\b|E-TAB IVORY|\\bE-TAB\\b",
        "AocTablet": "MW0811|MW0812|MW0922|MTK8382|MW1031|MW0831|MW0821|MW0931|MW0712",
        "MpmanTablet": "MP11 OCTA|MP10 OCTA|MPQC1114|MPQC1004|MPQC994|MPQC974|MPQC973|MPQC804|MPQC784|MPQC780|\\bMPG7\\b|MPDCG75|MPDCG71|MPDC1006|MP101DC|MPDC9000|MPDC905|MPDC706HD|MPDC706|MPDC705|MPDC110|MPDC100|MPDC99|MPDC97|MPDC88|MPDC8|MPDC77|MP709|MID701|MID711|MID170|MPDC703|MPQC1010",
        "CelkonTablet": "CT695|CT888|CT[\\s]?910|CT7 Tab|CT9 Tab|CT3 Tab|CT2 Tab|CT1 Tab|C820|C720|\\bCT-1\\b",
        "WolderTablet": "miTab \\b(DIAMOND|SPACE|BROOKLYN|NEO|FLY|MANHATTAN|FUNK|EVOLUTION|SKY|GOCAR|IRON|GENIUS|POP|MINT|EPSILON|BROADWAY|JUMP|HOP|LEGEND|NEW AGE|LINE|ADVANCE|FEEL|FOLLOW|LIKE|LINK|LIVE|THINK|FREEDOM|CHICAGO|CLEVELAND|BALTIMORE-GH|IOWA|BOSTON|SEATTLE|PHOENIX|DALLAS|IN 101|MasterChef)\\b",
        "MiTablet": "\\bMI PAD\\b|\\bHM NOTE 1W\\b",
        "NibiruTablet": "Nibiru M1|Nibiru Jupiter One",
        "NexoTablet": "NEXO NOVA|NEXO 10|NEXO AVIO|NEXO FREE|NEXO GO|NEXO EVO|NEXO 3G|NEXO SMART|NEXO KIDDO|NEXO MOBI",
        "LeaderTablet": "TBLT10Q|TBLT10I|TBL-10WDKB|TBL-10WDKBO2013|TBL-W230V2|TBL-W450|TBL-W500|SV572|TBLT7I|TBA-AC7-8G|TBLT79|TBL-8W16|TBL-10W32|TBL-10WKB|TBL-W100",
        "UbislateTablet": "UbiSlate[\\s]?7C",
        "PocketBookTablet": "Pocketbook",
        "KocasoTablet": "\\b(TB-1207)\\b",
        "HisenseTablet": "\\b(F5281|E2371)\\b",
        "Hudl": "Hudl HT7S3|Hudl 2",
        "TelstraTablet": "T-Hub2",
        "GenericTablet": "Android.*\\b97D\\b|Tablet(?!.*PC)|BNTV250A|MID-WCDMA|LogicPD Zoom2|\\bA7EB\\b|CatNova8|A1_07|CT704|CT1002|\\bM721\\b|rk30sdk|\\bEVOTAB\\b|M758A|ET904|ALUMIUM10|Smartfren Tab|Endeavour 1010|Tablet-PC-4|Tagi Tab|\\bM6pro\\b|CT1020W|arc 10HD|\\bTP750\\b"
    },
    "oss": {
        "AndroidOS": "Android",
        "BlackBerryOS": "blackberry|\\bBB10\\b|rim tablet os",
        "PalmOS": "PalmOS|avantgo|blazer|elaine|hiptop|palm|plucker|xiino",
        "SymbianOS": "Symbian|SymbOS|Series60|Series40|SYB-[0-9]+|\\bS60\\b",
        "WindowsMobileOS": "Windows CE.*(PPC|Smartphone|Mobile|[0-9]{3}x[0-9]{3})|Window Mobile|Windows Phone [0-9.]+|WCE;",
        "WindowsPhoneOS": "Windows Phone 10.0|Windows Phone 8.1|Windows Phone 8.0|Windows Phone OS|XBLWP7|ZuneWP7|Windows NT 6.[23]; ARM;",
        "iOS": "\\biPhone.*Mobile|\\biPod|\\biPad",
        "MeeGoOS": "MeeGo",
        "MaemoOS": "Maemo",
        "JavaOS": "J2ME\/|\\bMIDP\\b|\\bCLDC\\b",
        "webOS": "webOS|hpwOS",
        "badaOS": "\\bBada\\b",
        "BREWOS": "BREW"
    },
    "uas": {
        "Chrome": "\\bCrMo\\b|CriOS|Android.*Chrome\/[.0-9]* (Mobile)?",
        "Dolfin": "\\bDolfin\\b",
        "Opera": "Opera.*Mini|Opera.*Mobi|Android.*Opera|Mobile.*OPR\/[0-9.]+|Coast\/[0-9.]+",
        "Skyfire": "Skyfire",
        "Edge": "Mobile Safari\/[.0-9]* Edge",
        "IE": "IEMobile|MSIEMobile",
        "Firefox": "fennec|firefox.*maemo|(Mobile|Tablet).*Firefox|Firefox.*Mobile|FxiOS",
        "Bolt": "bolt",
        "TeaShark": "teashark",
        "Blazer": "Blazer",
        "Safari": "Version.*Mobile.*Safari|Safari.*Mobile|MobileSafari",
        "UCBrowser": "UC.*Browser|UCWEB",
        "baiduboxapp": "baiduboxapp",
        "baidubrowser": "baidubrowser",
        "DiigoBrowser": "DiigoBrowser",
        "Puffin": "Puffin",
        "Mercury": "\\bMercury\\b",
        "ObigoBrowser": "Obigo",
        "NetFront": "NF-Browser",
        "GenericBrowser": "NokiaBrowser|OviBrowser|OneBrowser|TwonkyBeamBrowser|SEMC.*Browser|FlyFlow|Minimo|NetFront|Novarra-Vision|MQQBrowser|MicroMessenger",
        "PaleMoon": "Android.*PaleMoon|Mobile.*PaleMoon"
    },
    "props": {
        "Mobile": "Mobile\/[VER]",
        "Build": "Build\/[VER]",
        "Version": "Version\/[VER]",
        "VendorID": "VendorID\/[VER]",
        "iPad": "iPad.*CPU[a-z ]+[VER]",
        "iPhone": "iPhone.*CPU[a-z ]+[VER]",
        "iPod": "iPod.*CPU[a-z ]+[VER]",
        "Kindle": "Kindle\/[VER]",
        "Chrome": [
            "Chrome\/[VER]",
            "CriOS\/[VER]",
            "CrMo\/[VER]"
        ],
        "Coast": [
            "Coast\/[VER]"
        ],
        "Dolfin": "Dolfin\/[VER]",
        "Firefox": [
            "Firefox\/[VER]",
            "FxiOS\/[VER]"
        ],
        "Fennec": "Fennec\/[VER]",
        "Edge": "Edge\/[VER]",
        "IE": [
            "IEMobile\/[VER];",
            "IEMobile [VER]",
            "MSIE [VER];",
            "Trident\/[0-9.]+;.*rv:[VER]"
        ],
        "NetFront": "NetFront\/[VER]",
        "NokiaBrowser": "NokiaBrowser\/[VER]",
        "Opera": [
            " OPR\/[VER]",
            "Opera Mini\/[VER]",
            "Version\/[VER]"
        ],
        "Opera Mini": "Opera Mini\/[VER]",
        "Opera Mobi": "Version\/[VER]",
        "UC Browser": "UC Browser[VER]",
        "MQQBrowser": "MQQBrowser\/[VER]",
        "MicroMessenger": "MicroMessenger\/[VER]",
        "baiduboxapp": "baiduboxapp\/[VER]",
        "baidubrowser": "baidubrowser\/[VER]",
        "SamsungBrowser": "SamsungBrowser\/[VER]",
        "Iron": "Iron\/[VER]",
        "Safari": [
            "Version\/[VER]",
            "Safari\/[VER]"
        ],
        "Skyfire": "Skyfire\/[VER]",
        "Tizen": "Tizen\/[VER]",
        "Webkit": "webkit[ \/][VER]",
        "PaleMoon": "PaleMoon\/[VER]",
        "Gecko": "Gecko\/[VER]",
        "Trident": "Trident\/[VER]",
        "Presto": "Presto\/[VER]",
        "Goanna": "Goanna\/[VER]",
        "iOS": " \\bi?OS\\b [VER][ ;]{1}",
        "Android": "Android [VER]",
        "BlackBerry": [
            "BlackBerry[\\w]+\/[VER]",
            "BlackBerry.*Version\/[VER]",
            "Version\/[VER]"
        ],
        "BREW": "BREW [VER]",
        "Java": "Java\/[VER]",
        "Windows Phone OS": [
            "Windows Phone OS [VER]",
            "Windows Phone [VER]"
        ],
        "Windows Phone": "Windows Phone [VER]",
        "Windows CE": "Windows CE\/[VER]",
        "Windows NT": "Windows NT [VER]",
        "Symbian": [
            "SymbianOS\/[VER]",
            "Symbian\/[VER]"
        ],
        "webOS": [
            "webOS\/[VER]",
            "hpwOS\/[VER];"
        ]
    },
    "utils": {
        "Bot": "Googlebot|facebookexternalhit|AdsBot-Google|Google Keyword Suggestion|Facebot|YandexBot|YandexMobileBot|bingbot|ia_archiver|AhrefsBot|Ezooms|GSLFbot|WBSearchBot|Twitterbot|TweetmemeBot|Twikle|PaperLiBot|Wotbox|UnwindFetchor|Exabot|MJ12bot|YandexImages|TurnitinBot|Pingdom",
        "MobileBot": "Googlebot-Mobile|AdsBot-Google-Mobile|YahooSeeker\/M1A1-R2D2",
        "DesktopMode": "WPDesktop",
        "TV": "SonyDTV|HbbTV",
        "WebKit": "(webkit)[ \/]([\\w.]+)",
        "Console": "\\b(Nintendo|Nintendo WiiU|Nintendo 3DS|PLAYSTATION|Xbox)\\b",
        "Watch": "SM-V700"
    }
};

    // following patterns come from http://detectmobilebrowsers.com/
    impl.detectMobileBrowsers = {
        fullPattern: /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i,
        shortPattern: /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i,
        tabletPattern: /android|ipad|playbook|silk/i
    };

    var hasOwnProp = Object.prototype.hasOwnProperty,
        isArray;

    impl.FALLBACK_PHONE = 'UnknownPhone';
    impl.FALLBACK_TABLET = 'UnknownTablet';
    impl.FALLBACK_MOBILE = 'UnknownMobile';

    isArray = ('isArray' in Array) ?
        Array.isArray : function (value) { return Object.prototype.toString.call(value) === '[object Array]'; };

    function equalIC(a, b) {
        return a != null && b != null && a.toLowerCase() === b.toLowerCase();
    }

    function containsIC(array, value) {
        var valueLC, i, len = array.length;
        if (!len || !value) {
            return false;
        }
        valueLC = value.toLowerCase();
        for (i = 0; i < len; ++i) {
            if (valueLC === array[i].toLowerCase()) {
                return true;
            }
        }
        return false;
    }

    function convertPropsToRegExp(object) {
        for (var key in object) {
            if (hasOwnProp.call(object, key)) {
                object[key] = new RegExp(object[key], 'i');
            }
        }
    }

    (function init() {
        var key, values, value, i, len, verPos, mobileDetectRules = impl.mobileDetectRules;
        for (key in mobileDetectRules.props) {
            if (hasOwnProp.call(mobileDetectRules.props, key)) {
                values = mobileDetectRules.props[key];
                if (!isArray(values)) {
                    values = [values];
                }
                len = values.length;
                for (i = 0; i < len; ++i) {
                    value = values[i];
                    verPos = value.indexOf('[VER]');
                    if (verPos >= 0) {
                        value = value.substring(0, verPos) + '([\\w._\\+]+)' + value.substring(verPos + 5);
                    }
                    values[i] = new RegExp(value, 'i');
                }
                mobileDetectRules.props[key] = values;
            }
        }
        convertPropsToRegExp(mobileDetectRules.oss);
        convertPropsToRegExp(mobileDetectRules.phones);
        convertPropsToRegExp(mobileDetectRules.tablets);
        convertPropsToRegExp(mobileDetectRules.uas);
        convertPropsToRegExp(mobileDetectRules.utils);

        // copy some patterns to oss0 which are tested first (see issue#15)
        mobileDetectRules.oss0 = {
            WindowsPhoneOS: mobileDetectRules.oss.WindowsPhoneOS,
            WindowsMobileOS: mobileDetectRules.oss.WindowsMobileOS
        };
    }());

    /**
     * Test userAgent string against a set of rules and find the first matched key.
     * @param {Object} rules (key is String, value is RegExp)
     * @param {String} userAgent the navigator.userAgent (or HTTP-Header 'User-Agent').
     * @returns {String|null} the matched key if found, otherwise <tt>null</tt>
     * @private
     */
    impl.findMatch = function(rules, userAgent) {
        for (var key in rules) {
            if (hasOwnProp.call(rules, key)) {
                if (rules[key].test(userAgent)) {
                    return key;
                }
            }
        }
        return null;
    };

    /**
     * Test userAgent string against a set of rules and return an array of matched keys.
     * @param {Object} rules (key is String, value is RegExp)
     * @param {String} userAgent the navigator.userAgent (or HTTP-Header 'User-Agent').
     * @returns {Array} an array of matched keys, may be empty when there is no match, but not <tt>null</tt>
     * @private
     */
    impl.findMatches = function(rules, userAgent) {
        var result = [];
        for (var key in rules) {
            if (hasOwnProp.call(rules, key)) {
                if (rules[key].test(userAgent)) {
                    result.push(key);
                }
            }
        }
        return result;
    };

    /**
     * Check the version of the given property in the User-Agent.
     *
     * @param {String} propertyName
     * @param {String} userAgent
     * @return {String} version or <tt>null</tt> if version not found
     * @private
     */
    impl.getVersionStr = function (propertyName, userAgent) {
        var props = impl.mobileDetectRules.props, patterns, i, len, match;
        if (hasOwnProp.call(props, propertyName)) {
            patterns = props[propertyName];
            len = patterns.length;
            for (i = 0; i < len; ++i) {
                match = patterns[i].exec(userAgent);
                if (match !== null) {
                    return match[1];
                }
            }
        }
        return null;
    };

    /**
     * Check the version of the given property in the User-Agent.
     * Will return a float number. (eg. 2_0 will return 2.0, 4.3.1 will return 4.31)
     *
     * @param {String} propertyName
     * @param {String} userAgent
     * @return {Number} version or <tt>NaN</tt> if version not found
     * @private
     */
    impl.getVersion = function (propertyName, userAgent) {
        var version = impl.getVersionStr(propertyName, userAgent);
        return version ? impl.prepareVersionNo(version) : NaN;
    };

    /**
     * Prepare the version number.
     *
     * @param {String} version
     * @return {Number} the version number as a floating number
     * @private
     */
    impl.prepareVersionNo = function (version) {
        var numbers;

        numbers = version.split(/[a-z._ \/\-]/i);
        if (numbers.length === 1) {
            version = numbers[0];
        }
        if (numbers.length > 1) {
            version = numbers[0] + '.';
            numbers.shift();
            version += numbers.join('');
        }
        return Number(version);
    };

    impl.isMobileFallback = function (userAgent) {
        return impl.detectMobileBrowsers.fullPattern.test(userAgent) ||
            impl.detectMobileBrowsers.shortPattern.test(userAgent.substr(0,4));
    };

    impl.isTabletFallback = function (userAgent) {
        return impl.detectMobileBrowsers.tabletPattern.test(userAgent);
    };

    impl.prepareDetectionCache = function (cache, userAgent, maxPhoneWidth) {
        if (cache.mobile !== undefined) {
            return;
        }
        var phone, tablet, phoneSized;

        // first check for stronger tablet rules, then phone (see issue#5)
        tablet = impl.findMatch(impl.mobileDetectRules.tablets, userAgent);
        if (tablet) {
            cache.mobile = cache.tablet = tablet;
            cache.phone = null;
            return; // unambiguously identified as tablet
        }

        phone = impl.findMatch(impl.mobileDetectRules.phones, userAgent);
        if (phone) {
            cache.mobile = cache.phone = phone;
            cache.tablet = null;
            return; // unambiguously identified as phone
        }

        // our rules haven't found a match -> try more general fallback rules
        if (impl.isMobileFallback(userAgent)) {
            phoneSized = MobileDetect.isPhoneSized(maxPhoneWidth);
            if (phoneSized === undefined) {
                cache.mobile = impl.FALLBACK_MOBILE;
                cache.tablet = cache.phone = null;
            } else if (phoneSized) {
                cache.mobile = cache.phone = impl.FALLBACK_PHONE;
                cache.tablet = null;
            } else {
                cache.mobile = cache.tablet = impl.FALLBACK_TABLET;
                cache.phone = null;
            }
        } else if (impl.isTabletFallback(userAgent)) {
            cache.mobile = cache.tablet = impl.FALLBACK_TABLET;
            cache.phone = null;
        } else {
            // not mobile at all!
            cache.mobile = cache.tablet = cache.phone = null;
        }
    };

    // t is a reference to a MobileDetect instance
    impl.mobileGrade = function (t) {
        // impl note:
        // To keep in sync w/ Mobile_Detect.php easily, the following code is tightly aligned to the PHP version.
        // When changes are made in Mobile_Detect.php, copy this method and replace:
        //     $this-> / t.
        //     self::MOBILE_GRADE_(.) / '$1'
        //     , self::VERSION_TYPE_FLOAT / (nothing)
        //     isIOS() / os('iOS')
        //     [reg] / (nothing)   <-- jsdelivr complaining about unescaped unicode character U+00AE
        var $isMobile = t.mobile() !== null;

        if (
            // Apple iOS 3.2-5.1 - Tested on the original iPad (4.3 / 5.0), iPad 2 (4.3), iPad 3 (5.1), original iPhone (3.1), iPhone 3 (3.2), 3GS (4.3), 4 (4.3 / 5.0), and 4S (5.1)
            t.os('iOS') && t.version('iPad')>=4.3 ||
            t.os('iOS') && t.version('iPhone')>=3.1 ||
            t.os('iOS') && t.version('iPod')>=3.1 ||

            // Android 2.1-2.3 - Tested on the HTC Incredible (2.2), original Droid (2.2), HTC Aria (2.1), Google Nexus S (2.3). Functional on 1.5 & 1.6 but performance may be sluggish, tested on Google G1 (1.5)
            // Android 3.1 (Honeycomb)  - Tested on the Samsung Galaxy Tab 10.1 and Motorola XOOM
            // Android 4.0 (ICS)  - Tested on a Galaxy Nexus. Note: transition performance can be poor on upgraded devices
            // Android 4.1 (Jelly Bean)  - Tested on a Galaxy Nexus and Galaxy 7
            ( t.version('Android')>2.1 && t.is('Webkit') ) ||

            // Windows Phone 7-7.5 - Tested on the HTC Surround (7.0) HTC Trophy (7.5), LG-E900 (7.5), Nokia Lumia 800
            t.version('Windows Phone OS')>=7.0 ||

            // Blackberry 7 - Tested on BlackBerry Torch 9810
            // Blackberry 6.0 - Tested on the Torch 9800 and Style 9670
            t.is('BlackBerry') && t.version('BlackBerry')>=6.0 ||
            // Blackberry Playbook (1.0-2.0) - Tested on PlayBook
            t.match('Playbook.*Tablet') ||

            // Palm WebOS (1.4-2.0) - Tested on the Palm Pixi (1.4), Pre (1.4), Pre 2 (2.0)
            ( t.version('webOS')>=1.4 && t.match('Palm|Pre|Pixi') ) ||
            // Palm WebOS 3.0  - Tested on HP TouchPad
            t.match('hp.*TouchPad') ||

            // Firefox Mobile (12 Beta) - Tested on Android 2.3 device
            ( t.is('Firefox') && t.version('Firefox')>=12 ) ||

            // Chrome for Android - Tested on Android 4.0, 4.1 device
            ( t.is('Chrome') && t.is('AndroidOS') && t.version('Android')>=4.0 ) ||

            // Skyfire 4.1 - Tested on Android 2.3 device
            ( t.is('Skyfire') && t.version('Skyfire')>=4.1 && t.is('AndroidOS') && t.version('Android')>=2.3 ) ||

            // Opera Mobile 11.5-12: Tested on Android 2.3
            ( t.is('Opera') && t.version('Opera Mobi')>11 && t.is('AndroidOS') ) ||

            // Meego 1.2 - Tested on Nokia 950 and N9
            t.is('MeeGoOS') ||

            // Tizen (pre-release) - Tested on early hardware
            t.is('Tizen') ||

            // Samsung Bada 2.0 - Tested on a Samsung Wave 3, Dolphin browser
            // @todo: more tests here!
            t.is('Dolfin') && t.version('Bada')>=2.0 ||

            // UC Browser - Tested on Android 2.3 device
            ( (t.is('UC Browser') || t.is('Dolfin')) && t.version('Android')>=2.3 ) ||

            // Kindle 3 and Fire  - Tested on the built-in WebKit browser for each
            ( t.match('Kindle Fire') ||
                t.is('Kindle') && t.version('Kindle')>=3.0 ) ||

            // Nook Color 1.4.1 - Tested on original Nook Color, not Nook Tablet
            t.is('AndroidOS') && t.is('NookTablet') ||

            // Chrome Desktop 11-21 - Tested on OS X 10.7 and Windows 7
            t.version('Chrome')>=11 && !$isMobile ||

            // Safari Desktop 4-5 - Tested on OS X 10.7 and Windows 7
            t.version('Safari')>=5.0 && !$isMobile ||

            // Firefox Desktop 4-13 - Tested on OS X 10.7 and Windows 7
            t.version('Firefox')>=4.0 && !$isMobile ||

            // Internet Explorer 7-9 - Tested on Windows XP, Vista and 7
            t.version('MSIE')>=7.0 && !$isMobile ||

            // Opera Desktop 10-12 - Tested on OS X 10.7 and Windows 7
            // @reference: http://my.opera.com/community/openweb/idopera/
            t.version('Opera')>=10 && !$isMobile

            ){
            return 'A';
        }

        if (
            t.os('iOS') && t.version('iPad')<4.3 ||
            t.os('iOS') && t.version('iPhone')<3.1 ||
            t.os('iOS') && t.version('iPod')<3.1 ||

            // Blackberry 5.0: Tested on the Storm 2 9550, Bold 9770
            t.is('Blackberry') && t.version('BlackBerry')>=5 && t.version('BlackBerry')<6 ||

            //Opera Mini (5.0-6.5) - Tested on iOS 3.2/4.3 and Android 2.3
            ( t.version('Opera Mini')>=5.0 && t.version('Opera Mini')<=6.5 &&
                (t.version('Android')>=2.3 || t.is('iOS')) ) ||

            // Nokia Symbian^3 - Tested on Nokia N8 (Symbian^3), C7 (Symbian^3), also works on N97 (Symbian^1)
            t.match('NokiaN8|NokiaC7|N97.*Series60|Symbian/3') ||

            // @todo: report this (tested on Nokia N71)
            t.version('Opera Mobi')>=11 && t.is('SymbianOS')
            ){
            return 'B';
        }

        if (
        // Blackberry 4.x - Tested on the Curve 8330
            t.version('BlackBerry')<5.0 ||
            // Windows Mobile - Tested on the HTC Leo (WinMo 5.2)
            t.match('MSIEMobile|Windows CE.*Mobile') || t.version('Windows Mobile')<=5.2

            ){
            return 'C';
        }

        //All older smartphone platforms and featurephones - Any device that doesn't support media queries
        //will receive the basic, C grade experience.
        return 'C';
    };

    impl.detectOS = function (ua) {
        return impl.findMatch(impl.mobileDetectRules.oss0, ua) ||
            impl.findMatch(impl.mobileDetectRules.oss, ua);
    };

    impl.getDeviceSmallerSide = function () {
        return window.screen.width < window.screen.height ?
            window.screen.width :
            window.screen.height;
    };

    /**
     * Constructor for MobileDetect object.
     * <br>
     * Such an object will keep a reference to the given user-agent string and cache most of the detect queries.<br>
     * <div style="background-color: #d9edf7; border: 1px solid #bce8f1; color: #3a87ad; padding: 14px; border-radius: 2px; margin-top: 20px">
     *     <strong>Find information how to download and install:</strong>
     *     <a href="https://github.com/hgoebl/mobile-detect.js/">github.com/hgoebl/mobile-detect.js/</a>
     * </div>
     *
     * @example <pre>
     *     var md = new MobileDetect(window.navigator.userAgent);
     *     if (md.mobile()) {
     *         location.href = (md.mobileGrade() === 'A') ? '/mobile/' : '/lynx/';
     *     }
     * </pre>
     *
     * @param {string} userAgent typically taken from window.navigator.userAgent or http_header['User-Agent']
     * @param {number} [maxPhoneWidth=600] <strong>only for browsers</strong> specify a value for the maximum
     *        width of smallest device side (in logical "CSS" pixels) until a device detected as mobile will be handled
     *        as phone.
     *        This is only used in cases where the device cannot be classified as phone or tablet.<br>
     *        See <a href="http://developer.android.com/guide/practices/screens_support.html">Declaring Tablet Layouts
     *        for Android</a>.<br>
     *        If you provide a value < 0, then this "fuzzy" check is disabled.
     * @constructor
     * @global
     */
    function MobileDetect(userAgent, maxPhoneWidth) {
        this.ua = userAgent || '';
        this._cache = {};
        //600dp is typical 7" tablet minimum width
        this.maxPhoneWidth = maxPhoneWidth || 600;
    }

    MobileDetect.prototype = {
        constructor: MobileDetect,

        /**
         * Returns the detected phone or tablet type or <tt>null</tt> if it is not a mobile device.
         * <br>
         * For a list of possible return values see {@link MobileDetect#phone} and {@link MobileDetect#tablet}.<br>
         * <br>
         * If the device is not detected by the regular expressions from Mobile-Detect, a test is made against
         * the patterns of <a href="http://detectmobilebrowsers.com/">detectmobilebrowsers.com</a>. If this test
         * is positive, a value of <code>UnknownPhone</code>, <code>UnknownTablet</code> or
         * <code>UnknownMobile</code> is returned.<br>
         * When used in browser, the decision whether phone or tablet is made based on <code>screen.width/height</code>.<br>
         * <br>
         * When used server-side (node.js), there is no way to tell the difference between <code>UnknownTablet</code>
         * and <code>UnknownMobile</code>, so you will get <code>UnknownMobile</code> here.<br>
         * Be aware that since v1.0.0 in this special case you will get <code>UnknownMobile</code> only for:
         * {@link MobileDetect#mobile}, not for {@link MobileDetect#phone} and {@link MobileDetect#tablet}.
         * In versions before v1.0.0 all 3 methods returned <code>UnknownMobile</code> which was tedious to use.
         * <br>
         * In most cases you will use the return value just as a boolean.
         *
         * @returns {String} the key for the phone family or tablet family, e.g. "Nexus".
         * @function MobileDetect#mobile
         */
        mobile: function () {
            impl.prepareDetectionCache(this._cache, this.ua, this.maxPhoneWidth);
            return this._cache.mobile;
        },

        /**
         * Returns the detected phone type/family string or <tt>null</tt>.
         * <br>
         * The returned tablet (family or producer) is one of following keys:<br>
         * <br><tt>iPhone, BlackBerry, HTC, Nexus, Dell, Motorola, Samsung, LG, Sony, Asus,
         * NokiaLumia, Micromax, Palm, Vertu, Pantech, Fly, Wiko, iMobile, SimValley,
         * Wolfgang, Alcatel, Nintendo, Amoi, INQ, GenericPhone</tt><br>
         * <br>
         * If the device is not detected by the regular expressions from Mobile-Detect, a test is made against
         * the patterns of <a href="http://detectmobilebrowsers.com/">detectmobilebrowsers.com</a>. If this test
         * is positive, a value of <code>UnknownPhone</code> or <code>UnknownMobile</code> is returned.<br>
         * When used in browser, the decision whether phone or tablet is made based on <code>screen.width/height</code>.<br>
         * <br>
         * When used server-side (node.js), there is no way to tell the difference between <code>UnknownTablet</code>
         * and <code>UnknownMobile</code>, so you will get <code>null</code> here, while {@link MobileDetect#mobile}
         * will return <code>UnknownMobile</code>.<br>
         * Be aware that since v1.0.0 in this special case you will get <code>UnknownMobile</code> only for:
         * {@link MobileDetect#mobile}, not for {@link MobileDetect#phone} and {@link MobileDetect#tablet}.
         * In versions before v1.0.0 all 3 methods returned <code>UnknownMobile</code> which was tedious to use.
         * <br>
         * In most cases you will use the return value just as a boolean.
         *
         * @returns {String} the key of the phone family or producer, e.g. "iPhone"
         * @function MobileDetect#phone
         */
        phone: function () {
            impl.prepareDetectionCache(this._cache, this.ua, this.maxPhoneWidth);
            return this._cache.phone;
        },

        /**
         * Returns the detected tablet type/family string or <tt>null</tt>.
         * <br>
         * The returned tablet (family or producer) is one of following keys:<br>
         * <br><tt>iPad, NexusTablet, SamsungTablet, Kindle, SurfaceTablet, HPTablet, AsusTablet,
         * BlackBerryTablet, HTCtablet, MotorolaTablet, NookTablet, AcerTablet,
         * ToshibaTablet, LGTablet, FujitsuTablet, PrestigioTablet, LenovoTablet,
         * DellTablet, YarvikTablet, MedionTablet, ArnovaTablet, IntensoTablet, IRUTablet,
         * MegafonTablet, EbodaTablet, AllViewTablet, ArchosTablet, AinolTablet,
         * NokiaLumiaTablet, SonyTablet, PhilipsTablet, CubeTablet, CobyTablet, MIDTablet,
         * MSITablet, SMiTTablet, RockChipTablet, FlyTablet, bqTablet, HuaweiTablet,
         * NecTablet, PantechTablet, BronchoTablet, VersusTablet, ZyncTablet,
         * PositivoTablet, NabiTablet, KoboTablet, DanewTablet, TexetTablet,
         * PlaystationTablet, TrekstorTablet, PyleAudioTablet, AdvanTablet,
         * DanyTechTablet, GalapadTablet, MicromaxTablet, KarbonnTablet, AllFineTablet,
         * PROSCANTablet, YONESTablet, ChangJiaTablet, GUTablet, PointOfViewTablet,
         * OvermaxTablet, HCLTablet, DPSTablet, VistureTablet, CrestaTablet,
         * MediatekTablet, ConcordeTablet, GoCleverTablet, ModecomTablet, VoninoTablet,
         * ECSTablet, StorexTablet, VodafoneTablet, EssentielBTablet, RossMoorTablet,
         * iMobileTablet, TolinoTablet, AudioSonicTablet, AMPETablet, SkkTablet,
         * TecnoTablet, JXDTablet, iJoyTablet, FX2Tablet, XoroTablet, ViewsonicTablet,
         * OdysTablet, CaptivaTablet, IconbitTablet, TeclastTablet, OndaTablet,
         * JaytechTablet, BlaupunktTablet, DigmaTablet, EvolioTablet, LavaTablet,
         * AocTablet, MpmanTablet, CelkonTablet, WolderTablet, MiTablet, NibiruTablet,
         * NexoTablet, LeaderTablet, UbislateTablet, PocketBookTablet, KocasoTablet,
         * HisenseTablet, Hudl, TelstraTablet, GenericTablet</tt><br>
         * <br>
         * If the device is not detected by the regular expressions from Mobile-Detect, a test is made against
         * the patterns of <a href="http://detectmobilebrowsers.com/">detectmobilebrowsers.com</a>. If this test
         * is positive, a value of <code>UnknownTablet</code> or <code>UnknownMobile</code> is returned.<br>
         * When used in browser, the decision whether phone or tablet is made based on <code>screen.width/height</code>.<br>
         * <br>
         * When used server-side (node.js), there is no way to tell the difference between <code>UnknownTablet</code>
         * and <code>UnknownMobile</code>, so you will get <code>null</code> here, while {@link MobileDetect#mobile}
         * will return <code>UnknownMobile</code>.<br>
         * Be aware that since v1.0.0 in this special case you will get <code>UnknownMobile</code> only for:
         * {@link MobileDetect#mobile}, not for {@link MobileDetect#phone} and {@link MobileDetect#tablet}.
         * In versions before v1.0.0 all 3 methods returned <code>UnknownMobile</code> which was tedious to use.
         * <br>
         * In most cases you will use the return value just as a boolean.
         *
         * @returns {String} the key of the tablet family or producer, e.g. "SamsungTablet"
         * @function MobileDetect#tablet
         */
        tablet: function () {
            impl.prepareDetectionCache(this._cache, this.ua, this.maxPhoneWidth);
            return this._cache.tablet;
        },

        /**
         * Returns the (first) detected user-agent string or <tt>null</tt>.
         * <br>
         * The returned user-agent is one of following keys:<br>
         * <br><tt>Chrome, Dolfin, Opera, Skyfire, Edge, IE, Firefox, Bolt, TeaShark, Blazer,
         * Safari, UCBrowser, baiduboxapp, baidubrowser, DiigoBrowser, Puffin, Mercury,
         * ObigoBrowser, NetFront, GenericBrowser, PaleMoon</tt><br>
         * <br>
         * In most cases calling {@link MobileDetect#userAgent} will be sufficient. But there are rare
         * cases where a mobile device pretends to be more than one particular browser. You can get the
         * list of all matches with {@link MobileDetect#userAgents} or check for a particular value by
         * providing one of the defined keys as first argument to {@link MobileDetect#is}.
         *
         * @returns {String} the key for the detected user-agent or <tt>null</tt>
         * @function MobileDetect#userAgent
         */
        userAgent: function () {
            if (this._cache.userAgent === undefined) {
                this._cache.userAgent = impl.findMatch(impl.mobileDetectRules.uas, this.ua);
            }
            return this._cache.userAgent;
        },

        /**
         * Returns all detected user-agent strings.
         * <br>
         * The array is empty or contains one or more of following keys:<br>
         * <br><tt>Chrome, Dolfin, Opera, Skyfire, Edge, IE, Firefox, Bolt, TeaShark, Blazer,
         * Safari, UCBrowser, baiduboxapp, baidubrowser, DiigoBrowser, Puffin, Mercury,
         * ObigoBrowser, NetFront, GenericBrowser, PaleMoon</tt><br>
         * <br>
         * In most cases calling {@link MobileDetect#userAgent} will be sufficient. But there are rare
         * cases where a mobile device pretends to be more than one particular browser. You can get the
         * list of all matches with {@link MobileDetect#userAgents} or check for a particular value by
         * providing one of the defined keys as first argument to {@link MobileDetect#is}.
         *
         * @returns {Array} the array of detected user-agent keys or <tt>[]</tt>
         * @function MobileDetect#userAgents
         */
        userAgents: function () {
            if (this._cache.userAgents === undefined) {
                this._cache.userAgents = impl.findMatches(impl.mobileDetectRules.uas, this.ua);
            }
            return this._cache.userAgents;
        },

        /**
         * Returns the detected operating system string or <tt>null</tt>.
         * <br>
         * The operating system is one of following keys:<br>
         * <br><tt>AndroidOS, BlackBerryOS, PalmOS, SymbianOS, WindowsMobileOS, WindowsPhoneOS,
         * iOS, MeeGoOS, MaemoOS, JavaOS, webOS, badaOS, BREWOS</tt><br>
         *
         * @returns {String} the key for the detected operating system.
         * @function MobileDetect#os
         */
        os: function () {
            if (this._cache.os === undefined) {
                this._cache.os = impl.detectOS(this.ua);
            }
            return this._cache.os;
        },

        /**
         * Get the version (as Number) of the given property in the User-Agent.
         * <br>
         * Will return a float number. (eg. 2_0 will return 2.0, 4.3.1 will return 4.31)
         *
         * @param {String} key a key defining a thing which has a version.<br>
         *        You can use one of following keys:<br>
         * <br><tt>Mobile, Build, Version, VendorID, iPad, iPhone, iPod, Kindle, Chrome, Coast,
         * Dolfin, Firefox, Fennec, Edge, IE, NetFront, NokiaBrowser, Opera, Opera Mini,
         * Opera Mobi, UC Browser, MQQBrowser, MicroMessenger, baiduboxapp, baidubrowser,
         * SamsungBrowser, Iron, Safari, Skyfire, Tizen, Webkit, PaleMoon, Gecko, Trident,
         * Presto, Goanna, iOS, Android, BlackBerry, BREW, Java, Windows Phone OS, Windows
         * Phone, Windows CE, Windows NT, Symbian, webOS</tt><br>
         *
         * @returns {Number} the version as float or <tt>NaN</tt> if User-Agent doesn't contain this version.
         *          Be careful when comparing this value with '==' operator!
         * @function MobileDetect#version
         */
        version: function (key) {
            return impl.getVersion(key, this.ua);
        },

        /**
         * Get the version (as String) of the given property in the User-Agent.
         * <br>
         *
         * @param {String} key a key defining a thing which has a version.<br>
         *        You can use one of following keys:<br>
         * <br><tt>Mobile, Build, Version, VendorID, iPad, iPhone, iPod, Kindle, Chrome, Coast,
         * Dolfin, Firefox, Fennec, Edge, IE, NetFront, NokiaBrowser, Opera, Opera Mini,
         * Opera Mobi, UC Browser, MQQBrowser, MicroMessenger, baiduboxapp, baidubrowser,
         * SamsungBrowser, Iron, Safari, Skyfire, Tizen, Webkit, PaleMoon, Gecko, Trident,
         * Presto, Goanna, iOS, Android, BlackBerry, BREW, Java, Windows Phone OS, Windows
         * Phone, Windows CE, Windows NT, Symbian, webOS</tt><br>
         *
         * @returns {String} the "raw" version as String or <tt>null</tt> if User-Agent doesn't contain this version.
         *
         * @function MobileDetect#versionStr
         */
        versionStr: function (key) {
            return impl.getVersionStr(key, this.ua);
        },

        /**
         * Global test key against userAgent, os, phone, tablet and some other properties of userAgent string.
         *
         * @param {String} key the key (case-insensitive) of a userAgent, an operating system, phone or
         *        tablet family.<br>
         *        For a complete list of possible values, see {@link MobileDetect#userAgent},
         *        {@link MobileDetect#os}, {@link MobileDetect#phone}, {@link MobileDetect#tablet}.<br>
         *        Additionally you have following keys:<br>
         * <br><tt>Bot, MobileBot, DesktopMode, TV, WebKit, Console, Watch</tt><br>
         *
         * @returns {boolean} <tt>true</tt> when the given key is one of the defined keys of userAgent, os, phone,
         *                    tablet or one of the listed additional keys, otherwise <tt>false</tt>
         * @function MobileDetect#is
         */
        is: function (key) {
            return containsIC(this.userAgents(), key) ||
                   equalIC(key, this.os()) ||
                   equalIC(key, this.phone()) ||
                   equalIC(key, this.tablet()) ||
                   containsIC(impl.findMatches(impl.mobileDetectRules.utils, this.ua), key);
        },

        /**
         * Do a quick test against navigator::userAgent.
         *
         * @param {String|RegExp} pattern the pattern, either as String or RegExp
         *                        (a string will be converted to a case-insensitive RegExp).
         * @returns {boolean} <tt>true</tt> when the pattern matches, otherwise <tt>false</tt>
         * @function MobileDetect#match
         */
        match: function (pattern) {
            if (!(pattern instanceof RegExp)) {
                pattern = new RegExp(pattern, 'i');
            }
            return pattern.test(this.ua);
        },

        /**
         * Checks whether the mobile device can be considered as phone regarding <code>screen.width</code>.
         * <br>
         * Obviously this method makes sense in browser environments only (not for Node.js)!
         * @param {number} [maxPhoneWidth] the maximum logical pixels (aka. CSS-pixels) to be considered as phone.<br>
         *        The argument is optional and if not present or falsy, the value of the constructor is taken.
         * @returns {boolean|undefined} <code>undefined</code> if screen size wasn't detectable, else <code>true</code>
         *          when screen.width is less or equal to maxPhoneWidth, otherwise <code>false</code>.<br>
         *          Will always return <code>undefined</code> server-side.
         */
        isPhoneSized: function (maxPhoneWidth) {
            return MobileDetect.isPhoneSized(maxPhoneWidth || this.maxPhoneWidth);
        },

        /**
         * Returns the mobile grade ('A', 'B', 'C').
         *
         * @returns {String} one of the mobile grades ('A', 'B', 'C').
         * @function MobileDetect#mobileGrade
         */
        mobileGrade: function () {
            if (this._cache.grade === undefined) {
                this._cache.grade = impl.mobileGrade(this);
            }
            return this._cache.grade;
        }
    };

    // environment-dependent
    if (typeof window !== 'undefined' && window.screen) {
        MobileDetect.isPhoneSized = function (maxPhoneWidth) {
            return maxPhoneWidth < 0 ? undefined : impl.getDeviceSmallerSide() <= maxPhoneWidth;
        };
    } else {
        MobileDetect.isPhoneSized = function () {};
    }

    // should not be replaced by a completely new object - just overwrite existing methods
    MobileDetect._impl = impl;
    
    MobileDetect.version = '1.3.6 2017-04-05';

    return MobileDetect;
}); // end of call of define()
})((function (undefined) {
    if (typeof module !== 'undefined' && module.exports) {
        return function (factory) { module.exports = factory(); };
    } else if (typeof define === 'function' && define.amd) {
        return define;
    } else if (typeof window !== 'undefined') {
        return function (factory) { window.MobileDetect = factory(); };
    } else {
        // please file a bug if you get this error!
        throw new Error('unknown environment');
    }
})());