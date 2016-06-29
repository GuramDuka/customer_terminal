//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class HtmlPageState {

	start_				: 0,
	wait_images_		: true,
	pgno_				: 0,
	pages_ 				: 0,
	page_size_			: 0,
	page_html_			: '',
	order_				: 'name',
	direction_			: 'asc',
	category_			: null,

	// render
	request_			: null,
	element_			: null,
	data_				: null

}
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class Render {

	function debug(s) {

		for( let element of xpath_eval('//body/p[@debug]', document) )
			element.innerText = s;

	}

	function debug_ellapsed(state) {

		let finish = microtime();
		let ellapsed = finish - state.start_;

		debug(ellapsed_time_string(ellapsed) + ', ' + state.data_.ellapsed);

	}

	function assemble_page(data, visibility = true) {

		let html = '';
		let products = data.products;
		let style = 'visibility: ' + (visibility ? 'visible' : 'hidden');

		style += '; width: ' + sprintf('%.5f', 100.0 / products.length) + '%';

		for( var i = 0; i < products.length; i++ ) {

			product = products[i];

			let q = sprintf(Math.round(product.quantity) == product.quantity ? '%u' : '%.3f', product.quantity);
			let r = sprintf(Math.round(product.reserve) == product.reserve ? '%u' : '%.3f', product.reserve);
			let style_float = i + 1 < products.length ? '; float: left' : '; float: right';

			html +=
				'<div pitem pitem' + i + ' puuid="' + product.uuid + '" style="' + style + style_float + '">'
				+ '<img pimg src="' + product.img_url + '" alt="">'
				+ '<p pname>' + product.name + '</p>'
				+ '<p price>' + product.price + '&nbsp;₽</p>'
				+ '<p pquantity>' + q + (r ? '&nbsp;(' + r + ')' : '') + '</p>'
				+ '<a btn buy>КУПИТЬ</a>'
				+ '</div>';

		}

		return html;

	}

	function hide_cursor() {

		// hide cursor
		if( touch ) {

			for( let a of xpath_eval('//body', document) )
				a.style.cursor = 'none';

			for( let a of xpath_eval('//*/a[@btn]', document) )
				a.style.cursor = 'none';

		}

	}

	function pager_data_ready() {

		let state = this;

		state.page_size_			= state.data_.page_size;
		state.pages_				= state.data_.pages;
		state.page_html_			= assemble_page(state.data_);
		state.element_.innerHTML	= state.page_html_;

		// make element visible on all images loaded
		if( state.wait_images_ ) {

			let imgs = xpath_eval('div[@pitem]/img', state.element_);
			let cnt = imgs.length;

			for( let img of imgs ) {

				add_event(img, 'load', function () {

					if( --cnt > 0 )
						return;

					for( let e of xpath_eval('div[@pitem]', state.element_) )
						e.style.visibility = 'visible';

					debug_ellapsed(state);
				
				});

			}

		}
		else {

			debug_ellapsed(state);

		}

		this.hide_cursor();

	}

	function render() {

		let state = this;

		state.start_ = microtime();
		state.element_ = xpath_eval_single('//body/div[@list]', document);

		state.request_ = {
			'module'	: 'pager',
			'handler'	: 'pager',
			'category'	: state.category_,
			'order'		: state.order_,
			'direction' : state.direction_,
			'pgno'		: state.pageno_
		};

		post_json('proxy.php', state.request_, state, state.pager_data_ready());

	}

}
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class HtmlPageEvents extends HtmlPageState {

	function events_handler(e) {

		let state = this;
		let element = e.target;
		let attrs = element.attributes;

		var touchobj, startx, dist;

		switch( e.type ) {

			case 'touchend'		:

				if( attrs.prev_page ) {

					if( pgno > 0 ) {
						pgno--;
						rewrite_page();
					}

				}
				else if( attrs.next_page ) {

					if( pgno + 1 < pages ) {
						pgno++;
						rewrite_page();
					}

				}
				else if( attrs.first_page ) {

					if( pgno != 0 ) {
						pgno = 0;
						rewrite_page();
					}

				}
				else if( attrs.last_page ) {

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

	function setup_events() {

		let events = [
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

		for( let event of events ) {

			for( let element of xpath_eval(base, document) )
				add_event(element, event , this.events_handler);

			for( let element of xpath_eval('//body/div[@list]', document) )
				add_event(element, event , this.events_handler);

		}

	}

}
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class HtmlPageManager extends combine(HtmlPageEvents, Render) {

	function initialize() {

		this.setup_events();
		this.render(this);

	}

}
//------------------------------------------------------------------------------
let manager = new HtmlPageManager;
manager.initialize();
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
/*var idle = new Idle();
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
idle.start();*/
//------------------------------------------------------------------------------
