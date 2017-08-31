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
	let r = res();
	let e = document.createElement('style');
	e.innerHTML = `
		:root {
			--dppx					: ${r.dppx};
			--dpi					: ${r.dpi};
			--dpcm					: ${r.dpcm};
			--dpmm					: ${r.dpmm};
			--smart-phone			: ${SmartPhone.isAny() ? 1 : 0};
			--screen-width			: ${screen.width};
			--screen-height			: ${screen.height};
			--screen-aspect-ratio	: ${screen.width / screen.height};
			--screen-portrait		: ${screen.width <= screen.height ? 1 : 0};
			--screen-landscape		: ${screen.width > screen.height ? 1 : 0};
		}
	`;
	document.getElementsByTagName('head')[0].appendChild(e);

	(location_search().dct ?
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
	() => load_script('js/core.js', core_gear_loader))))))))));
}
//------------------------------------------------------------------------------
