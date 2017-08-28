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

		if( typeof callback )
			callback(false);

		return;
	}

	console.log('load ' + tag + ':', url);

	let e		= document.createElement(tag);
	e.setAttribute('rel', 'stylesheet');
	e.setAttribute('type', type);
	e.setAttribute('href', url);
	e.type		= type;
	e.onload	= () => callback(true);
	e.src		= url;

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
function core_loader() {
	      load_script('js/misc.js',
	() => load_script('js/verge.js',
	() => load_script('js/hashes.js',
	() => load_script('js/xhrs.js',
	() => load_script('js/idle.js',
	() => load_script('js/sseq.js',
	() => load_script('js/barcode.js',
	() => load_script('js/core-estimator.js',
	() => load_script('js/detect-browser.js',
	() => load_script('js/core.js', () => {
		let r = res();
		let e = document.createElement('style');
		e.innerHTML = `
			:root {
				--dppx				: ${r.dppx};
				--dpi				: ${r.dpi};
				--dpcm				: ${r.dpcm};
				--dpmm				: ${r.dpmm};
				--smart-phone		: ${SmartPhone.isAny() ? 1 : 0};
				--screen-width		: ${screen.width};
				--screen-height		: ${screen.height};
			}
		`;
		document.getElementsByTagName('head')[0].appendChild(e);

		let css_loader = location_search().dct ?
		    () => load_css('css/default.css',
			() => load_css('css/load.css',
			() => load_css('css/dct.css',
			() => core())))
			:
		    () => load_css('css/default.css',
			() => load_css('css/load.css',
			() => core()));

		css_loader();

	}))))))))));
}
//------------------------------------------------------------------------------
