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
