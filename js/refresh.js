//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
var refresh = new Idle();
//------------------------------------------------------------------------------
var refresh_away_callback = function() {

	var start = mili_time();

	var req = {
		'module'	: 'pager',
		'handler'	: 'pager',
		'category'	: null,
		'order'		: 'name',
		'direction' : 'asc',
		'pgno'		: pgno
	};

	post_json('proxy.php', req, null,
		// success
		function (element, data) {

			var msg = 'refresh: ';
			var html = assemble_page(data);

			if( current_page !== html ) {

				for( let element of xpath_eval('//body/div[@list]') )
					element.innerHTML = current_page;

				current_page = html;
				msg = 'refreshed: ';

			}

			pages = data.pages;

			if( pgno >= pages )
				pgno = pages > 0 ? pages - 1 : 0;

			var finish = mili_time();
			var ellapsed = finish - start;

			console.log('refresh: ' + ellapsed_time_string(ellapsed));

		}
	);

	refresh.stop();
	refresh.start();
};
//------------------------------------------------------------------------------
refresh.onAway = refresh_away_callback;
refresh.setAwayTimeout(7000);
//refresh.start();
//------------------------------------------------------------------------------
