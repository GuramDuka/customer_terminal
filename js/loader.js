//------------------------------------------------------------------------------
function load_script(url, callback) {

	let find_script = () => {
		let s = document.getElementsByTagName('script');

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

	if( find_script() ) {
		console.log('script already loaded:', url);

		if( typeof callback )
			callback(false);

		return;
	}

	console.log('load script:', url);

	let script		= document.createElement('script');
	script.type		= 'text/javascript';
	script.onload	= () => callback(true);
	script.src		= url;

	document.getElementsByTagName('head')[0].appendChild(script);
}
//------------------------------------------------------------------------------
function core_loader() {
		      load_script('js/misc.js',
		() => load_script('js/hashes.js',
		() => load_script('js/xhrs.js',
		() => load_script('js/idle.js',
		() => load_script('js/sseq.js',
		() => load_script('js/barcode.js',
		() => load_script('js/core-estimator.js',
		() => load_script('js/detect-browser.js',
		() => load_script('js/core.js', () => core()
	)))))))));
}
//------------------------------------------------------------------------------
