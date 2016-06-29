//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class HtmlPageState {

	get paging_state_template() {

		return {
			pgno_		: 0,
			pages_ 		: 0,
			page_size_	: 0,
			page_html_	: '',
			order_		: 'name',
			direction_	: 'asc'
		};

	}

	constructor() {

		// paging
		this.paging_state_by_category_ = {
			null : Object.assign({}, this.paging_state_template)
		};

		this.category_		= null;

		// render
		this.start_ 		= 0;
		this.wait_images_	= true;
		this.request_		= null;

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
	}

	static debug(level, s = null) {

		let element = xpath_eval_single('//div[@debug]');
		let p = xpath_eval_single('p[@debug' + level + ']', element);

		p.innerHTML = s;
		p.style.display = s !== null ? 'block' : 'none';

	}

	debug_ellapsed(level, start, http_ellapsed, prefix = '') {

		let finish = microtime();
		let ellapsed = finish - start;

		Render.debug(level, prefix + ellapsed_time_string(ellapsed) + ', ' + http_ellapsed);

	}

	assemble_page(data, invisible) {

		let products = data.products;
		let style = 'visibility: ' + (invisible ? 'hidden' : 'visible');

		style += '; width: ' + sprintf('%.5f', 97.7 / products.length) + '%';

		let html = '';

		for( let i = 0; i < products.length; i++ ) {

			let product = products[i];

			let q = sprintf(Math.trunc(product.quantity) == product.quantity ? '%u' : '%.3f', product.quantity);
			let r = sprintf(Math.trunc(product.reserve) == product.reserve ? '%u' : '%.3f', product.reserve);
			let style_float = i + 1 < products.length ? '; float: left' : '; float: right';

			html +=
				'<div pitem pitem' + i + ' uuid="' + product.uuid + '" style="' + style + style_float + '">'
				+ '<img pimg src="' + product.img_url + '" alt="">'
				+ '<p pname>' + product.name + '</p>'
				+ '<p price>' + product.price + '&nbsp;₽</p>'
				+ '<p pquantity>' + q + (r ? '&nbsp;(' + r + ')' : '') + '</p>'
				+ '<a btn buy>КУПИТЬ</a>'
				+ '</div>';

		}

		return html;

	}

	static hide_cursor() {

		// hide cursor
		if( touch ) {

			xpath_eval_single('//body').style.cursor = 'none';

			for( let a of xpath_eval('//a[@btn or @btc]') )
				a.style.cursor = 'none';

		}

	}

	pager_data_ready(start, element, data) {

		let render = this;
		let state = render.state_;
		let paging_state = state.paging_state_by_category_[state.category_];

		paging_state.page_size_	= data.page_size;
		paging_state.pages_		= data.pages;

		// if pages changed suddenly
		if( paging_state.pgno_ >= paging_state.pages_ ) {
			paging_state.pgno_ = paging_state.pages_ > 0 ? paging_state.pages_ - 1 : 0;
			render.rewrite_page();
		}

		paging_state.page_html_	= this.assemble_page(data, state.wait_images_);
		element.innerHTML		= paging_state.page_html_;


		// make element visible on all images loaded
		if( state.wait_images_ ) {

			let imgs = xpath_eval('div[@pitem]/img', element);
			let cnt = imgs.length;

			for( let img of imgs ) {

				add_event(img, 'load', function () {

					if( --cnt > 0 )
						return;

					for( let e of xpath_eval('div[@pitem]', element) )
						e.style.visibility = 'visible';

					render.debug_ellapsed(1, start, data.ellapsed, 'PAGE: ');
				
				});

			}

		}
		else {

			this.debug_ellapsed(1, start, data.ellapsed, 'PAGE: ');

		}

	}

	rewrite_page() {

		let start = microtime();
		let state = this.state_;
		let paging_state = state.paging_state_by_category_[state.category_];
		let element = xpath_eval_single('//div[@plist]');
		let request = {
			'module'	: 'pager',
			'handler'	: 'pager',
			'category'	: state.category_,
			'order'		: paging_state.order_,
			'direction' : paging_state.direction_,
			'pgno'		: paging_state.pgno_
		};

		Render.debug(0);
		post_json('proxy.php', request, (data) => this.pager_data_ready(start, element, data));

	}

	categories_data_ready(start, element, data) {

		let render = this;
		let state = render.state_;
		let categories = data.categories;
		let html = '';

		for( let i = 0; i < categories.length; i++ ) {

			let c = categories[i];
			let paging_state = state.paging_state_by_category_[c.uuid];

			if( !paging_state ) {

				paging_state = Object.assign({}, state.paging_state_template);
				state.paging_state_by_category_[c.uuid] = paging_state;

			}

			html +=
				'<a btc uuid="' + c.uuid + '"'
					+ (c.uuid === state.category_ ? ' blink' : '')
				+ '>' + c.name + '</a>'
			;

		}

		element.innerHTML = html;

		// set events for new a[@btc] elements
		state.setup_events();

		render.rewrite_page();
		render.debug_ellapsed(0, start, data.ellapsed, 'CATG: ');

	}

	rewrite_category() {

		let start = microtime();
		let state = this.state_;
		let element = xpath_eval_single('//div[@categories]');
		let request = {
			'module'	: 'categorer',
			'handler'	: 'categorer',
			'parent'	: state.category_
		};

		Render.debug(1);
		post_json('proxy.php', request, (data) => this.categories_data_ready(start, element, data));

	}

}
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class HtmlPageEvents extends HtmlPageState {

	constructor() {

		super();

		this.render_ = null;

	}

	events_handler(e) {

		let state = this;
		let render = this.render_;
		let element = e.target;
		let attrs = element.attributes;
		let paging_state = state.paging_state_by_category_[state.category_];
		let touchobj, startx, dist;

		switch( e.type ) {

			case 'touchend'		:

				if( attrs.prev_page ) {

					if( paging_state.pgno_ > 0 ) {
						paging_state.pgno_--;
						render.rewrite_page();
					}

				}
				else if( attrs.next_page ) {

					if( paging_state.pgno_ + 1 < paging_state.pages_ ) {
						paging_state.pgno_++;
						render.rewrite_page();
					}

				}
				else if( attrs.first_page ) {

					if( paging_state.pgno_ != 0 ) {
						paging_state.pgno_ = 0;
						render.rewrite_page();
					}

				}
				else if( attrs.last_page ) {

					let newpgno = paging_state.pages_ > 0 ? paging_state.pages_ - 1 : 0;

					if( newpgno != paging_state.pgno_ ) {
						paging_state.pgno_ = newpgno;
						render.rewrite_page();
					}

				}
				else if( attrs.btc ) {

					// categories buttons

					// switch off blinking current category
					if( state.category_ !== null )
						xpath_eval_single('//div[@categories]/a[@btc and @uuid=\'' + state.category_ + '\']').removeAttribute('blink');

					if( state.category_ !== attrs.uuid.nodeValue ) {
						state.category_ = attrs.uuid.nodeValue;
						element.setAttribute('blink', '');
					}
					else {
						state.category_ = null;
					}

					render.rewrite_page();

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

	setup_events() {

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

		let base = '//div[@plist_controls]/a[@prev_page or @next_page or @first_page or @last_page]';
		// xpath-to-select-multiple-tags
		// //body/*[self::div or self::p or self::a]

		for( let event of events ) {

			for( let element of xpath_eval(base) )
				add_event(element, event , e => this.events_handler(e));

			for( let element of xpath_eval('//div[@categories]/a[@btc]') )
				add_event(element, event , e => this.events_handler(e));

		}

	}

}
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class HtmlPageManager extends HtmlPageEvents {

	constructor() {

		super();

		Render.hide_cursor();

		this.setup_events();

		this.render_ = new Render;
		this.render_.state = this;
		this.render_.rewrite_category();

	}

}
//------------------------------------------------------------------------------
let manager = new HtmlPageManager;
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
/*let idle = new Idle();
//------------------------------------------------------------------------------
let idle_away_callback = function() {

	console.log(new Date().toTimeString() + ": away");

};
//------------------------------------------------------------------------------
let idle_away_back_callback = function() {

	console.log(new Date().toTimeString() + ": back");

};
//------------------------------------------------------------------------------
idle.onAway = idle_away_callback;
idle.onAwayBack = idle_away_back_callback;
idle.setAwayTimeout(15000);
idle.start();*/
//------------------------------------------------------------------------------
