//------------------------------------------------------------------------------
var pgno = 0;
var pages = 0;
var current_page = '';
var preloaded_pgno = 0;
//------------------------------------------------------------------------------
function assemble_page(data) {

	var html = '';

	for( var i = 0; i < data.products.length; i++ ) {

		html +=
			'<div item' + i + ' uuid="' + data.products[i].uuid + '">'
			+ data.products[i].html
			+ '</div>';

	}

	return html;
}
//------------------------------------------------------------------------------
function rewrite_page(pageno = pgno) {

	var start = microtime();

	for( let element of xpath_eval('//body/div[@list]', document) ) {

		var req = {
			'module'	: 'pager',
			'handler'	: 'pager',
			'category'	: null,
			'order'		: 'name',
			'direction' : 'asc',
			'pgno'		: pageno
		};

		post_json('proxy.php', req, element,
			// success
			function (element, data) {

				current_page = assemble_page(data);
				element.innerHTML = current_page;

				/*var cnt = data.products.length;

				// make element visible on all images loaded
				var imgs = xpath_eval('div/img[@pimg]', element);

				for( let img of imgs ) {

					add_event(img, 'load', function () {

						if( --cnt == 0 ) {

							//for( let a of xpath_eval('div', element) )
							for( let a of imgs )
								a.style.visibility = 'visible';

						}
				
					});

				}*/

				pages = data.pages;

				// hide cursor
				if( touch ) {

					for( let a of xpath_eval('//body', document) )
						a.style.cursor = 'none';

					for( let a of xpath_eval('//*/a[@btn]', document) )
						a.style.cursor = 'none';

				}

				var finish = microtime();
				var ellapsed = finish - start;

				for( let element of xpath_eval('//body/p[@debug]', document) )
					element.innerText = ellapsed_time_string(ellapsed) + ', ' + data.ellapsed;

			},
			// error
			function () {}
		);

	}

}
//------------------------------------------------------------------------------
function btn_events_handler(e) {

	var touchobj, startx, dist;

	switch( e.type ) {

		case 'touchend'		:

			if( this.attributes.prev_page ) {

				if( pgno > 0 ) {
					pgno--;
					rewrite_page();
				}

			}
			else if( this.attributes.next_page ) {

				if( pgno + 1 < pages ) {
					pgno++;
					rewrite_page();
				}

			}
			else if( this.attributes.first_page ) {

				if( pgno != 0 ) {
					pgno = 0;
					rewrite_page();
				}

			}
			else if( this.attributes.last_page ) {

				var newpgno = pages > 0 ? pages - 1 : 0;

				if( newpgno != pgno ) {
					pgno = newpgno;
					rewrite_page();
				}

			}
			break;

		case 'touchstart'	:
			touchobj = e.changedTouches[0] // reference first touch point (ie: first finger)
			startx = parseInt(touchobj.clientX) // get x position of touch point relative to left edge of browser
			break;

		case 'touchmove'	:
			touchobj = e.changedTouches[0] // reference first touch point (ie: first finger)
			dist = parseInt(touchobj.clientX) - startx;
			break;

		case 'touchcancel'	:
			break;

		case 'touchenter'	:
			break;

		case 'touchleave'	:
			break;

	}

	//e.preventDefault();

}
//------------------------------------------------------------------------------
function list_events_handler(e) {

	var touchobj, startx, dist;

	switch( e.type ) {

		case 'touchstart'	:
			touchobj = e.changedTouches[0] // reference first touch point (ie: first finger)
			startx = parseInt(touchobj.clientX) // get x position of touch point relative to left edge of browser
			break;

		case 'touchmove'	:
			touchobj = e.changedTouches[0] // reference first touch point (ie: first finger)
			dist = parseInt(touchobj.clientX) - startx;
			break;

		case 'touchend'		:
			break;

		case 'touchcancel'	:
			break;

		case 'touchenter'	:
			break;

		case 'touchleave'	:
			break;

	}

}
//------------------------------------------------------------------------------
function setup_events(e) {

	var events = [
		/*'click',
		'mousedown',
		'mouseenter',
		'mouseleave',
		'mousemove',
		'mouseout',
		'mouseover',
		'mouseup',*/
		'touchstart',
		'touchend',
		'touchcancel',
		'touchmove',
		'touchenter',
		'touchleave'
	];

	var base = '//body/div[@page_controls]/a[@prev_page or @next_page or @first_page or @last_page]';
	// xpath-to-select-multiple-tags
	// //body/*[self::div or self::p or self::a]

	for( let event of events )
		for( let element of xpath_eval(base, document) )
			add_event(element, event , btn_events_handler);

	for( let event of events )
		for( let element of xpath_eval('//body/div[@list]', document) )
			add_event(element, event , list_events_handler);

}
//------------------------------------------------------------------------------
setup_events();
rewrite_page();
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
var idle = new Idle();
//------------------------------------------------------------------------------
var idle_away_callback = function() {

	console.log(new Date().toTimeString() + ": away");

};
//------------------------------------------------------------------------------
var idle_away_back_callback = function() {

	console.log(new Date().toTimeString() + ": back");

};
//------------------------------------------------------------------------------
idle.onAway = idle_away_callback;
idle.onAwayBack = idle_away_back_callback;
idle.setAwayTimeout(15000);
idle.start();
//------------------------------------------------------------------------------
