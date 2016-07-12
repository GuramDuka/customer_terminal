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
String.prototype.isEmpty = function() {
    return (this.length === 0 || !this.trim());
};
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
function microtime() {

	return window.performance.timing.navigationStart + window.performance.now();

}
//------------------------------------------------------------------------------
function ellapsed_time_string(ms) {

	var a		= Math.round(ms / 1000);
	var days	= Math.round(a / (60 * 60 * 24));
	var hours	= Math.round(a / (60 * 60)) - days * 24;
	var mins	= Math.round(a / 60) - days * 24 * 60 - hours * 60;
	var secs	= a - days * 24 * 60 * 60 - hours * 60 * 60 - mins * 60;
	var msecs	= ms % 1000;

	s = sprintf('%02u:%02u:%02u.%03u', hours, mins, secs, msecs);

	if( days != 0 )
		s = sprintf('%u', $days) + ':' + s;

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
function post_json(path, data, success, error) {

	let xhr = new XMLHttpRequest;

	xhr.open('POST', path, true);
	xhr.timeout = 180000;
	xhr.setRequestHeader('Content-Type', 'Content-Type: application/json; charset=utf-8');
	xhr.setRequestHeader('If-Modified-Since', 'Sat, 1 Jan 2000 00:00:00 GMT') // no-cache;

	xhr.onreadystatechange = function() {

		if( this.readyState === XMLHttpRequest.DONE ) {
			if( this.status === 200 ) {
				if( success )
					success(JSON.parse(this.responseText));
			}
			else if( error ) {
				error(this);
			}
		}

	};

	xhr.send(JSON.stringify(data, null, '\t'));
}
//------------------------------------------------------------------------------
function post_json_sync(path, data) {

	let xhr = new XMLHttpRequest;

	xhr.open('POST', path, false);
	xhr.setRequestHeader('Content-Type', 'Content-Type: application/json; charset=utf-8');
	xhr.setRequestHeader('If-Modified-Since', 'Sat, 1 Jan 2000 00:00:00 GMT') // no-cache;
	xhr.send(JSON.stringify(data, null, '\t'));

	if( xhr.status === 200 )
		return JSON.parse(xhr.responseText);

	throw new Error(request.status.toString() + ' ' + request.statusText);

}
//------------------------------------------------------------------------------
function add_event(obj, type, fn, phase = true) {

	if( obj.addEventListener ) {
		obj.addEventListener(type, fn, phase);
	}
	else if( obj.attachEvent ) {
		obj.attachEvent('on' + type, function() {
			return fn.apply(obj, [window.event]);
		});
	}
}
//------------------------------------------------------------------------------
function xpath_eval(path, parent = undefined) {

	let a = [];
	let it = document.evaluate(path, parent ? parent : document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
	
	for( let e; e = it.iterateNext(); )
		a.push(e);

	return a;
}
//------------------------------------------------------------------------------
function xpath_eval_single(path, parent = undefined) {

	let a = xpath_eval(path, parent);

	if( a.length > 1 )
		throw new Error('evaluate return multiple elements');

	if( a.length == 0 )
		throw new Error('evaluate return no result');

	return a[0];
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
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
(function() {
  var Idle;

  if (!document.addEventListener) {
    if (document.attachEvent) {
      document.addEventListener = function(event, callback, useCapture) {
        return document.attachEvent("on" + event, callback, useCapture);
      };
    } else {
      document.addEventListener = function() {
        return {};
      };
    }
  }

  if (!document.removeEventListener) {
    if (document.detachEvent) {
      document.removeEventListener = function(event, callback) {
        return document.detachEvent("on" + event, callback);
      };
    } else {
      document.removeEventListener = function() {
        return {};
      };
    }
  }

  "use strict";

  Idle = {};

  Idle = (function() {
    Idle.isAway = false;

    Idle.awayTimeout = 3000;

    Idle.awayTimestamp = 0;

    Idle.awayTimer = null;

    Idle.onAway = null;

    Idle.onAwayBack = null;

    Idle.onVisible = null;

    Idle.onHidden = null;

    function Idle(options) {
      var activeMethod, activity;
      if (options) {
        this.awayTimeout = parseInt(options.awayTimeout, 10);
        this.onAway = options.onAway;
        this.onAwayBack = options.onAwayBack;
        this.onVisible = options.onVisible;
        this.onHidden = options.onHidden;
      }
      activity = this;
      activeMethod = function() {
        return activity.onActive();
      };
      window.onclick = activeMethod;
      window.onmousemove = activeMethod;
      window.onmouseenter = activeMethod;
      window.onkeydown = activeMethod;
      window.onscroll = activeMethod;
      window.onmousewheel = activeMethod;
    }

    Idle.prototype.onActive = function() {
      this.awayTimestamp = new Date().getTime() + this.awayTimeout;
      if (this.isAway) {
        if (this.onAwayBack) {
          this.onAwayBack();
        }
        this.start();
      }
      this.isAway = false;
      return true;
    };

    Idle.prototype.start = function() {
      var activity;
      if (!this.listener) {
        this.listener = (function() {
          return activity.handleVisibilityChange();
        });
        document.addEventListener("visibilitychange", this.listener, false);
        document.addEventListener("webkitvisibilitychange", this.listener, false);
        document.addEventListener("msvisibilitychange", this.listener, false);
      }
      this.awayTimestamp = new Date().getTime() + this.awayTimeout;
      if (this.awayTimer !== null) {
        clearTimeout(this.awayTimer);
      }
      activity = this;
      this.awayTimer = setTimeout((function() {
        return activity.checkAway();
      }), this.awayTimeout + 100);
      return this;
    };

    Idle.prototype.stop = function() {
      if (this.awayTimer !== null) {
        clearTimeout(this.awayTimer);
      }
      if (this.listener !== null) {
        document.removeEventListener("visibilitychange", this.listener);
        document.removeEventListener("webkitvisibilitychange", this.listener);
        document.removeEventListener("msvisibilitychange", this.listener);
        this.listener = null;
      }
      return this;
    };

    Idle.prototype.setAwayTimeout = function(ms) {
      this.awayTimeout = parseInt(ms, 10);
      return this;
    };

    Idle.prototype.checkAway = function() {
      var activity, t;
      t = new Date().getTime();
      if (t < this.awayTimestamp) {
        this.isAway = false;
        activity = this;
        this.awayTimer = setTimeout((function() {
          return activity.checkAway();
        }), this.awayTimestamp - t + 100);
        return;
      }
      if (this.awayTimer !== null) {
        clearTimeout(this.awayTimer);
      }
      this.isAway = true;
      if (this.onAway) {
        return this.onAway();
      }
    };

    Idle.prototype.handleVisibilityChange = function() {
      if (document.hidden || document.msHidden || document.webkitHidden) {
        if (this.onHidden) {
          return this.onHidden();
        }
      } else {
        if (this.onVisible) {
          return this.onVisible();
        }
      }
    };

    return Idle;

  })();

  if (typeof define === 'function' && define.amd) {
    define([], Idle);
  } else if (typeof exports === 'object') {
    module.exports = Idle;
  } else {
    window.Idle = Idle;
  }

}).call(this);
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
(function(window, document, exportName, undefined) {
    "use strict";

    var isMultiTouch = false;
    var multiTouchStartPos;
    var eventTarget;
    var touchElements = {};

    // polyfills
    if(!document.createTouch) {
        document.createTouch = function(view, target, identifier, pageX, pageY, screenX, screenY, clientX, clientY) {
            // auto set
            if(clientX == undefined || clientY == undefined) {
                clientX = pageX - window.pageXOffset;
                clientY = pageY - window.pageYOffset;
            }

            return new Touch(target, identifier, {
                pageX: pageX,
                pageY: pageY,
                screenX: screenX,
                screenY: screenY,
                clientX: clientX,
                clientY: clientY
            });
        };
    }

    if(!document.createTouchList) {
        document.createTouchList = function() {
            var touchList = new TouchList();
            for (var i = 0; i < arguments.length; i++) {
                touchList[i] = arguments[i];
            }
            touchList.length = arguments.length;
            return touchList;
        };
    }

    /**
     * create an touch point
     * @constructor
     * @param target
     * @param identifier
     * @param pos
     * @param deltaX
     * @param deltaY
     * @returns {Object} touchPoint
     */
    function Touch(target, identifier, pos, deltaX, deltaY) {
        deltaX = deltaX || 0;
        deltaY = deltaY || 0;

        this.identifier = identifier;
        this.target = target;
        this.clientX = pos.clientX + deltaX;
        this.clientY = pos.clientY + deltaY;
        this.screenX = pos.screenX + deltaX;
        this.screenY = pos.screenY + deltaY;
        this.pageX = pos.pageX + deltaX;
        this.pageY = pos.pageY + deltaY;
    }

    /**
     * create empty touchlist with the methods
     * @constructor
     * @returns touchList
     */
    function TouchList() {
        var touchList = [];

        touchList.item = function(index) {
            return this[index] || null;
        };

        // specified by Mozilla
        touchList.identifiedTouch = function(id) {
            return this[id + 1] || null;
        };

        return touchList;
    }


    /**
     * Simple trick to fake touch event support
     * this is enough for most libraries like Modernizr and Hammer
     */
    function fakeTouchSupport() {
        var objs = [window, document.documentElement];
        var props = ['ontouchstart', 'ontouchmove', 'ontouchcancel', 'ontouchend'];

        for(var o=0; o<objs.length; o++) {
            for(var p=0; p<props.length; p++) {
                if(objs[o] && objs[o][props[p]] == undefined) {
                    objs[o][props[p]] = null;
                }
            }
        }
    }

    /**
     * we don't have to emulate on a touch device
     * @returns {boolean}
     */
    function hasTouchSupport() {
        return ("ontouchstart" in window) || // touch events
               (window.Modernizr && window.Modernizr.touch) || // modernizr
               (navigator.msMaxTouchPoints || navigator.maxTouchPoints) > 2; // pointer events
    }

    /**
     * disable mouseevents on the page
     * @param ev
     */
    function preventMouseEvents(ev) {
        ev.preventDefault();
        ev.stopPropagation();
    }

    /**
     * only trigger touches when the left mousebutton has been pressed
     * @param touchType
     * @returns {Function}
     */
    function onMouse(touchType) {
        return function(ev) {
            // prevent mouse events
            preventMouseEvents(ev);

            if (ev.which !== 1) {
                return;
            }

            // The EventTarget on which the touch point started when it was first placed on the surface,
            // even if the touch point has since moved outside the interactive area of that element.
            // also, when the target doesnt exist anymore, we update it
            if (ev.type == 'mousedown' || !eventTarget || (eventTarget && !eventTarget.dispatchEvent)) {
                eventTarget = ev.target;
            }

            // shiftKey has been lost, so trigger a touchend
            if (isMultiTouch && !ev.shiftKey) {
                triggerTouch('touchend', ev);
                isMultiTouch = false;
            }

            triggerTouch(touchType, ev);

            // we're entering the multi-touch mode!
            if (!isMultiTouch && ev.shiftKey) {
                isMultiTouch = true;
                multiTouchStartPos = {
                    pageX: ev.pageX,
                    pageY: ev.pageY,
                    clientX: ev.clientX,
                    clientY: ev.clientY,
                    screenX: ev.screenX,
                    screenY: ev.screenY
                };
                triggerTouch('touchstart', ev);
            }

            // reset
            if (ev.type == 'mouseup') {
                multiTouchStartPos = null;
                isMultiTouch = false;
                eventTarget = null;
            }
        }
    }

    /**
     * trigger a touch event
     * @param eventName
     * @param mouseEv
     */
    function triggerTouch(eventName, mouseEv) {
        var touchEvent = document.createEvent('Event');
        touchEvent.initEvent(eventName, true, true);

        touchEvent.altKey = mouseEv.altKey;
        touchEvent.ctrlKey = mouseEv.ctrlKey;
        touchEvent.metaKey = mouseEv.metaKey;
        touchEvent.shiftKey = mouseEv.shiftKey;

        touchEvent.touches = getActiveTouches(mouseEv, eventName);
        touchEvent.targetTouches = getActiveTouches(mouseEv, eventName);
        touchEvent.changedTouches = getChangedTouches(mouseEv, eventName);

        eventTarget.dispatchEvent(touchEvent);
    }

    /**
     * create a touchList based on the mouse event
     * @param mouseEv
     * @returns {TouchList}
     */
    function createTouchList(mouseEv) {
        var touchList = new TouchList();

        if (isMultiTouch) {
            var f = TouchEmulator.multiTouchOffset;
            var deltaX = multiTouchStartPos.pageX - mouseEv.pageX;
            var deltaY = multiTouchStartPos.pageY - mouseEv.pageY;

            touchList.push(new Touch(eventTarget, 1, multiTouchStartPos, (deltaX*-1) - f, (deltaY*-1) + f));
            touchList.push(new Touch(eventTarget, 2, multiTouchStartPos, deltaX+f, deltaY-f));
        } else {
            touchList.push(new Touch(eventTarget, 1, mouseEv, 0, 0));
        }

        return touchList;
    }

    /**
     * receive all active touches
     * @param mouseEv
     * @returns {TouchList}
     */
    function getActiveTouches(mouseEv, eventName) {
        // empty list
        if (mouseEv.type == 'mouseup') {
            return new TouchList();
        }

        var touchList = createTouchList(mouseEv);
        if(isMultiTouch && mouseEv.type != 'mouseup' && eventName == 'touchend') {
            touchList.splice(1, 1);
        }
        return touchList;
    }

    /**
     * receive a filtered set of touches with only the changed pointers
     * @param mouseEv
     * @param eventName
     * @returns {TouchList}
     */
    function getChangedTouches(mouseEv, eventName) {
        var touchList = createTouchList(mouseEv);

        // we only want to return the added/removed item on multitouch
        // which is the second pointer, so remove the first pointer from the touchList
        //
        // but when the mouseEv.type is mouseup, we want to send all touches because then
        // no new input will be possible
        if(isMultiTouch && mouseEv.type != 'mouseup' &&
            (eventName == 'touchstart' || eventName == 'touchend')) {
            touchList.splice(0, 1);
        }

        return touchList;
    }

    /**
     * show the touchpoints on the screen
     */
    function showTouches(ev) {
        var touch, i, el, styles;

        // first all visible touches
        for(i = 0; i < ev.touches.length; i++) {
            touch = ev.touches[i];
            el = touchElements[touch.identifier];
            if(!el) {
                el = touchElements[touch.identifier] = document.createElement("div");
                document.body.appendChild(el);
            }

            styles = TouchEmulator.template(touch);
            for(var prop in styles) {
                el.style[prop] = styles[prop];
            }
        }

        // remove all ended touches
        if(ev.type == 'touchend' || ev.type == 'touchcancel') {
            for(i = 0; i < ev.changedTouches.length; i++) {
                touch = ev.changedTouches[i];
                el = touchElements[touch.identifier];
                if(el) {
                    el.parentNode.removeChild(el);
                    delete touchElements[touch.identifier];
                }
            }
        }
    }

    /**
     * TouchEmulator initializer
     */
    function TouchEmulator() {
        if (hasTouchSupport()) {
            return;
        }

        fakeTouchSupport();

        window.addEventListener("mousedown", onMouse('touchstart'), true);
        window.addEventListener("mousemove", onMouse('touchmove'), true);
        window.addEventListener("mouseup", onMouse('touchend'), true);

        window.addEventListener("mouseenter", preventMouseEvents, true);
        window.addEventListener("mouseleave", preventMouseEvents, true);
        window.addEventListener("mouseout", preventMouseEvents, true);
        window.addEventListener("mouseover", preventMouseEvents, true);

        // it uses itself!
        window.addEventListener("touchstart", showTouches, true);
        window.addEventListener("touchmove", showTouches, true);
        window.addEventListener("touchend", showTouches, true);
        window.addEventListener("touchcancel", showTouches, true);
    }

    // start distance when entering the multitouch mode
    TouchEmulator.multiTouchOffset = 75;

    /**
     * css template for the touch rendering
     * @param touch
     * @returns object
     */
    TouchEmulator.template = function(touch) {
        var size = 30;
        var transform = 'translate('+ (touch.clientX-(size/2)) +'px, '+ (touch.clientY-(size/2)) +'px)';
        return {
            position: 'fixed',
            left: 0,
            top: 0,
            background: '#fff',
            border: 'solid 1px #999',
            opacity: .6,
            borderRadius: '100%',
            height: size + 'px',
            width: size + 'px',
            padding: 0,
            margin: 0,
            display: 'block',
            overflow: 'hidden',
            pointerEvents: 'none',
            webkitUserSelect: 'none',
            mozUserSelect: 'none',
            userSelect: 'none',
            webkitTransform: transform,
            mozTransform: transform,
            transform: transform,
            zIndex: 100
        }
    };

    // export
    if (typeof define == "function" && define.amd) {
        define(function() {
            return TouchEmulator;
        });
    } else if (typeof module != "undefined" && module.exports) {
        module.exports = TouchEmulator;
    } else {
        window[exportName] = TouchEmulator;
    }
})(window, document, "TouchEmulator");
//------------------------------------------------------------------------------
var touch =
	!!('ontouchstart' in window)
	|| !!('ontouchstart' in document.documentElement)
	|| !!window.ontouchstart
	|| !!window.Touch
	|| !!window.onmsgesturechange
	|| (window.DocumentTouch && window.document instanceof window.DocumentTouch);
//------------------------------------------------------------------------------
//if( !touch ) TouchEmulator();
//------------------------------------------------------------------------------
