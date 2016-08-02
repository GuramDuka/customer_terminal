//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
var prefetch = new Idle();
//------------------------------------------------------------------------------
var prefetch_away_callback = function() {

	var start = mili_time();

	var head = document.getElementsByTagName('head')[0];

	if( preloaded_pgno + 1 >= pages ) {

		preloaded_pgno = 0;

		for( let a of head.childNodes )
			if( a.rel == 'prefetch' )
				a.parentNode.removeChild(a);

		console.clear();

	}

	var req = {
		'module'	: 'pager',
		'handler'	: 'pager',
		'category'	: null,
		'order'		: 'name',
		'direction' : 'asc',
		'pgno'		: preloaded_pgno + 1
	};

	post_json('proxy.php', req, null,
		// success
		function (element, data) {

			for( var i = 0; i < data.products.length; i++ ) {

				// browser then start load images in background
				var lnk = document.createElement('link');
       			lnk.setAttribute('rel', 'prefetch');
       			lnk.setAttribute('href', data.products[i].img_url);
				head.appendChild(lnk);

			}

			preloaded_pgno++;

			var finish = mili_time();
			var ellapsed = finish - start;

			console.log('prefetch: ' + ellapsed_time_string(ellapsed));

		}

	);

	prefetch.stop();
	prefetch.start();

};
//------------------------------------------------------------------------------
prefetch.onAway = prefetch_away_callback;
prefetch.setAwayTimeout(1000);
//prefetch.start();
//------------------------------------------------------------------------------
